# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Polydoc** — a DOCX translation system that reuses past translations via a vector database (ChromaDB Cloud) to reduce OpenAI API costs. Users upload DOCX files; translated segments are cached as embeddings and reused on future translations.

## Commands

### Frontend (`web-app/`)

```sh
npm install
npm run dev          # Dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npx biome check      # Biome linter/formatter
npx playwright test  # E2E tests (all)
npx playwright test tests/<file>.spec.ts  # Single test file
```

### Backend (Python Lambda)

```sh
cd backend/app
docker build -t translate_lambda:0.1.0 .
# Push to ECR: tag and push after ECR login
```

### Infrastructure (`backend/terraform/`)

```sh
terraform init
terraform plan
terraform apply
```

## Architecture

### Request Flow

1. User uploads DOCX + selects language on the Next.js home page (`/`)
2. `FileContext` (`web-app/context/file-context.tsx`) holds file/language state across pages
3. Translate page posts to `/api/translate` (Next.js route handler)
4. The route handler invokes the AWS Lambda function directly via `@aws-sdk/client-lambda`
5. Lambda (`backend/app/translate_lambda.py`) decodes the base64 DOCX, calls `translate()`, saves result to S3, emits CloudWatch metrics
6. `translate()` in `translate_helper_functions.py`:
   - Extracts runs from paragraphs, tables, headers, footers
   - Embeds each run with `text-embedding-3-small` and queries ChromaDB (cosine distance < 0.3 = cache hit)
   - Sends only uncached segments to GPT-4o in batch
   - Stores new translations back in ChromaDB
7. Frontend fetches the translated DOCX from S3 via `/api/document` and renders it in a SuperDoc editor

### Key Files

| Path | Purpose |
|---|---|
| `web-app/context/file-context.tsx` | Global file/language state; validates DOCX type and 8MB limit |
| `web-app/app/api/translate/route.ts` | Invokes Lambda, validates input |
| `web-app/app/api/document/route.ts` | GET: fetch DOCX or convert to PDF via SuperDoc API; POST: save edited DOCX back to S3 |
| `web-app/lib/aws-clients.ts` | Shared AWS SDK clients (Lambda, S3, CloudWatch); all target `us-east-1` |
| `backend/app/translate_lambda.py` | Lambda entry point; S3 upload and CloudWatch metrics |
| `backend/app/translate_helper_functions.py` | Core translation logic: extraction, ChromaDB lookup, GPT-4o, embedding storage |
| `backend/terraform/` | IaC: S3 bucket, Lambda (container image, 512MB, 300s timeout), IAM |

### Environment Variables

**`web-app/.env`**:
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
TRANSLATE_LAMBDA_FUNCTION=
SUPERDOC_API_KEY=
```

**Lambda environment** (set via Terraform):
```
BUCKET_NAME=
OPENAI_API_KEY=
CHROMA_API_KEY=
```

### CI/CD (`.github/workflows/`)

- `playwright.yml`: Playwright E2E tests on push/PR to `master`
- `aws-provision.yml`: `terraform plan` on PRs to `master` (when `.tf` files change), `terraform apply` on merge to `master`

### ChromaDB Details

- Cloud-hosted at tenant `e261f061-5696-47a2-979a-3ca2bb4ee6da`, database `polydoc`, collection `translations`
- HNSW index with cosine space
- Metadata stores translations keyed by language code (e.g., `{"fr": "translated text"}`)
- A document can have multiple language translations in its metadata

### S3 Key Convention

Translated files are stored at: `{filename}/{languageCode}/{filename}.docx`
