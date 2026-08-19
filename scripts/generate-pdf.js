const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRef,
  PDFString,
} = require("pdf-lib");

const EXPECTED_PAGE_COUNT = 2;
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const SIZE_TOLERANCE = 2;
const projectRoot = path.resolve(__dirname, "..");

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

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function addDocumentIdentifiers(pdf, documentId, instanceId) {
  const id = PDFArray.withContext(pdf.context);
  id.push(PDFHexString.of(documentId.replaceAll("-", "")));
  id.push(PDFHexString.of(instanceId.replaceAll("-", "")));
  pdf.context.trailerInfo.ID = id;
}

function addXmpMetadata(pdf, now, documentId, instanceId) {
  // PDF dates have second precision, so use the same precision in XMP.
  const timestamp = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  // pdf-lib serializes Info/Keywords as a space-separated string.
  const keywords = metadata.keywords.join(" ");
  const xmp = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xmlEscape(metadata.title)}</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>${xmlEscape(metadata.author)}</rdf:li></rdf:Seq></dc:creator>
      <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${xmlEscape(metadata.subject)}</rdf:li></rdf:Alt></dc:description>
      <pdf:Keywords>${xmlEscape(keywords)}</pdf:Keywords>
      <pdf:Producer>pdf-lib post-processing workflow</pdf:Producer>
      <xmp:CreatorTool>Francesco Vicidomini</xmp:CreatorTool>
      <xmp:CreateDate>${timestamp}</xmp:CreateDate>
      <xmp:ModifyDate>${timestamp}</xmp:ModifyDate>
      <xmp:MetadataDate>${timestamp}</xmp:MetadataDate>
      <xmpMM:DocumentID>uuid:${documentId}</xmpMM:DocumentID>
      <xmpMM:InstanceID>uuid:${instanceId}</xmpMM:InstanceID>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  // XMP is deliberately uncompressed: this is friendlier to validators and PDF/A tooling.
  const stream = pdf.context.stream(Buffer.from(xmp, "utf8"), {
    Type: PDFName.of("Metadata"),
    Subtype: PDFName.of("XML"),
  });
  pdf.catalog.set(PDFName.of("Metadata"), pdf.context.register(stream));
}

function loadLinkLabels() {
  const personal = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "personal-info.json"), "utf8"));
  const projects = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "personal-exp.json"), "utf8"));
  const publications = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "publications.json"), "utf8"));
  const labels = new Map([
    [`mailto:${personal.email}`, personal.email],
    [`tel:${personal.phone.replace(/\s/g, "")}`, personal.phone],
    [personal.website.url, personal.website.label],
    [personal.github.url, `GitHub: ${personal.github.label}`],
    [personal.linkedin.url, `LinkedIn: ${personal.linkedin.label}`],
  ]);

  for (const project of projects) {
    if (project.url) labels.set(project.url, project.name);
    if (project.repository) labels.set(project.repository.url, project.repository.label);
    if (project.article) labels.set(project.article.url, project.article.label);
  }
  for (const publication of publications) labels.set(publication.url, publication.title);
  return labels;
}

function resolveObject(pdf, object) {
  return object instanceof PDFRef ? pdf.context.lookup(object) : object;
}

function findLinkedAnnotation(pdf, object) {
  const resolved = resolveObject(pdf, object);
  if (resolved instanceof PDFArray) {
    for (let index = 0; index < resolved.size(); index += 1) {
      const annotation = findLinkedAnnotation(pdf, resolved.get(index));
      if (annotation) return annotation;
    }
    return null;
  }
  if (!(resolved instanceof PDFDict)) return null;

  const linkedObject = resolved.get(PDFName.of("Obj"));
  if (linkedObject) {
    const annotation = resolveObject(pdf, linkedObject);
    if (annotation instanceof PDFDict) return annotation;
  }
  return findLinkedAnnotation(pdf, resolved.get(PDFName.of("K")));
}

function getAnnotationUri(annotation) {
  const action = annotation?.lookupMaybe(PDFName.of("A"), PDFDict);
  const uri = action?.lookupMaybe(PDFName.of("URI"), PDFString, PDFHexString);
  return uri?.decodeText();
}

function addLinkAlternativeText(pdf, labels) {
  const structureTree = pdf.catalog.lookupMaybe(PDFName.of("StructTreeRoot"), PDFDict);
  if (!structureTree) return 0;
  let updated = 0;

  function visit(object) {
    const resolved = resolveObject(pdf, object);
    if (resolved instanceof PDFArray) {
      for (let index = 0; index < resolved.size(); index += 1) visit(resolved.get(index));
      return;
    }
    if (!(resolved instanceof PDFDict)) return;

    if (resolved.get(PDFName.of("S")) === PDFName.of("Link")) {
      const annotation = findLinkedAnnotation(pdf, resolved.get(PDFName.of("K")));
      const uri = getAnnotationUri(annotation);
      if (uri) {
        resolved.set(PDFName.of("Alt"), PDFHexString.fromText(labels.get(uri) || uri));
        updated += 1;
      }
    }
    visit(resolved.get(PDFName.of("K")));
  }

  visit(structureTree.get(PDFName.of("K")));
  return updated;
}

function addLinkDescriptions(pdf) {
  for (const page of pdf.getPages()) {
    const annotations = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
    if (!annotations) continue;

    for (let index = 0; index < annotations.size(); index += 1) {
      const annotation = annotations.lookup(index, PDFDict);
      if (annotation.get(PDFName.of("Subtype")) !== PDFName.of("Link")) continue;
      if (annotation.has(PDFName.of("Contents"))) continue;

      const action = annotation.lookupMaybe(PDFName.of("A"), PDFDict);
      const uri = action?.lookupMaybe(PDFName.of("URI"), PDFString, PDFHexString);
      if (uri) annotation.set(PDFName.of("Contents"), PDFHexString.fromText(uri.decodeText()));
    }
  }
}

function addStandardRoleMappings(pdf) {
  const structureTree = pdf.catalog.lookupMaybe(PDFName.of("StructTreeRoot"), PDFDict);
  if (!structureTree) return;
  let roleMap = structureTree.lookupMaybe(PDFName.of("RoleMap"), PDFDict);
  if (!roleMap) {
    roleMap = pdf.context.obj({});
    structureTree.set(PDFName.of("RoleMap"), roleMap);
  }
  roleMap.set(PDFName.of("Aside"), PDFName.of("Sect"));
  roleMap.set(PDFName.of("Strong"), PDFName.of("Span"));
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
  const documentId = crypto.randomUUID();
  const instanceId = crypto.randomUUID();
  pdf.setTitle(metadata.title, { showInWindowTitleBar: true });
  pdf.setAuthor(metadata.author);
  pdf.setSubject(metadata.subject);
  pdf.setKeywords(metadata.keywords);
  pdf.setLanguage("en");
  pdf.setCreator("Francesco Vicidomini");
  pdf.setProducer("pdf-lib post-processing workflow");
  pdf.setCreationDate(now);
  pdf.setModificationDate(now);
  addDocumentIdentifiers(pdf, documentId, instanceId);
  addXmpMetadata(pdf, now, documentId, instanceId);
  addLinkDescriptions(pdf);
  const describedStructureLinks = addLinkAlternativeText(pdf, loadLinkLabels());
  addStandardRoleMappings(pdf);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, await pdf.save());

  console.log(`Created: ${outputPath}`);
  console.log(`Pages: ${pages.length} · Format: A4 · Language: en`);
  console.log(`Title: ${metadata.title}`);
  console.log(`Author: ${metadata.author}`);
  console.log(`Structure links with alternative text: ${describedStructureLinks}`);
}

main().catch((error) => {
  console.error(`PDF post-processing failed: ${error.message}`);
  process.exitCode = 1;
});
