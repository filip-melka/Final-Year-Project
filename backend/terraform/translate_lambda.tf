resource "aws_lambda_function" "docx_function" {
  function_name = "translate-lambda"
  role          = aws_iam_role.translate_lambda_exec.arn
  package_type  = "Image"
  image_uri     = "${var.lambda_image_uri}:${var.lambda_image_tag}"
  memory_size = 512
  timeout = 150

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.polydoc_bucket.bucket
      CHROMA_API_KEY = var.chroma_api_key
      OPENAI_API_KEY = var.open_api_key
    }
  }
}

resource "aws_iam_role" "translate_lambda_exec" {
  name               = "translate_lambda_role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_logging" {
  role       = aws_iam_role.translate_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "translate_lambda_s3_policy" {
  statement {
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.polydoc_bucket.arn}/*"]
  }
}

resource "aws_iam_policy" "translate_lambda_s3_policy" {
  name   = "translate_lambda_s3_put_object"
  policy = data.aws_iam_policy_document.translate_lambda_s3_policy.json
}

resource "aws_iam_role_policy_attachment" "translate_lambda_s3_attachment" {
  role       = aws_iam_role.translate_lambda_exec.name
  policy_arn = aws_iam_policy.translate_lambda_s3_policy.arn
}

data "aws_iam_policy_document" "translate_lambda_cloudwatch_policy" {
  statement {
    actions   = ["cloudwatch:PutMetricData"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "translate_lambda_cloudwatch_policy" {
  name   = "translate_lambda_cloudwatch_putmetric"
  policy = data.aws_iam_policy_document.translate_lambda_cloudwatch_policy.json
}

resource "aws_iam_role_policy_attachment" "translate_lambda_cloudwatch_attachment" {
  role       = aws_iam_role.translate_lambda_exec.name
  policy_arn = aws_iam_policy.translate_lambda_cloudwatch_policy.arn
}

data "aws_iam_policy_document" "lambda_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}