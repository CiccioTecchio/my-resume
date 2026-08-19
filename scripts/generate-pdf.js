const fs = require("node:fs");
const path = require("node:path");
const { PDFDocument } = require("pdf-lib");

const EXPECTED_PAGE_COUNT = 2;
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const SIZE_TOLERANCE = 2;

const metadata = {
  title: "Francesco Vicidomini — Software Development Specialist",
  author: "Francesco Vicidomini",
  subject: "Curriculum Vitae — Software Development Specialist",
  keywords: [
    "Angular",
    "TypeScript",
    "RxJS",
    "NgRx",
    "Nx",
    "Cybersecurity",
    "Front-End Development",
    "Software Development",
  ],
};

function printUsage() {
  console.error(
    "Usage: npm run generate-pdf -- <browser-export.pdf> [output.pdf]",
  );
}

function isA4(page) {
  const { width, height } = page.getSize();
  const portrait =
    Math.abs(width - A4_WIDTH) <= SIZE_TOLERANCE &&
    Math.abs(height - A4_HEIGHT) <= SIZE_TOLERANCE;
  const landscape =
    Math.abs(width - A4_HEIGHT) <= SIZE_TOLERANCE &&
    Math.abs(height - A4_WIDTH) <= SIZE_TOLERANCE;
  return portrait || landscape;
}

async function main() {
  const inputArgument = process.argv[2];
  const outputArgument = process.argv[3];

  if (!inputArgument) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const inputPath = path.resolve(inputArgument);
  const outputPath = outputArgument
    ? path.resolve(outputArgument)
    : path.resolve("dist", "Francesco-Vicidomini-CV.pdf");

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input PDF not found: ${inputPath}`);
  }

  if (inputPath === outputPath) {
    throw new Error("Input and output paths must be different.");
  }

  const source = fs.readFileSync(inputPath);
  const pdf = await PDFDocument.load(source, { updateMetadata: false });
  const pages = pdf.getPages();

  if (pages.length !== EXPECTED_PAGE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_PAGE_COUNT} pages, found ${pages.length}. Check the browser print preview before continuing.`,
    );
  }

  const invalidPage = pages.findIndex((page) => !isA4(page));
  if (invalidPage !== -1) {
    const { width, height } = pages[invalidPage].getSize();
    throw new Error(
      `Page ${invalidPage + 1} is not A4 (${width.toFixed(2)} × ${height.toFixed(2)} pt).`,
    );
  }

  const now = new Date();
  pdf.setTitle(metadata.title, { showInWindowTitleBar: true });
  pdf.setAuthor(metadata.author);
  pdf.setSubject(metadata.subject);
  pdf.setKeywords(metadata.keywords);
  pdf.setLanguage("en");
  pdf.setCreator("Francesco Vicidomini");
  pdf.setProducer("pdf-lib post-processing workflow");
  pdf.setCreationDate(now);
  pdf.setModificationDate(now);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, await pdf.save());

  console.log(`Created: ${outputPath}`);
  console.log(`Pages: ${pages.length} · Format: A4 · Language: en`);
  console.log(`Title: ${metadata.title}`);
  console.log(`Author: ${metadata.author}`);
}

main().catch((error) => {
  console.error(`PDF post-processing failed: ${error.message}`);
  process.exitCode = 1;
});
