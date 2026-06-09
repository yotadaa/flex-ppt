import { describe, expect, it } from "vitest";
import { createDesignShape, createSlideComment, editorToolFromKey, toolDefinitions } from "../src/utils/editorTools";

describe("editor tool model", () => {
  it("defines the requested MVP tool palette with shortcuts", () => {
    expect(toolDefinitions.map((tool) => tool.id)).toEqual([
      "move",
      "hand",
      "scale",
      "rectangle",
      "line",
      "arrow",
      "ellipse",
      "polygon",
      "star",
      "image",
      "element",
      "pen",
      "pencil",
      "text",
      "comment",
      "component",
    ]);
    expect(editorToolFromKey("r", false)).toBe("rectangle");
    expect(editorToolFromKey("l", false)).toBe("line");
    expect(editorToolFromKey("l", true)).toBe("arrow");
    expect(editorToolFromKey("p", false)).toBe("pen");
    expect(editorToolFromKey("p", true)).toBe("pencil");
    expect(editorToolFromKey("t", false)).toBe("text");
    expect(editorToolFromKey("v", false)).toBe("move");
    expect(editorToolFromKey("h", false)).toBe("hand");
    expect(editorToolFromKey("k", false)).toBe("scale");
  });

  it("creates design shapes with stable defaults per kind", () => {
    const rectangle = createDesignShape({ slideIndex: 2, kind: "rectangle", sequence: 3 });
    const text = createDesignShape({ slideIndex: 2, kind: "text", sequence: 4 });
    const arrow = createDesignShape({ slideIndex: 2, kind: "arrow", sequence: 5 });

    expect(rectangle).toMatchObject({
      id: "shape-2-3",
      kind: "rectangle",
      slideIndex: 2,
      width: 24,
      height: 14,
      fill: "#f8fafc",
      stroke: "#0f172a",
    });
    expect(text).toMatchObject({
      text: "Text layer",
      textRole: "body",
      fontSize: 28,
      fontWeight: 700,
    });
    expect(arrow.strokeWidth).toBeGreaterThan(rectangle.strokeWidth);
  });

  it("creates comments as canvas objects", () => {
    const comment = createSlideComment({ slideIndex: 9, sequence: 2, authorEmail: "user@example.com" });

    expect(comment).toMatchObject({
      id: "comment-9-2",
      slideIndex: 9,
      authorEmail: "user@example.com",
      text: "New comment",
      resolved: false,
    });
  });
});
