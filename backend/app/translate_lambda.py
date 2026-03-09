import boto3
from io import BytesIO
import os
import base64
from docx import Document
from botocore.exceptions import BotoCoreError, ClientError
from translate_helper_functions import translate

s3 = boto3.client("s3")
cloudwatch = boto3.client("cloudwatch")

BUCKET_NAME = os.environ.get("BUCKET_NAME")

def lambda_handler(event, context):
    try:
        # --- Validate event input ---
        filename = event.get("filename")
        language = event.get("language")
        languageCode = event.get("languageCode")
        encoded_doc = event.get("file")

        if not all([filename, language, languageCode, encoded_doc]):
            return {"statusCode": 400, "error": "Missing required parameters"}

        # --- Decode incoming DOCX ---
        try:
            document_data = base64.b64decode(encoded_doc)
            input_buffer = BytesIO(document_data)
        except Exception as e:
            return {"statusCode": 400, "error": f"Invalid base64 document: {str(e)}"}

        # --- Load DOCX with python-docx ---
        try:
            doc = Document(input_buffer)
        except Exception as e:
            return {"statusCode": 400, "error": f"Failed to parse DOCX: {str(e)}"}

        # --- Translate and count words ---
        try:
            translation_res = translate(doc, language, languageCode)
        except Exception as e:
            return {"statusCode": 500, "error": f"Translation or pricing failed: {str(e)}"}

        # --- Save translated docx to new buffer ---
        try:
            output_buffer = BytesIO()
            doc.save(output_buffer)
            doc_bytes = output_buffer.getvalue()
        except Exception as e:
            return {"statusCode": 500, "error": f"Failed to save translated DOCX: {str(e)}"}

        # --- Upload to S3 ---
        object_key = f"{filename}/{languageCode}/{filename}.docx"
        try:
            s3.upload_fileobj(BytesIO(doc_bytes), BUCKET_NAME, object_key)
        except (BotoCoreError, ClientError) as e:
            return {"statusCode": 500, "error": f"Failed to upload DOCX to S3: {str(e)}"}
    
        cloudwatch.put_metric_data(
            Namespace="FYP/Translations",
            MetricData=[
                {
                    'MetricName': 'TotalSegments',
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': 'dev'
                        }
                    ],
                    'Value': translation_res["total_segments"],
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'ReuseRate',
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': 'dev'
                        }
                    ],
                    'Value': (
                        translation_res["reused_segments"] / translation_res["total_segments"]
                        if translation_res["total_segments"] > 0
                        else 0
                    ),
                    'Unit': 'Percent'
                },
                {
                    'MetricName': 'CostSavings',
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': 'dev'
                        }
                    ],
                    'Value': translation_res["cost_savings"],
                    'Unit': 'Count'
                },
            ]
        )

        return {
            "statusCode": 200,
            "total_segments": translation_res["total_segments"],
            "reused_segments": translation_res["reused_segments"],
            "cost_savings": translation_res["cost_savings"],
            "key": object_key
        }

    except Exception as e:
        # Catch-all for unexpected errors
        return {"statusCode": 500, "error": f"Unexpected error: {str(e)}"}
