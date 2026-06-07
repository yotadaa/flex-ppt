import type { SlideContainer, SlideContainerKind } from "../types";

const DEFAULT_HTML = `<div class="dynamic-container-card"><strong>Container HTML</strong><span>Edit markup atau generate dengan AI.</span></div>`;
const DEFAULT_SVG = `<svg viewBox="0 0 320 180" role="img" aria-label="Dynamic SVG"><rect width="320" height="180" rx="22" fill="#f8fafc"/><path d="M48 132 C96 56 168 148 256 64" fill="none" stroke="#2563eb" stroke-width="10" stroke-linecap="round"/><circle cx="256" cy="64" r="18" fill="#14b8a6"/></svg>`;

const defaultByKind: Record<SlideContainerKind, Pick<SlideContainer, "html" | "svg" | "imageUrl" | "name" | "width" | "height">> = {
  html: {
    name: "HTML container",
    html: DEFAULT_HTML,
    svg: "",
    imageUrl: "",
    width: 30,
    height: 18,
  },
  svg: {
    name: "SVG container",
    html: "",
    svg: DEFAULT_SVG,
    imageUrl: "",
    width: 30,
    height: 18,
  },
  image: {
    name: "Image container",
    html: "",
    svg: "",
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
