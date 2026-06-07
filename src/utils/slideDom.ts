import type { BaseElementKind, BaseElementLayer, BaseImageLayer, ReferenceEntry, SelectionTarget, Slide } from "../types";

const EXTERNAL_URL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
const MANAGED_ELEMENT_SELECTOR = [
  ".gui-callout",
  "article.card",
  ".controller-card",
  ".metric",
  ".callout",
  ".profile-card",
].join(",");

function appBaseUrl() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "/";
  return base.endsWith("/") ? base : `${base}/`;
}

function publicAssetPath(value: string) {
  const base = appBaseUrl();
  const normalized = value.trim().replace(/\\/g, "/");
  if (base !== "/" && normalized.startsWith(base)) return normalized;
  return normalized
    .replace(/^(\.\.\/)+/, "")
    .replace(/^(\.\/)+/, "")
    .replace(/^\/+/, "");
}

export function publicUrl(value = "") {
  if (!value) return "";
  if (EXTERNAL_URL_PATTERN.test(value)) return value;
  const base = appBaseUrl();
  const path = publicAssetPath(value);
  return base !== "/" && path.startsWith(base) ? path : `${base}${path}`;
}

function storedAssetPath(value = "") {
  if (!value || EXTERNAL_URL_PATTERN.test(value)) return value;
  const base = appBaseUrl();
  const normalized = value.trim().replace(/\\/g, "/");
  const withoutBase = base !== "/" && normalized.startsWith(base)
    ? normalized.slice(base.length)
    : normalized;
  return withoutBase
    .replace(/^(\.\.\/)+/, "")
    .replace(/^(\.\/)+/, "")
    .replace(/^\/+/, "");
}

export function normalizeAssetUrl(value = "") {
  if (!value) return "";
  return publicUrl(value);
}

export function extractBaseImageLayers(html: string, slideIndex: number): BaseImageLayer[] {
  const doc = parseHtml(html);
  return Array.from(doc.querySelectorAll<HTMLImageElement>("img")).map((img, index) => {
    const editId = imageEditId(img, slideIndex, index);
    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "";
    const frame = img.closest(".screen-frame") ? "screen" : undefined;
    return {
      id: `base-${slideIndex}-${editId}`,
      slideIndex,
      editId,
      src,
      alt,
      name: alt || img.className || `Gambar ${index + 1}`,
      frame,
    };
  });
}

export function extractBaseElementLayers(html: string, slideIndex: number): BaseElementLayer[] {
  const doc = parseHtml(html);
  return Array.from(doc.querySelectorAll<HTMLElement>(MANAGED_ELEMENT_SELECTOR)).map((node, index) => {
    const editId = managedElementEditId(node, slideIndex, index);
    return {
      id: `base-element-${slideIndex}-${editId}`,
      slideIndex,
      editId,
      html: node.outerHTML,
      name: managedElementName(node, index),
      kind: managedElementKind(node),
    };
  });
}

export function slideHtmlFor(slide: Slide, edits: Record<number, string>) {
  const html = withManagedElementEditIds(withImageEditIds(edits[slide.index] || slide.html, slide.index), slide.index);
  return withPublicAssetUrls(withActiveChapterChip(html, slide.chapter));
}

export function plainTextFromHtml(html: string) {
  const doc = parseHtml(html);
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

export function highlightSlideSearch(html: string, query: string) {
  const needle = query.trim();
  if (!needle || needle.length < 2) return html;
  const doc = parseHtml(html);
  const root = doc.querySelector("#root");
  if (!root) return html;
  const pattern = new RegExp(escapeRegExp(needle), "gi");
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, svg, mark")) return NodeFilter.FILTER_REJECT;
      pattern.lastIndex = 0;
      return pattern.test(node.textContent || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    const text = node.textContent || "";
    pattern.lastIndex = 0;
    const fragment = doc.createDocumentFragment();
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0;
      if (index > cursor) fragment.appendChild(doc.createTextNode(text.slice(cursor, index)));
      const mark = doc.createElement("mark");
      mark.className = "slide-search-hit";
      mark.textContent = match[0];
      fragment.appendChild(mark);
      cursor = index + match[0].length;
    }
    if (cursor < text.length) fragment.appendChild(doc.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  });

  return root.innerHTML || html;
}

function withActiveChapterChip(html: string, chapter: string) {
  const doc = parseHtml(html);
  const nav = doc.querySelector(".chapter") as HTMLElement | null;
  if (!nav) return html;
  const normalizedChapter = chapter.trim().toLowerCase();
  const chips = Array.from(nav.querySelectorAll<HTMLElement>(".chip"));
  let activeIndex = -1;

  chips.forEach((chip, index) => {
    chip.classList.remove("active");
    chip.removeAttribute("aria-current");
    if (chip.textContent?.trim().toLowerCase() === normalizedChapter) {
      chip.classList.add("active");
      chip.setAttribute("aria-current", "step");
      activeIndex = index;
    }
  });

  if (activeIndex >= 0) {
    nav.style.setProperty("--active-chip-index", String(activeIndex));
  }

  return doc.querySelector("#root")?.innerHTML || html;
}

function parseHtml(html: string) {
  const parser = new DOMParser();
  return parser.parseFromString(`<div id="root">${html}</div>`, "text/html");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function withPublicAssetUrls(html: string) {
  const doc = parseHtml(html);
  doc.querySelectorAll<HTMLElement>("[src], [href]").forEach((node) => {
    const src = node.getAttribute("src");
    if (src) node.setAttribute("src", publicUrl(src));
    const href = node.getAttribute("href");
    if (href) node.setAttribute("href", publicUrl(href));
  });
  return doc.querySelector("#root")?.innerHTML || html;
}

function withImageEditIds(html: string, slideIndex: number) {
  const doc = parseHtml(html);
  Array.from(doc.querySelectorAll<HTMLImageElement>("img")).forEach((img, index) => {
    if (!img.dataset.editId) {
      img.dataset.editId = `base-image-${slideIndex}-${index}`;
    }
  });
  return doc.querySelector("#root")?.innerHTML || html;
}

function withManagedElementEditIds(html: string, slideIndex: number) {
  const doc = parseHtml(html);
  Array.from(doc.querySelectorAll<HTMLElement>(MANAGED_ELEMENT_SELECTOR)).forEach((node, index) => {
    const editId = managedElementEditId(node, slideIndex, index);
    node.dataset.editId = editId;
    node.dataset.managedElementId = `base-element-${slideIndex}-${editId}`;
  });
  return doc.querySelector("#root")?.innerHTML || html;
}

function managedElementEditId(node: HTMLElement, slideIndex: number, index: number) {
  return node.dataset.editId || `base-element-${slideIndex}-${index}`;
}

function managedElementName(node: HTMLElement, index: number) {
  const label = node.querySelector("h3, strong, b")?.textContent?.trim() || node.textContent?.trim().slice(0, 42);
  return label || `Kartu ${index + 1}`;
}

function managedElementKind(node: HTMLElement): BaseElementKind {
  if (node.classList.contains("gui-callout") || node.classList.contains("callout")) return "callout";
  if (node.classList.contains("metric")) return "metric";
  if (node.classList.contains("card") || node.classList.contains("controller-card") || node.classList.contains("profile-card")) return "card";
  return "element";
}

export function replaceElementText(html: string, editId: string, replacement: string) {
  const doc = parseHtml(html);
  const target = doc.querySelector(`[data-edit-id="${CSS.escape(editId)}"]`);
  if (!target) return html;
  const citations = Array.from(target.querySelectorAll(".cite")).map((node) => node.cloneNode(true));
  target.textContent = replacement.trim();
  if (citations.length) {
    target.appendChild(doc.createTextNode(" Rujukan utama: "));
    citations.slice(0, 2).forEach((cite, index) => {
      if (index > 0) target.appendChild(doc.createTextNode(index === citations.length - 1 ? " dan " : ", "));
      target.appendChild(cite);
    });
    target.appendChild(doc.createTextNode("."));
  }
  return doc.querySelector("#root")?.innerHTML || html;
}

export function replaceImageSource(html: string, editId: string, src: string) {
  const doc = parseHtml(html);
  const target = doc.querySelector(`[data-edit-id="${CSS.escape(editId)}"]`) as HTMLImageElement | null;
  if (!target || target.tagName.toLowerCase() !== "img") return html;
  target.setAttribute("src", storedAssetPath(src));
  return doc.querySelector("#root")?.innerHTML || html;
}

export function applyElementStyle(html: string, editId: string, stylePatch: Record<string, string>) {
  const doc = parseHtml(html);
  const target = doc.querySelector(`[data-edit-id="${CSS.escape(editId)}"]`) as HTMLElement | null;
  if (!target) return html;
  Object.entries(stylePatch).forEach(([key, value]) => {
    const cssName = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    if (!value) target.style.removeProperty(cssName);
    else target.style.setProperty(cssName, value);
  });
  return doc.querySelector("#root")?.innerHTML || html;
}

export function targetFromElement(element: HTMLElement, slideIndex: number): SelectionTarget | null {
  let node = element.closest("[data-edit-id]") as HTMLElement | null;
  if (!node) node = element.closest("img") as HTMLElement | null;
  if (!node) return null;
  const tag = node.tagName.toLowerCase();
  const isImage = tag === "img";
  const index = isImage ? Array.from((node.closest(".react-slide-frame") || document).querySelectorAll("img")).indexOf(node as HTMLImageElement) : -1;
  const editId = isImage ? imageEditId(node as HTMLImageElement, slideIndex, Math.max(0, index)) : node.dataset.editId || "";
  return {
    slideIndex,
    editId,
    tag,
    text: (node.innerText || node.getAttribute("alt") || node.getAttribute("src") || "").trim(),
    kind: isImage ? "image" : tag === "p" || tag.startsWith("h") ? "text" : "element",
    imageSrc: isImage ? node.getAttribute("src") || "" : undefined,
  };
}

function imageEditId(img: HTMLImageElement, slideIndex: number, index: number) {
  return img.dataset.editId || `base-image-${slideIndex}-${index}`;
}

export function referenceKey(ref: string) {
  return ref.replace(/[()]/g, "").replace(/\s+/g, " ").trim().replace(/&amp;/g, "&");
}

export function referenceForSlide(entry: ReferenceEntry, slideIndex: number): ReferenceEntry & { page?: number; image?: string; hits?: string[] } {
  const slideEntry = entry.bySlide?.[String(slideIndex)];
  return {
    ...entry,
    ...slideEntry,
    citation: entry.citation,
    title: entry.title,
    file: entry.file,
    articleUrl: entry.articleUrl,
  };
}
