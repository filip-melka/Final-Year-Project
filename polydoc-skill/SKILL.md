---
name: polydoc-skill
description: Translates a .docx file to a target language using the Polydoc AWS backend.
---

# Polydoc Skill

Translates a `.docx` file to a target language by invoking the Polydoc AWS Lambda backend and returning the translated file.

## Setup

Install dependencies:

```bash
pip install boto3 python-dotenv --break-system-packages
```

## Supported Languages

| Code | Language   |
| ---- | ---------- |
| `cz` | Czech      |
| `es` | Spanish    |
| `pt` | Portuguese |
| `sk` | Slovakian  |
| `fi` | Finnish    |
| `se` | Swedish    |
| `ua` | Ukrainian  |
| `it` | Italian    |
| `fr` | French     |
| `gr` | Greek      |
| `de` | German     |

## Trigger

Activate this skill when the user provides a `.docx` file and mentions translating it. If no language is specified, ask: "Which language would you like to translate to?" and show the supported languages table.

## Usage

Import and call the `translate` function. Use the absolute path to the `polydoc-skill` directory:

```python
import sys
sys.path.insert(0, "/abs/path/to/polydoc-skill")
from scripts.translate import translate

result = translate(
    input_path="/path/to/document.docx",
    language_code="fr"
)
print(result)
```

`output_dir` is optional — omit it to save the translated file alongside the original.

## Display Results

After a successful call (`"output_path"` in result):

1. Confirm: "Translation complete. Saved to: `<output_path>`"
2. Show a metrics table:

| Metric           | Value                     |
| ---------------- | ------------------------- |
| Total segments   | `metrics.total_segments`  |
| Cached segments  | `metrics.reused_segments` |
| Cache reuse rate | `metrics.reuse_rate`%     |
| Cost savings     | $`metrics.cost_savings`   |

3. Open `output_path` in Claude Desktop's native file preview so the user can inspect the translated document.

## On Error

If `result.get("error")` is set, display the error message clearly to the user and do not attempt to open a file.

## Notes

- Lambda timeout is 300 seconds - large documents may take a while.
- Maximum file size is 8 MB.
- Translated segments are cached in ChromaDB; repeated translations of similar content will be faster and cheaper.
