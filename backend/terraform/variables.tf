variable "bucket_name" {
  default = "polydoc-bucket"
}

variable "open_api_key" {
  default = "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"
}

variable "chroma_api_key" {
  default = "ck-HSqPWJe85KSur1xzPqC1RRkf3E2GqCGMxRdXnxmGucS9"
}

variable "lambda_image_uri" {
  default = "654654626563.dkr.ecr.us-east-1.amazonaws.com/fyp/polydoc"
}

variable "lambda_image_tag" {
  default = "0.0.1"
}