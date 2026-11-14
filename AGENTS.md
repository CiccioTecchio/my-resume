# Project purpose

This repository contains Francesco Vicidomini's resume. Its output must remain
accurate, ATS-friendly, accessible, and printable as a two-page A4 PDF.

## Sources of truth

- Resume content lives in [data](data/*.json).
- Presentation lives in [index.html](index.html), [app.js](app.js), and [styles.css](styles.css).
- Preserve the existing JSON schemas and date format.
- Use `null` as `endDate` for ongoing experiences.
- Do not rename existing files unless the task explicitly requires it.

## Content rules

- Use action verb.
- Focus on the results.
- Write resume content in English.
- Never invent achievements, metrics, dates, technologies, responsibilities,
  job titles, or proficiency levels.
- If essential factual information is missing, report the gap.
- Prefer concise, evidence-based bullet points.
- Avoid duplicating the same achievement in the summary, skills, and experience.

## Scope

- Make the smallest change needed for the request.
- Changes must be made to the source files and not directly to the PDF file.
- Do not change layout, dependencies, generated artifacts, or unrelated content
  unless required.
- Do not commit, push, publish, or contact external services unless explicitly asked.

## How to start

## Verification

After changing resume content:

1. Validate every JSON file under [data](data/*.json).
2. Check if the changes are visible at [localhost:8000](http://localhost:8000),
   2.1. If the server isn't started write an error in the chat like "The server isn't available, please run `npm run dev` or `task run`". After the error massage you have to stop to think, return the control to the user, and stop verification.
3. Run `npm run generate-tagged-pdf`.
4. Run `npm run pdf-info`.
5. Confirm that the PDF has two A4 pages and reports `Tagged: yes`.
6. Inspect the final diff for unsupported claims and unrelated changes.
7. Report any check that could not be completed.
