variable "bucket_name" {
  default = "polydoc-bucket"
}

variable "open_api_key" {
  type      = string
  sensitive = true
}

variable "chroma_api_key" {
  type      = string
  sensitive = true
}

variable "lambda_image_uri" {
  default = "654654626563.dkr.ecr.us-east-1.amazonaws.com/fyp/polydoc"
}

variable "lambda_image_tag" {
  default = "0.0.1"
}