import type { SlideContainer, SlideContainerKind } from "../types";

const DEFAULT_HTML = `<div class="dynamic-container-card"><strong>Container HTML</strong><span>Edit markup, CSS, JS, atau generate dengan AI.</span></div>`;
const DEFAULT_CSS = `.dynamic-container-card {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 18px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  color: #111827;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  text-align: center;
}
.dynamic-container-card span {
  color: #64748b;
  font-size: 13px;
}`;
const DEFAULT_SVG = `<svg viewBox="0 0 320 180" role="img" aria-label="Dynamic SVG"><rect width="320" height="180" rx="22" fill="#f8fafc"/><path d="M48 132 C96 56 168 148 256 64" fill="none" stroke="#2563eb" stroke-width="10" stroke-linecap="round"/><circle cx="256" cy="64" r="18" fill="#14b8a6"/></svg>`;

const defaultByKind: Record<SlideContainerKind, Pick<SlideContainer, "html" | "svg" | "css" | "js" | "imageUrl" | "name" | "width" | "height">> = {
  html: {
    name: "HTML container",
    html: DEFAULT_HTML,
    svg: "",
    css: DEFAULT_CSS,
    js: "",
    imageUrl: "",
    width: 30,
    height: 18,
  },
  svg: {
    name: "SVG container",
    html: "",
    svg: DEFAULT_SVG,
    css: "",
    js: "",
    imageUrl: "",
    width: 30,
    height: 18,
  },
  image: {
    name: "Image container",
    html: "",
    svg: "",
    css: "",
    js: "",
    imageUrl: "/assets/gui-slide-library-overview.svg",
    width: 28,
    height: 20,
  },
};

export function createSlideContainer({
  slideIndex,
  kind,
  sequence,
  provider = "local",
  patch = {},
}: {
  slideIndex: number;
  kind: SlideContainerKind;
  sequence: number;
  provider?: string;
  patch?: Partial<SlideContainer>;
}): SlideContainer {
  const defaults = defaultByKind[kind];
  return {
    id: `container-${slideIndex}-${sequence}`,
    slideIndex,
    provider,
    kind,
    name: defaults.name,
    html: defaults.html,
    svg: defaults.svg,
    css: defaults.css,
    js: defaults.js,
    imageUrl: defaults.imageUrl,
    x: 50,
    y: 42,
    width: defaults.width,
    height: defaults.height,
    zIndex: 40 + sequence,
    depth: "front",
    visible: true,
    locked: false,
    ...patch,
  };
}

export function stripMarkdownCodeFence(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:html|svg|xml)?\s*([\s\S]*?)\s*```$/i);
  return (match?.[1] || trimmed).trim();
}

export function sanitizeContainerMarkup(value: string) {
  return stripMarkdownCodeFence(value)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src|xlink:href)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
    .replace(/(href|src|xlink:href)\s*=\s*'javascript:[^']*'/gi, "$1='#'")
    .replace(/(href|src|xlink:href)\s*=\s*javascript:[^\s>]+/gi, '$1="#"');
}

export function containerRenderableMarkup(container: SlideContainer) {
  if (container.kind === "svg") return sanitizeContainerMarkup(container.svg);
  if (container.kind === "html") return sanitizeContainerMarkup(container.html);
  return "";
}

export function containerElementSrcDoc(container: SlideContainer) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: transparent; }
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      ${sanitizeStyleBlock(container.css)}
    </style>
  </head>
  <body>
    ${sanitizeContainerMarkup(container.html)}
    <script>
      try {
        ${sanitizeScriptBlock(container.js)}
      } catch (error) {
        document.body.dataset.flexPptError = error instanceof Error ? error.message : String(error);
      }
    </script>
  </body>
</html>`;
}

function sanitizeStyleBlock(value = "") {
  return value.replace(/<\/style/gi, "<\\/style");
}

function sanitizeScriptBlock(value = "") {
  return value.replace(/<\/script/gi, "<\\/script");
}
