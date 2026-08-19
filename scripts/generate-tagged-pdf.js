const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const puppeteer = require("puppeteer");

const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.resolve(projectRoot, "dist", "Francesco-Vicidomini-CV.pdf");
const browserPdfPath = path.resolve(projectRoot, "dist", ".browser-tagged.pdf");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function resolveRequestPath(requestUrl) {
  const pathname = new URL(requestUrl, "http://127.0.0.1").pathname;
  const relativePath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const filePath = path.resolve(projectRoot, `.${relativePath}`);
  const relativeToRoot = path.relative(projectRoot, filePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) return null;
  return filePath;
}

function createServer() {
  return http.createServer((request, response) => {
    const filePath = resolveRequestPath(request.url || "/");
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

function closeServer(server) {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function main() {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const server = createServer();
  let browser;

  try {
    const port = await listen(server);
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");

    await page.pdf({
      path: browserPdfPath,
      format: "A4",
      landscape: false,
      displayHeaderFooter: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      outline: true,
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true
    });
  } finally {
    if (browser) await browser.close();
    await closeServer(server);
  }

  const postProcess = spawnSync(
    process.execPath,
    [path.resolve(__dirname, "generate-pdf.js"), browserPdfPath, outputPath],
    { cwd: projectRoot, stdio: "inherit" }
  );

  fs.rmSync(browserPdfPath, { force: true });

  if (postProcess.status !== 0) {
    throw new Error("Metadata post-processing or PDF validation failed.");
  }

  console.log("Tagged PDF generation completed.");
  console.log("Run `npm run pdf-info` and confirm that `Tagged: yes` is reported.");
}

main().catch((error) => {
  fs.rmSync(browserPdfPath, { force: true });
  console.error(`Tagged PDF generation failed: ${error.message}`);
  process.exitCode = 1;
});
