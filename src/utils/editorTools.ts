import type { DesignShape, DesignShapeKind, EditorTool, SlideComment } from "../types";

export type ToolDefinition = {
  id: EditorTool;
  label: string;
  shortcut?: string;
  group: "navigate" | "shape" | "create" | "collaborate" | "component";
};

export const toolDefinitions: ToolDefinition[] = [
  { id: "move", label: "Move", shortcut: "V", group: "navigate" },
  { id: "hand", label: "Hand", shortcut: "H", group: "navigate" },
  { id: "scale", label: "Scale", shortcut: "K", group: "navigate" },
  { id: "rectangle", label: "Rectangle", shortcut: "R", group: "shape" },
  { id: "line", label: "Line", shortcut: "L", group: "shape" },
  { id: "arrow", label: "Arrow", shortcut: "Shift+L", group: "shape" },
  { id: "ellipse", label: "Ellipse", shortcut: "O", group: "shape" },
  { id: "polygon", label: "Polygon", group: "shape" },
  { id: "star", label: "Star", group: "shape" },
  { id: "image", label: "Image/video", group: "shape" },
  { id: "element", label: "Element", group: "create" },
  { id: "pen", label: "Pen", shortcut: "P", group: "create" },
  { id: "pencil", label: "Pencil", shortcut: "Shift+P", group: "create" },
  { id: "text", label: "Text", shortcut: "T", group: "create" },
  { id: "comment", label: "Comment", group: "collaborate" },
  { id: "component", label: "Component", group: "component" },
];

export function editorToolFromKey(key: string, shiftKey: boolean): EditorTool | null {
  const normalized = key.toLowerCase();
  if (normalized === "v") return "move";
  if (normalized === "h") return "hand";
  if (normalized === "k") return "scale";
  if (normalized === "r") return "rectangle";
  if (normalized === "l") return shiftKey ? "arrow" : "line";
  if (normalized === "o") return "ellipse";
  if (normalized === "p") return shiftKey ? "pencil" : "pen";
  if (normalized === "t") return "text";
  return null;
}

export function createDesignShape({
  slideIndex,
  kind,
  sequence,
  patch = {},
}: {
  slideIndex: number;
  kind: DesignShapeKind;
  sequence: number;
  patch?: Partial<DesignShape>;
}): DesignShape {
  const defaults = shapeDefaults[kind];
  return {
    id: `shape-${slideIndex}-${sequence}`,
    slideIndex,
    kind,
    name: defaults.name,
    x: 50,
    y: 44,
    width: defaults.width,
    height: defaults.height,
    zIndex: 60 + sequence,
    rotation: 0,
    fill: defaults.fill,
    stroke: defaults.stroke,
    strokeWidth: defaults.strokeWidth,
    opacity: 1,
    cornerRadius: defaults.cornerRadius,
    text: defaults.text,
    textRole: kind === "text" ? "body" : undefined,
    fontSize: kind === "text" ? 28 : undefined,
    fontWeight: kind === "text" ? 700 : undefined,
    path: defaults.path,
    visible: true,
    locked: false,
    ...patch,
  };
}

export function createSlideComment({
  slideIndex,
  sequence,
  authorEmail,
  patch = {},
}: {
  slideIndex: number;
  sequence: number;
  authorEmail: string;
  patch?: Partial<SlideComment>;
}): SlideComment {
  return {
    id: `comment-${slideIndex}-${sequence}`,
    slideIndex,
    authorEmail,
    text: "New comment",
    x: 56,
    y: 32,
    resolved: false,
    createdAt: new Date().toISOString(),
    ...patch,
  };
}

const shapeDefaults: Record<DesignShapeKind, Pick<DesignShape, "name" | "width" | "height" | "fill" | "stroke" | "strokeWidth" | "cornerRadius" | "text" | "path">> = {
  rectangle: {
    name: "Rectangle",
    width: 24,
    height: 14,
    fill: "#f8fafc",
    stroke: "#0f172a",
    strokeWidth: 1.5,
    cornerRadius: 10,
    text: "",
    path: "",
  },
  line: {
    name: "Line",
    width: 28,
    height: 2,
    fill: "transparent",
    stroke: "#111827",
    strokeWidth: 2,
    cornerRadius: 0,
    text: "",
    path: "",
  },
  arrow: {
    name: "Arrow",
    width: 30,
    height: 8,
    fill: "transparent",
    stroke: "#111827",
    strokeWidth: 2.75,
    cornerRadius: 0,
    text: "",
    path: "",
  },
  ellipse: {
    name: "Ellipse",
    width: 18,
    height: 18,
    fill: "#f8fafc",
    stroke: "#0f172a",
    strokeWidth: 1.5,
    cornerRadius: 999,
    text: "",
    path: "",
  },
  polygon: {
    name: "Polygon",
    width: 18,
    height: 18,
    fill: "#f8fafc",
    stroke: "#0f172a",
    strokeWidth: 1.5,
    cornerRadius: 0,
    text: "",
    path: "50,4 96,92 4,92",
  },
  star: {
    name: "Star",
    width: 18,
    height: 18,
    fill: "#f8fafc",
    stroke: "#0f172a",
    strokeWidth: 1.5,
    cornerRadius: 0,
    text: "",
    path: "50,4 61,37 96,37 68,58 79,92 50,72 21,92 32,58 4,37 39,37",
  },
  text: {
    name: "Text",
    width: 24,
    height: 8,
    fill: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    cornerRadius: 0,
    text: "Text layer",
    path: "",
  },
  pen: {
    name: "Pen path",
    width: 24,
    height: 14,
    fill: "transparent",
    stroke: "#111827",
    strokeWidth: 2,
    cornerRadius: 0,
    text: "",
    path: "10,80 36,20 62,62 90,18",
  },
  pencil: {
    name: "Pencil path",
    width: 24,
    height: 14,
    fill: "transparent",
    stroke: "#111827",
    strokeWidth: 2,
    cornerRadius: 0,
    text: "",
    path: "8,70 22,42 36,64 48,36 64,56 78,30 92,50",
  },
};
