import { describe, expect, it } from "vitest";
import { createSlideContainer, sanitizeContainerMarkup, stripMarkdownCodeFence } from "../src/utils/containers";

describe("container utilities", () => {
  it("creates provider-aware slide containers with stable geometry defaults", () => {
    const container = createSlideContainer({
      slideIndex: 3,
      kind: "html",
      sequence: 2,
      provider: "provider_b",
    });

    expect(container.id).toBe("container-3-2");
    expect(container.provider).toBe("provider_b");
    expect(container.slideIndex).toBe(3);
    expect(container.kind).toBe("html");
    expect(container.visible).toBe(true);
    expect(container.locked).toBe(false);
    expect(container.width).toBeGreaterThan(20);
    expect(container.height).toBeGreaterThan(10);
  });

  it("removes dangerous inline behavior from generated HTML and SVG markup", () => {
    const input = `<section onclick="alert(1)"><script>alert(2)</script><img src="javascript:alert(3)" onerror='alert(4)' /><a href=javascript:alert(5)>x</a></section>`;

    const sanitized = sanitizeContainerMarkup(input);

    expect(sanitized).not.toMatch(/script/i);
    expect(sanitized).not.toMatch(/onclick/i);
    expect(sanitized).not.toMatch(/onerror/i);
    expect(sanitized).not.toMatch(/javascript:/i);
    expect(sanitized).toContain("<section");
  });

  it("normalizes OpenAI-compatible code-fenced responses", () => {
    expect(stripMarkdownCodeFence("```html\n<div>ok</div>\n```")).toBe("<div>ok</div>");
    expect(stripMarkdownCodeFence("```svg\n<svg></svg>\n```")).toBe("<svg></svg>");
    expect(stripMarkdownCodeFence("<div>plain</div>")).toBe("<div>plain</div>");
  });
});
