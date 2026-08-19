# Francesco Vicidomini — Résumé

This repository contains my personal resume, built with **HTML5**, **CSS**, and vanilla **JavaScript**.

The page is designed for A4 printing and ATS-friendly text extraction. The final PDF is generated directly from the browser using its built-in **Print → Save as PDF** functionality.

## Résumé data

The content is separated from the presentation and stored in editable JSON files:

| File | Content |
| --- | --- |
| `data/personal-info.json` | Identity, summary, contacts, skills and languages |
| `data/work-exp.json` | Professional experience |
| `data/academy-exp.json` | Academic education |
| `data/personal-exp.json` | Selected professional and personal projects |
| `data/hobbies.json` | Hobbies and personal interests |
| `data/publications.json` | Academic publications and technical articles |

Each experience uses ISO-like dates (`YYYY-MM` or `YYYY`). Set `endDate` to `null` for an ongoing role or project; the page will display it as “Present”.

## Preview locally

The browser must load the JSON files over HTTP. From the repository directory, run:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Export to PDF

Use the browser print dialog and select **Save as PDF** with:

- paper size: A4;
- margins: none;
- scale: 100%;
- headers and footers: disabled;
- background graphics: enabled.

Before sending the PDF, copy and paste its text into a plain-text editor to confirm that headings, dates, companies and descriptions appear in a sensible reading order.

## PDF post-processing

Install the project dependency once:

```sh
npm install
```

After exporting the resume with the browser, add PDF metadata and validate its page count and A4 format with:

```sh
npm run generate-pdf -- "/path/to/browser-export.pdf"
```

The final document is written to `dist/Francesco-Vicidomini-CV.pdf`. To choose a different destination, pass it as the second argument:

```sh
npm run generate-pdf -- "/path/to/browser-export.pdf" "/path/to/final-resume.pdf"
```

The command refuses to create the final file when the input does not contain exactly two A4 pages. It adds title, author, subject, keywords, language, creation date, and producer metadata without changing the visible layout.

Inspect the generated PDF and its metadata with:

```sh
npm run pdf-info
```

### Generate a tagged PDF

Install Puppeteer and its managed Chromium browser after pulling the project changes:

```sh
npm install
```

Generate the resume directly from its HTML source with PDF tags, an accessibility structure, a document outline, and metadata:

```sh
npm run generate-tagged-pdf
```

The result replaces `dist/Francesco-Vicidomini-CV.pdf`. Confirm the output with:

```sh
npm run pdf-info
```

The `Tagged` field must report `yes`. Always compare the generated document visually with the browser-exported reference because Chromium and Firefox can apply slightly different print pagination.
