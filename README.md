# Smart Translation System

## Prerequisites

- AWS CLI v2 (configured with credentials / profile)
- Docker (only for image-based deployment)
- Terraform
- Python 3.11 (only for zip packaging with dependencies)

Replace placeholder values like `<REPO_URI>` with your real ECR repository URI.

## Deploying the Translate Lambda (container image)

Log in to ECR:

```sh
aws ecr get-login-password \
    --region us-east-1 \
| docker login \
    --username AWS \
    --password-stdin <REPO_URI>
```

Build, tag and push the image (example):

```sh
cd backend/app
docker build -t translate_lambda:0.1.0 .
docker tag translate_lambda:0.1.0 <REPO_URI>:0.1.0
docker push <REPO_URI>:0.1.0
```

> Note: If tag immutability is enabled in your ECR repository you cannot push an already-used tag.

## Issueing AWS Resources

```sh
cd backend/terraform
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```
