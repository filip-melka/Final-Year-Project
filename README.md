# Polydoc

![banner](docs/assets/banner.png)

A smart document translation system that reuses past translations via a vector database to reduce costs. Users upload DOCX files, which are translated using GPT-4o. Translated segments are stored as embeddings in ChromaDB so similar text can be reused in future translations, saving time and money.

### Translation Flow

1. User uploads a DOCX file and selects a target language
2. Frontend sends the file to `/api/translate`, which invokes the AWS Lambda
3. Lambda extracts text segments (paragraphs, tables, headers, footers) from the DOCX
4. Each segment is checked against ChromaDB for similar past translations (cosine distance < 0.3)
5. New or dissimilar segments are translated via GPT-4o; results are stored back in ChromaDB
6. The translated DOCX is saved to S3 and metrics are sent to CloudWatch
7. Frontend displays the result in a SuperDoc editor with translation metrics (reuse rate, cost savings)

## Repository Structure

```
├── web-app/                  # Next.js 16 frontend
│   ├── app/
│   │   ├── api/
│   │   │   ├── translate/    # Lambda invocation endpoint
│   │   │   └── document/     # S3 retrieval & PDF conversion
│   │   ├── translate/        # Translation results page
│   │   └── page.tsx          # Home / file upload page
│   ├── components/           # React components + shadcn/ui
│   ├── context/              # FileContext (file & language state)
│   ├── lib/                  # AWS clients, language map, utilities
│   └── tests/                # Playwright E2E tests
├── backend/
│   ├── app/                  # Python Lambda function
│   │   ├── translate_lambda.py
│   │   ├── translate_helper_functions.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── terraform/            # IaC for AWS resources (S3, Lambda, IAM)
├── polydoc-skill/            # Claude Desktop skill for direct DOCX translation
│   ├── SKILL.md              # Skill definition and usage instructions
│   ├── scripts/
│   │   └── translate.py      # Python client that invokes the Lambda
│   └── .env                  # AWS credentials for the skill
└── .github/workflows/        # CI/CD (Playwright tests, Terraform)
```

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Frontend       | Next.js 16, React 19, TypeScript, TailwindCSS 4 |
| UI             | shadcn/ui, SuperDoc DOCX editor                 |
| Backend        | Python 3.12, AWS Lambda (container image)       |
| Translation    | OpenAI GPT-4o, text-embedding-3-small           |
| Vector DB      | ChromaDB Cloud                                  |
| Storage        | AWS S3                                          |
| Monitoring     | AWS CloudWatch, Grafana                         |
| Infrastructure | Terraform                                       |
| Testing        | Playwright                                      |
| Linting        | Biome                                           |

## Prerequisites

- Node.js 18+
- Python 3.12
- AWS CLI v2 (configured with credentials)
- Docker
- Terraform

## Getting Started

### Frontend

```sh
cd web-app
npm install
npm run dev        # starts dev server on localhost:3000
```

Create `web-app/.env` with:

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
TRANSLATE_LAMBDA_FUNCTION=...
SUPERDOC_API_KEY=...
```

### Backend

Build and push the Lambda container image:

```sh
# Log in to ECR
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin <REPO_URI>

# Build, tag, and push
cd backend/app
docker build -t translate_lambda:0.1.0 .
docker tag translate_lambda:0.1.0 <REPO_URI>:0.1.0
docker push <REPO_URI>:0.1.0
```

### Infrastructure

```sh
cd backend/terraform
terraform init
terraform plan
terraform apply
```

This provisions the S3 bucket, Lambda function (512 MB memory, 300s timeout), and IAM roles/policies.

## Common Commands

```sh
# Frontend (from web-app/)
npm run dev              # Dev server
npm run build            # Production build
npm run lint             # ESLint
npx biome check          # Biome linter/formatter
npx playwright test      # E2E tests

# Backend
cd backend/app
docker build -t translate_lambda:0.1.0 .

# Infrastructure (from backend/terraform/)
terraform plan
terraform apply
```

## Polydoc Skill (Claude Desktop)

The `polydoc-skill/` directory contains a [Claude Desktop](https://claude.ai/download) skill that lets you translate DOCX files directly from a conversation — no browser required.

### Setup

```sh
pip install boto3 python-dotenv --break-system-packages
```

Create `polydoc-skill/.env` with:

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
TRANSLATE_LAMBDA_FUNCTION=...
```

### Usage

Trigger the skill by providing a `.docx` file and asking to translate it. Claude will invoke the Lambda, then display the output path and a metrics table (total segments, cached segments, reuse rate, cost savings).

## CI/CD

- **Playwright tests** run on push/PR to `master`
- **Terraform plan** runs on PRs to `master` when Terraform files change
- **Terraform apply** runs on merge to `master`

## Supported Languages

Czech, Finnish, French, German, Greek, Italian, Portuguese, Slovak, Spanish, Swedish, Ukrainian

## Constraints

- DOCX files only (8 MB max)
- Lambda timeout: 300 seconds
- No authentication layer
