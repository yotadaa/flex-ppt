import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const oldPresenter = path.resolve(
  "C:/skripsi/outputs/manual-20260605-presenter-web/presentations/skripsi-presenter-web/linux-portable/index.html"
);
const oldAssets = path.resolve(
  "C:/skripsi/outputs/manual-20260605-presenter-web/presentations/skripsi-presenter-web/linux-portable/assets"
);
const oldDeck = path.resolve(
  "C:/skripsi/outputs/manual-20260604-123547/presentations/skripsi-deck-revisi/output/skripsi-deck-revisi-final.html"
);
const publicAssets = path.join(root, "public", "assets");
const dataDir = path.join(root, "src", "data");
const publicDataDir = path.join(root, "public", "data");
const slideCssPath = path.join(root, "src", "styles", "slide-source.css");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function extractAssignedJson(html, name) {
  const marker = `window.${name} = `;
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${name}`);
  let i = start + marker.length;
  while (/\s/.test(html[i])) i += 1;
  const opener = html[i];
  const closer = opener === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let esc = false;
  for (let j = i; j < html.length; j += 1) {
    const ch = html[j];
    if (inString) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === opener) depth += 1;
    if (ch === closer) {
      depth -= 1;
      if (depth === 0) return JSON.parse(html.slice(i, j + 1));
    }
  }
  throw new Error(`Unterminated ${name}`);
}

function strip(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addEditIds(section, slideNo) {
  let count = 0;
  let patched = section;

  for (const tag of ["p", "h1"]) {
    const pattern = new RegExp(`<${tag}(?=[\\s>])(?![^>]*data-edit-id=)`, "g");
    patched = patched.replace(pattern, (match) => {
      count += 1;
      return `${match} data-edit-id="s${slideNo}-e${count}"`;
    });
  }

  for (const className of [
    "card",
    "metric",
    "step",
    "flow-node",
    "pipeline-stage",
    "gene",
    "gui-callout",
    "screen-frame",
    "image-box",
  ]) {
    const pattern = new RegExp(`<div(?=\\s+[^>]*class="[^"]*\\b${className}\\b)(?![^>]*data-edit-id=)`, "g");
    patched = patched.replace(pattern, (match) => {
      count += 1;
      return `${match} data-edit-id="s${slideNo}-e${count}"`;
    });
  }

  patched = patched.replace(/<img\b/g, () => {
    count += 1;
    return `<img data-edit-id="s${slideNo}-e${count}"`;
  });
  return patched
    .replace(/\sactive\b/g, "")
    .replace(/<section class="([^"]*)"/, `<section class="$1 active"`);
}

function kindFor(file) {
  const lower = file.toLowerCase();
  if (lower.includes("gui")) return "gui";
  if (lower.includes("isometric") || lower.includes("ref-slide")) return "isometric";
  if (lower.includes("reference-pdf")) return "reference";
  if (lower.includes("logo")) return "logo";
  return "slide";
}

function collectAssets(dir, rootDir = dir) {
  const items = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      items.push(...collectAssets(full, rootDir));
      continue;
    }
    if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)) continue;
    const rel = path.relative(rootDir, full).replace(/\\/g, "/");
    items.push({
      id: rel.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase(),
      name: entry.name,
      path: `/assets/${rel}`,
      relativePath: rel,
      kind: kindFor(rel),
      size: fs.statSync(full).size,
    });
  }
  return items;
}

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(publicDataDir, { recursive: true });
copyDir(oldAssets, publicAssets);

const presenterHtml = fs.readFileSync(oldPresenter, "utf8");
const deckHtml = fs.readFileSync(oldDeck, "utf8");
const slideMeta = extractAssignedJson(presenterHtml, "PRESENTER_SLIDES");
const referencePdfs = extractAssignedJson(presenterHtml, "PRESENTER_REFERENCE_PDFS");
const style = (deckHtml.match(/<style>([\s\S]*?)<\/style>/) || [null, ""])[1];
const sections = deckHtml.match(/<section class="slide[\s\S]*?<\/section>/g) || [];
if (sections.length !== 45) throw new Error(`Expected 45 sections, got ${sections.length}`);

const slides = sections.map((section, index) => {
  const meta = slideMeta[index] || {};
  return {
    index: index + 1,
    title: meta.title || strip((section.match(/<h1>([\s\S]*?)<\/h1>/) || [null, `Slide ${index + 1}`])[1]),
    chapter: meta.chapter || "",
    citations: meta.citations || [],
    bodyText: meta.bodyText || strip(section),
    images: meta.images || [],
    html: addEditIds(section, index + 1),
  };
});

const sourceCss = `${style}
.react-slide-frame .slide { display: block; position: relative; }
.react-slide-frame .slide:not(.active) { display: block; }
`;

fs.writeFileSync(slideCssPath, sourceCss, "utf8");
const slidesPayload = JSON.stringify({ slides, referencePdfs }, null, 2);
const assetsPayload = JSON.stringify({ assets: collectAssets(publicAssets) }, null, 2);
fs.writeFileSync(path.join(dataDir, "slides.json"), slidesPayload, "utf8");
fs.writeFileSync(path.join(publicDataDir, "slides.json"), slidesPayload, "utf8");
fs.writeFileSync(path.join(dataDir, "assets.json"), assetsPayload, "utf8");
fs.writeFileSync(path.join(publicDataDir, "assets.json"), assetsPayload, "utf8");

console.log(
  JSON.stringify(
    {
      slideCount: slides.length,
      referenceCount: Object.keys(referencePdfs).length,
      assetCount: collectAssets(publicAssets).length,
      slideCssPath,
    },
    null,
    2
  )
);
