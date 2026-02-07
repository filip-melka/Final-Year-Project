import boto3
from io import BytesIO
import os
import base64
import json
from botocore.exceptions import BotoCoreError, ClientError

s3 = boto3.client("s3")
lambda_client = boto3.client("lambda")

BUCKET_NAME = os.environ.get("BUCKET_NAME")
TRANSLATE_WORKER_FUNCTION = os.environ.get("TRANSLATE_WORKER_FUNCTION")

def lambda_handler(event, context):
    try:
        # --- Validate event input ---
        filename = event.get("filename")
        language = event.get("language")
        languageCode = event.get("languageCode")
        encoded_doc = event.get("file")

        if not all([filename, language, languageCode, encoded_doc]):
            return {"statusCode": 400, "error": "Missing required parameters"}


        # --- Verify and forward DOCX to translation worker lambda ---
        try:
            # validate base64
            _ = base64.b64decode(encoded_doc)
        except Exception as e:
            return {"statusCode": 400, "error": f"Invalid base64 document: {str(e)}"}

        if not TRANSLATE_WORKER_FUNCTION:
            return {"statusCode": 500, "error": "TRANSLATE_WORKER_FUNCTION env var not set"}

        # Prepare payload for worker lambda
        worker_payload = {
            "file": encoded_doc,
            "language": language,
            "languageCode": languageCode
        }

        try:
            response = lambda_client.invoke(
                FunctionName=TRANSLATE_WORKER_FUNCTION,
                InvocationType='RequestResponse',
                Payload=json.dumps(worker_payload).encode('utf-8')
            )
        except (BotoCoreError, ClientError) as e:
            return {"statusCode": 500, "error": f"Failed to invoke translation worker: {str(e)}"}

        # Read and parse worker response
        try:
            payload_stream = response.get('Payload')
            payload_bytes = payload_stream.read()
            worker_result = json.loads(payload_bytes.decode('utf-8'))
        except Exception as e:
            return {"statusCode": 500, "error": f"Invalid response from worker: {str(e)}"}

        if worker_result.get('statusCode') != 200:
            return {"statusCode": worker_result.get('statusCode', 500), "error": worker_result.get('error', 'Worker failed')}

        try:
            translated_b64 = worker_result.get('translated_file')
            doc_bytes = base64.b64decode(translated_b64)
        except Exception as e:
            return {"statusCode": 500, "error": f"Failed to decode translated file from worker: {str(e)}"}

        # --- Upload to S3 ---
        object_key = f"{filename}/{languageCode}/{filename}.docx"
        try:
            s3.upload_fileobj(BytesIO(doc_bytes), BUCKET_NAME, object_key)
        except (BotoCoreError, ClientError) as e:
            return {"statusCode": 500, "error": f"Failed to upload DOCX to S3: {str(e)}"}
    
        # Use metrics returned from worker
        total_segments = worker_result.get('total_segments', 0)
        reused_segments = worker_result.get('reused_segments', 0)
        cost_savings = worker_result.get('cost_savings', 0)

        return {
            "statusCode": 200,
            "total_segments": total_segments,
            "reused_segments": reused_segments,
            "cost_savings": cost_savings,
            "key": object_key
        }

    except Exception as e:
        # Catch-all for unexpected errors
        return {"statusCode": 500, "error": f"Unexpected error: {str(e)}"}
