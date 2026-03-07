---
description: Analyze code quality and implement fixes
---

Run the following pipeline on $ARGUMENTS (or the current working
directory if no path is given):

1. Use code-analyzer to review the target files and produce a
   structured report.
2. Once complete, pass the full report to code-fixer to implement
   the changes.

Do not run code-fixer until code-analyzer has finished. Present
the final summary of changes to the user when done.
