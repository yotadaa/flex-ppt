const SLIDE_WIDTH = 1536;
const SLIDE_HEIGHT = 864;

const COLOR_FUNCTION_PATTERN =
  /color\((?:srgb|display-p3)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\)/gi;

const COLOR_PROPS = [
  "color",
  "backgroundColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "textDecorationColor",
  "caretColor",
  "columnRuleColor",
  "fill",
  "stroke",
] as const;

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value * 255)));
}

function normalizeModernColor(value: string) {
  return value.replace(COLOR_FUNCTION_PATTERN, (_, red, green, blue, alpha) => {
    const r = clampChannel(Number(red));
    const g = clampChannel(Number(green));
    const b = clampChannel(Number(blue));
    const a = alpha == null ? 1 : Math.max(0, Math.min(1, Number(alpha)));
    return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
  });
}

function sanitizeShadow(value: string) {
  const normalized = normalizeModernColor(value);
  return normalized.includes("color(") ? "none" : normalized;
}

function sanitizeImage(value: string) {
  const normalized = normalizeModernColor(value);
  return normalized.includes("color(") || normalized.includes("color-mix(") ? "none" : normalized;
}

function sanitizeCloneForCanvas(sourceFrame: HTMLElement, clonedFrame: HTMLElement) {
  const sources = [sourceFrame, ...Array.from(sourceFrame.querySelectorAll<HTMLElement | SVGElement>("*"))];
  const clones = [clonedFrame, ...Array.from(clonedFrame.querySelectorAll<HTMLElement | SVGElement>("*"))];

  sources.forEach((source, index) => {
    const clone = clones[index];
    if (!clone) return;

    const computed = window.getComputedStyle(source);
    const cloneStyle = clone instanceof HTMLElement || clone instanceof SVGElement ? clone.style : null;
    if (!cloneStyle) return;

    COLOR_PROPS.forEach((prop) => {
      const value = computed[prop];
      if (value) cloneStyle[prop] = normalizeModernColor(value);
    });

    cloneStyle.backgroundImage = sanitizeImage(computed.backgroundImage);
    cloneStyle.boxShadow = sanitizeShadow(computed.boxShadow);
    cloneStyle.textShadow = sanitizeShadow(computed.textShadow);

    if (computed.filter.includes("color(")) {
      cloneStyle.filter = "none";
    }
  });
}

export async function downloadDeckPdf(filename = "skripsi-presenter.pdf") {
  document.body.classList.add("pdf-exporting");
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    await document.fonts?.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const frames = Array.from(document.querySelectorAll<HTMLElement>(".print-deck-frame"));
    if (!frames.length) throw new Error("Print deck frame tidak ditemukan.");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [SLIDE_WIDTH, SLIDE_HEIGHT],
      compress: true,
      hotfixes: ["px_scaling"],
    });

    for (const [index, frame] of frames.entries()) {
      const canvas = await html2canvas(frame, {
        backgroundColor: "#ffffff",
        imageTimeout: 15000,
        logging: false,
        scale: 1,
        useCORS: true,
        windowWidth: SLIDE_WIDTH,
        windowHeight: SLIDE_HEIGHT,
        onclone: (_clonedDocument, clonedFrame) => {
          sanitizeCloneForCanvas(frame, clonedFrame as HTMLElement);
        },
      });

      if (index > 0) pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], "landscape");
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
    }

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } finally {
    document.body.classList.remove("pdf-exporting");
  }
}
