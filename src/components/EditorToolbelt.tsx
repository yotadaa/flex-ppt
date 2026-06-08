import {
  ArrowLongRightIcon,
  ChatBubbleLeftIcon,
  CircleStackIcon,
  CodeBracketSquareIcon,
  CommandLineIcon,
  CubeTransparentIcon,
  CursorArrowRaysIcon,
  DocumentTextIcon,
  HandRaisedIcon,
  MinusIcon,
  PencilIcon,
  PencilSquareIcon,
  PhotoIcon,
  RectangleGroupIcon,
  ScaleIcon,
  SparklesIcon,
  Square2StackIcon,
  StarIcon,
  StopIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import type { AssetItem, DesignShapeKind, EditorTool, SlideContainer } from "../types";
import { toolDefinitions } from "../utils/editorTools";

type EditorToolbeltProps = {
  activeTool: EditorTool;
  assets: AssetItem[];
  canCreateComponent: boolean;
  onSetTool: (tool: EditorTool) => void;
  onAddShape: (kind: DesignShapeKind) => void;
  onAddLayer: (asset: AssetItem, position?: { x: number; y: number; width?: number }) => void;
  onAddContainer: (kind?: "html" | "svg" | "image", patch?: Partial<SlideContainer>) => void;
  onAddComment: () => void;
  onCreateComponent: () => void;
};

const iconByTool: Record<EditorTool, ReactNode> = {
  move: <CursorArrowRaysIcon aria-hidden="true" />,
  hand: <HandRaisedIcon aria-hidden="true" />,
  scale: <ScaleIcon aria-hidden="true" />,
  rectangle: <StopIcon aria-hidden="true" />,
  line: <MinusIcon aria-hidden="true" />,
  arrow: <ArrowLongRightIcon aria-hidden="true" />,
  ellipse: <CircleStackIcon aria-hidden="true" />,
  polygon: <RectangleGroupIcon aria-hidden="true" />,
  star: <StarIcon aria-hidden="true" />,
  image: <PhotoIcon aria-hidden="true" />,
  element: <CodeBracketSquareIcon aria-hidden="true" />,
  pen: <PencilSquareIcon aria-hidden="true" />,
  pencil: <PencilIcon aria-hidden="true" />,
  text: <DocumentTextIcon aria-hidden="true" />,
  comment: <ChatBubbleLeftIcon aria-hidden="true" />,
  component: <CubeTransparentIcon aria-hidden="true" />,
};

const shapeTools = new Set<EditorTool>(["rectangle", "line", "arrow", "ellipse", "polygon", "star", "text", "pen", "pencil"]);

export default function EditorToolbelt({
  activeTool,
  assets,
  canCreateComponent,
  onSetTool,
  onAddShape,
  onAddLayer,
  onAddContainer,
  onAddComment,
  onCreateComponent,
}: EditorToolbeltProps) {
  const imageAsset = assets.find((asset) => ["slide", "isometric", "gui", "reference", "logo"].includes(asset.kind));

  function activate(tool: EditorTool) {
    onSetTool(tool);
    if (shapeTools.has(tool)) {
      onAddShape(tool as DesignShapeKind);
      return;
    }
    if (tool === "image") {
      if (imageAsset) onAddLayer(imageAsset, { x: 50, y: 44, width: 24 });
      return;
    }
    if (tool === "element") {
      onAddContainer("html", {
        name: "Standalone HTML element",
        html: `<main class="dynamic-container-card"><strong>Standalone element</strong><span>Edit HTML, CSS, and JS from Containers.</span></main>`,
      });
      return;
    }
    if (tool === "comment") {
      onAddComment();
      return;
    }
    if (tool === "component") {
      onCreateComponent();
    }
  }

  return (
    <nav className="editor-toolbelt" aria-label="Slide editorial tools">
      <div className="toolbelt-brand" title="Mac-oriented editorial toolbar">
        <CommandLineIcon aria-hidden="true" />
      </div>
      {toolDefinitions.map((tool, index) => (
        <button
          key={tool.id}
          type="button"
          className={`${activeTool === tool.id ? "active" : ""} group-${tool.group}`}
          title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
          aria-label={`${tool.label}${tool.shortcut ? ` shortcut ${tool.shortcut}` : ""}`}
          disabled={tool.id === "component" && !canCreateComponent}
          onClick={() => activate(tool.id)}
        >
          {index === 3 || index === 10 || index === 13 || index === 15 ? <span className="toolbelt-divider" aria-hidden="true" /> : null}
          {iconByTool[tool.id]}
          <span>{tool.shortcut || tool.label}</span>
        </button>
      ))}
      <button
        type="button"
        className="toolbelt-ai"
        title="Generate HTML/SVG structure with AI"
        aria-label="Generate with AI"
        onClick={() => onAddContainer("html", { name: "AI-ready HTML element" })}
      >
        <SparklesIcon aria-hidden="true" />
        <span>AI</span>
      </button>
      <button
        type="button"
        className="toolbelt-video"
        title="Add image or video placeholder"
        aria-label="Add image or video placeholder"
        onClick={() => activate("image")}
      >
        <VideoCameraIcon aria-hidden="true" />
      </button>
    </nav>
  );
}
