from pathlib import Path
import os
import boto3
import base64
import json
from dotenv import load_dotenv

load_dotenv()

SUPPORTED_LANGUAGES = {
    "cz": "Czech",
    "es": "Spanish",
    "pt": "Portuguese",
    "sk": "Slovakian",
    "fi": "Finnish",
    "se": "Swedish",
    "ua": "Ukrainian",
    "it": "Italian",
    "fr": "French",
    "gr": "Greek",
    "de": "German",
}


def translate(input_path: str, language_code: str, output_dir: str = None) -> dict:
    """
    Translates a DOCX file to the specified language via the Polydoc AWS Lambda backend.

    Args:
        input_path: Absolute path to the input DOCX file.
        language_code: Target language code (e.g. 'fr', 'de').
        output_dir: Directory to save the translated file. Defaults to the same
                    directory as input_path.

    Returns:
        On success: {"output_path": str, "metrics": {...}}
        On failure: {"error": str}
    """
    if language_code not in SUPPORTED_LANGUAGES:
        supported = ", ".join(f"'{k}' ({v})" for k, v in SUPPORTED_LANGUAGES.items())
        return {"error": f"Unsupported language code '{language_code}'. Supported: {supported}"}

    aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    lambda_function = os.getenv("TRANSLATE_LAMBDA_FUNCTION")
    bucket_name = os.getenv("BUCKET_NAME")

    missing = [
        name for name, val in [
            ("AWS_ACCESS_KEY_ID", aws_access_key_id),
            ("AWS_SECRET_ACCESS_KEY", aws_secret_access_key),
            ("TRANSLATE_LAMBDA_FUNCTION", lambda_function),
            ("BUCKET_NAME", bucket_name),
        ] if not val
    ]
    if missing:
        return {"error": f"Missing environment variables: {', '.join(missing)}. Check polydoc-skill/.env"}

    input_path = Path(input_path)
    if not input_path.exists():
        return {"error": f"Input file does not exist: {input_path}"}
    if not input_path.is_file():
        return {"error": f"Input path is not a file: {input_path}"}

    file_size = input_path.stat().st_size
    if file_size > 8 * 1024 * 1024:
        return {"error": "File exceeds 8MB limit"}

    with open(input_path, "rb") as f:
        encoded_file = base64.b64encode(f.read()).decode("utf-8")

    stem = input_path.stem
    language = SUPPORTED_LANGUAGES[language_code]

    payload = {
        "filename": stem,
        "file": encoded_file,
        "language": language,
        "languageCode": language_code,
    }

    lambda_client = boto3.client(
        "lambda",
        region_name="us-east-1",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
    )

    try:
        response = lambda_client.invoke(
            FunctionName=lambda_function,
            InvocationType="RequestResponse",
            Payload=json.dumps(payload),
        )
    except Exception as e:
        return {"error": f"Failed to invoke Lambda: {e}"}

    lambda_payload = json.loads(response["Payload"].read().decode("utf-8"))

    if lambda_payload.get("statusCode") != 200:
        error_detail = lambda_payload.get("error", lambda_payload)
        return {"error": f"Lambda returned error: {error_detail}"}

    s3_key = lambda_payload["key"]
    total_segments = lambda_payload.get("total_segments", 0)
    reused_segments = lambda_payload.get("reused_segments", 0)
    cost_savings = lambda_payload.get("cost_savings", 0.0)

    if output_dir is None:
        output_dir = input_path.parent
    else:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / f"{stem}_{language_code}.docx"

    s3_client = boto3.client(
        "s3",
        region_name="us-east-1",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
    )

    try:
        s3_client.download_file(
            Bucket=bucket_name,
            Key=s3_key,
            Filename=str(output_path),
        )
    except Exception as e:
        return {"error": f"Failed to download translated file from S3: {e}"}

    reuse_rate = round(reused_segments / total_segments * 100, 2) if total_segments > 0 else 0.0

    return {
        "output_path": str(output_path.resolve()),
        "metrics": {
            "total_segments": total_segments,
            "reused_segments": reused_segments,
            "reuse_rate": reuse_rate,
            "cost_savings": cost_savings,
        },
    }
