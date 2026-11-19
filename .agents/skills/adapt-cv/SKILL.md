---
name: adapt-cv
description: This skill can be run only after the skill `search-job`, because it needs the job opportunities found by the skill search-job. It will adapt my CV to the job opportunity that best matches my skills and preferences. The adaptation will be done in a way that is ATS-friendly, accessible, and printable as a two-page A4 PDF.
---

# Adapt CV

It read the context from the skill `search-job` and adapt [my CV.md](../../../dist/my-resume.md) to the job opportunity that best matches my skills and preferences.

## Before to adapt the CV

1. Ask to user: "For what job opportunity have I adapt the CV? Please, paste the link of the open position"
2. After the user have pasted the job opportunity link you read the web page
3. You can start to purpose some changes to the user

## How to adapt the CV

The main rules to write the CV are defined in the file [AGENTS.md](../../../AGENTS.md).
