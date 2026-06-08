import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { AssetsData, BaseElementLayer, BaseElementOverride, BaseImageLayer, BaseImageOverride, DesignShapeKind, EditorTool, SlidesData, ThesisData } from "../types";
import { containerRenderableMarkup } from "../utils/containers";
import { editorToolFromKey } from "../utils/editorTools";
import { extractBaseElementLayers, extractBaseImageLayers, highlightSlideSearch, normalizeAssetUrl, plainTextFromHtml, slideHtmlFor } from "../utils/slideDom";
import { useEditorState } from "../hooks/useEditorState";
import Toolbar from "./Toolbar";
import EditorToolbelt from "./EditorToolbelt";
import SlideRail from "./SlideRail";
import SlideCanvas from "./SlideCanvas";
import Inspector from "./Inspector";
import DetailModal from "./DetailModal";
import CommandPalette from "./CommandPalette";
import SettingsModal from "./SettingsModal";
import { downloadDeckPdf } from "../utils/exportPdf";

type AppShellProps = {
  projectId: string;
  projectTitle: string;
  userEmail: string;
  slidesData: SlidesData;
  thesisData: ThesisData;
  assetsData: AssetsData;
  onReturnToDashboard: () => void;
};

const FONT_STACKS = {
  inter: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  jakarta: '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, sans-serif',
  noto: '"Noto Sans", Inter, ui-sans-serif, system-ui, sans-serif',
  sourceSerif: '"Source Serif 4", Georgia, "Times New Roman", serif',
  robotoSlab: '"Roboto Slab", Georgia, "Times New Roman", serif',
  system: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: '"Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  rounded: '"Trebuchet MS", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
} as const;

const creationShapeTools: EditorTool[] = ["rectangle", "line", "arrow", "ellipse", "polygon", "star", "text", "pen", "pencil"];

export default function AppShell({ projectId, projectTitle, userEmail, slidesData, thesisData, assetsData, onReturnToDashboard }: AppShellProps) {
  const initialSlideHtmlByIndex = useMemo(
    () => Object.fromEntries(slidesData.slides.map((slide) => [slide.index, slide.html])),
    [slidesData.slides],
  );
  const editor = useEditorState(slidesData.slides.length, initialSlideHtmlByIndex, projectId);
  const { state } = editor;
  const [modalOpen, setModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresentingFallback, setIsPresentingFallback] = useState(false);
  const [slideSearch, setSlideSearch] = useState("");
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const isPresenting = isFullscreen || isPresentingFallback;

  const activeSlide = useMemo(
    () => slidesData.slides.find((slide) => slide.index === state.currentSlide) || slidesData.slides[0],
    [slidesData.slides, state.currentSlide],
  );
  const activeHtml = useMemo(
    () => slideHtmlFor(activeSlide, state.slideHtmlByIndex),
    [activeSlide, state.slideHtmlByIndex],
  );
  const renderedActiveHtml = useMemo(
    () => highlightSlideSearch(activeHtml, slideSearch),
    [activeHtml, slideSearch],
  );
  const printableSlides = useMemo(
    () => slidesData.slides.map((slide) => ({ index: slide.index, html: slideHtmlFor(slide, state.slideHtmlByIndex) })),
    [slidesData.slides, state.slideHtmlByIndex],
  );
  const activeLayers = useMemo(
    () => state.layers.filter((layer) => layer.slideIndex === activeSlide.index),
    [activeSlide.index, state.layers],
  );
  const activeContainers = useMemo(
    () => state.containers.filter((container) => container.slideIndex === activeSlide.index),
    [activeSlide.index, state.containers],
  );
  const activeShapes = useMemo(
    () => state.shapes.filter((shape) => shape.slideIndex === activeSlide.index),
    [activeSlide.index, state.shapes],
  );
  const activeComments = useMemo(
    () => state.comments.filter((comment) => comment.slideIndex === activeSlide.index),
    [activeSlide.index, state.comments],
  );
  const activeBaseImages = useMemo(
    () => enrichBaseImages(extractBaseImageLayers(activeHtml, activeSlide.index), state.baseImageOverrides),
    [activeHtml, activeSlide.index, state.baseImageOverrides],
  );
  const activeBaseElements = useMemo(
    () => enrichBaseElements(extractBaseElementLayers(activeHtml, activeSlide.index), state.baseElementOverrides),
    [activeHtml, activeSlide.index, state.baseElementOverrides],
  );
  const chapterStartByName = useMemo(() => {
    const entries = new Map<string, number>();
    slidesData.slides.forEach((slide) => {
      if (!entries.has(slide.chapter)) entries.set(slide.chapter, slide.index);
    });
    return Object.fromEntries(entries);
  }, [slidesData.slides]);
  const slideSearchMatches = useMemo(() => {
    const q = slideSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    return slidesData.slides
      .filter((slide) => plainTextFromHtml(slideHtmlFor(slide, state.slideHtmlByIndex)).toLowerCase().includes(q))
      .map((slide) => slide.index);
  }, [slidesData.slides, slideSearch, state.slideHtmlByIndex]);

  const goToSearchMatch = useCallback((direction: 1 | -1) => {
    if (!slideSearchMatches.length) return;
    const currentPosition = slideSearchMatches.indexOf(state.currentSlide);
    const nextPosition = currentPosition === -1
      ? (direction > 0 ? 0 : slideSearchMatches.length - 1)
      : (currentPosition + direction + slideSearchMatches.length) % slideSearchMatches.length;
    editor.goToSlide(slideSearchMatches[nextPosition]);
  }, [editor, slideSearchMatches, state.currentSlide]);

  const toggleFullscreen = useCallback(async () => {
    const root = document.querySelector(".app-shell") as HTMLElement | null;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsPresentingFallback(false);
      return;
    }

    if (isPresentingFallback) {
      setIsPresentingFallback(false);
      return;
    }

    if (!root || !document.fullscreenEnabled || !root.requestFullscreen) {
      setIsPresentingFallback(true);
      return;
    }

    try {
      await root.requestFullscreen();
      setIsPresentingFallback(false);
    } catch {
      setIsPresentingFallback(true);
    }
  }, [isPresentingFallback]);

  const exportPdf = useCallback(async () => {
    if (isPdfExporting) return;
    setIsPdfExporting(true);
    try {
      await downloadDeckPdf("skripsi-presenter-react.pdf");
    } finally {
      setIsPdfExporting(false);
    }
  }, [isPdfExporting]);

  useEffect(() => {
    const handler = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) setIsPresentingFallback(false);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (!isPresenting || (!state.selectedLayerId && !state.selectedTarget)) return;
    editor.selectLayer(null);
    editor.selectTarget(null);
  }, [editor, isPresenting, state.selectedLayerId, state.selectedTarget]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      const editing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (editing) return;
      if (event.key === "ArrowRight") editor.goToSlide(state.currentSlide + 1);
      if (event.key === "ArrowLeft") editor.goToSlide(state.currentSlide - 1);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") editor.undo();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") editor.redo();
      const tool = editorToolFromKey(event.key, event.shiftKey);
      if (tool && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        editor.setActiveTool(tool);
        if (creationShapeTools.includes(tool)) {
          editor.addShape(tool as DesignShapeKind);
        }
        return;
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, state.currentSlide, toggleFullscreen]);

  return (
    <div
      className={`app-shell ${isPresenting ? "is-presenting" : ""}`}
      data-font-family={state.fontFamily}
      style={{ "--presenter-font": FONT_STACKS[state.fontFamily] } as CSSProperties}
    >
      <Toolbar
        state={state}
        projectTitle={projectTitle}
        slideCount={slidesData.slides.length}
        isFullscreen={isPresenting}
        searchQuery={slideSearch}
        searchMatchCount={slideSearchMatches.length}
        onGoToSlide={editor.goToSlide}
        onSearchChange={setSlideSearch}
        onSearchPrev={() => goToSearchMatch(-1)}
        onSearchNext={() => goToSearchMatch(1)}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleFullscreen={toggleFullscreen}
        onReturnToDashboard={onReturnToDashboard}
      />
      <EditorToolbelt
        activeTool={state.activeTool}
        assets={assetsData.assets}
        canCreateComponent={Boolean(state.selectedLayerId && (
          state.shapes.some((shape) => shape.id === state.selectedLayerId)
          || state.containers.some((container) => container.id === state.selectedLayerId)
        ))}
        onSetTool={editor.setActiveTool}
        onAddShape={editor.addShape}
        onAddLayer={editor.addLayer}
        onAddContainer={editor.addContainer}
        onAddComment={() => editor.addComment(userEmail)}
        onCreateComponent={editor.createComponentFromSelection}
      />
      <div className="top-progress" aria-hidden="true">
        <span style={{ width: `${(state.currentSlide / slidesData.slides.length) * 100}%` }} />
      </div>

      <div className="workspace-grid">
        <SlideRail
          slides={slidesData.slides}
          currentSlide={state.currentSlide}
          onSelect={editor.goToSlide}
        />
        <SlideCanvas
          slide={activeSlide}
          html={renderedActiveHtml}
          theme={state.theme}
          accent={state.accent}
          isEditingLocked={isPresenting}
          chapterStartByName={chapterStartByName}
          layers={activeLayers}
          containers={activeContainers}
          shapes={activeShapes}
          comments={activeComments}
          baseImages={activeBaseImages}
          baseElements={activeBaseElements}
          selectedLayerId={state.selectedLayerId}
          onRegisterBaseImages={editor.registerBaseImages}
          onRegisterBaseElements={editor.registerBaseElements}
          onSelectTarget={(target) => {
            editor.selectTarget(target);
            setModalOpen(false);
          }}
          onOpenTargetDetail={(target) => {
            editor.selectTarget(target);
            setModalOpen(Boolean(target.kind !== "image"));
          }}
          onSelectLayer={editor.selectLayer}
          onUpdateLayer={editor.updateLayer}
          onUpdateContainer={editor.updateContainer}
          onUpdateShape={editor.updateShape}
          onUpdateComment={editor.updateComment}
          onUpdateBaseImage={editor.updateBaseImage}
          onUpdateBaseElement={editor.updateBaseElement}
          onBeginLayerEdit={editor.beginLayerEdit}
          onBeginContainerEdit={editor.beginContainerEdit}
          onBeginBaseImageEdit={editor.beginBaseImageEdit}
          onBeginBaseElementEdit={editor.beginBaseElementEdit}
          onDeleteLayer={editor.deleteLayer}
          onDeleteBaseImage={editor.deleteBaseImage}
          onDeleteBaseElement={editor.deleteBaseElement}
          onDuplicateLayer={editor.duplicateLayer}
          onDuplicateBaseImage={editor.duplicateBaseImage}
          onUpdateTextStyle={editor.updateTargetStyle}
          onAddLayer={editor.addLayer}
          onNext={() => editor.goToSlide(state.currentSlide + 1)}
          onPrev={() => editor.goToSlide(state.currentSlide - 1)}
          onGoToSlide={editor.goToSlide}
        />
        <Inspector
          state={state}
          slidesData={slidesData}
          thesisData={thesisData}
          assetsData={assetsData}
          onSetTab={editor.setInspectorTab}
          onSetDraftQuery={editor.setDraftQuery}
          onReplaceImage={editor.replaceImage}
          onAddLayer={editor.addLayer}
          onAddContainer={editor.addContainer}
          onUpdateContainer={editor.updateContainer}
          onDeleteContainer={editor.deleteContainer}
          onDuplicateContainer={editor.duplicateContainer}
          onUpdateLayer={editor.updateLayer}
          onDeleteLayer={editor.deleteLayer}
          onDeleteBaseImage={editor.deleteBaseImage}
          onDeleteBaseElement={editor.deleteBaseElement}
          onDuplicateLayer={editor.duplicateLayer}
          onUpdateBaseImage={editor.updateBaseImage}
          onUpdateBaseElement={editor.updateBaseElement}
          onDuplicateBaseImage={editor.duplicateBaseImage}
          onSelectLayer={editor.selectLayer}
          baseImages={activeBaseImages}
          baseElements={activeBaseElements}
          shapes={activeShapes}
          comments={activeComments}
          components={state.components}
          onUpdateShape={editor.updateShape}
          onDeleteShape={editor.deleteShape}
          onDuplicateShape={editor.duplicateShape}
          onUpdateComment={editor.updateComment}
          onDeleteComment={editor.deleteComment}
          onCreateComponent={editor.createComponentFromSelection}
        />
      </div>

      {modalOpen && state.selectedTarget ? (
        <DetailModal
          slide={activeSlide}
          target={state.selectedTarget}
          references={slidesData.referencePdfs}
          thesisBlocks={thesisData.blocks}
          onClose={() => {
            setModalOpen(false);
            editor.selectTarget(null);
          }}
          onShowDraft={(query) => editor.setDraftQuery(query)}
          onReplaceText={(replacement) => editor.replaceText(replacement, state.selectedTarget ?? undefined)}
        />
      ) : null}

      {paletteOpen ? (
        <CommandPalette
          slides={slidesData.slides}
          thesisBlocks={thesisData.blocks}
          assets={assetsData.assets}
          onClose={() => setPaletteOpen(false)}
          onGoToSlide={editor.goToSlide}
          onSetDraftQuery={editor.setDraftQuery}
          onAddLayer={editor.addLayer}
          onToggleFullscreen={toggleFullscreen}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsModal
          theme={state.theme}
          fontFamily={state.fontFamily}
          accent={state.accent}
          isPdfExporting={isPdfExporting}
          onClose={() => setSettingsOpen(false)}
          onThemeChange={editor.setTheme}
          onFontFamilyChange={editor.setFontFamily}
          onAccentChange={editor.setAccent}
          onExportPdf={exportPdf}
          onExportState={editor.exportState}
          onImportState={editor.importState}
          onResetSlide={() => editor.resetSlide(state.currentSlide)}
          onResetAll={editor.resetAll}
        />
      ) : null}

      <div className="print-deck" aria-hidden="true">
        {printableSlides.map((item) => {
          const baseImages = enrichBaseImages(extractBaseImageLayers(item.html, item.index), state.baseImageOverrides);
          const baseElements = enrichBaseElements(extractBaseElementLayers(item.html, item.index), state.baseElementOverrides);
          const managedBaseImages = baseImages.filter((image) => image.x != null && image.y != null && image.width != null);
          const managedBaseElements = baseElements.filter((element) => element.x != null && element.y != null && element.width != null && element.height != null);
          const layers = state.layers.filter((layer) => layer.slideIndex === item.index);
          const backBaseImages = managedBaseImages.filter((image) => (image.depth || "front") === "back");
          const frontBaseImages = managedBaseImages.filter((image) => (image.depth || "front") !== "back");
          const backBaseElements = managedBaseElements.filter((element) => (element.depth || "front") === "back");
          const frontBaseElements = managedBaseElements.filter((element) => (element.depth || "front") !== "back");
          const backLayers = layers.filter((layer) => (layer.depth || "front") === "back");
          const frontLayers = layers.filter((layer) => (layer.depth || "front") !== "back");
          const containers = state.containers.filter((container) => container.slideIndex === item.index);
          const backContainers = containers.filter((container) => (container.depth || "front") === "back");
          const frontContainers = containers.filter((container) => (container.depth || "front") !== "back");
          return (
            <div
              key={item.index}
              className={`react-slide-frame print-deck-frame ${managedBaseImages.length ? "has-managed-base-images" : ""} ${managedBaseElements.length ? "has-managed-base-elements" : ""}`}
              data-slide-theme={state.theme}
              style={{ "--slide-accent": state.accent, "--presenter-font": FONT_STACKS[state.fontFamily] } as CSSProperties}
            >
              <div className="print-html-source" dangerouslySetInnerHTML={{ __html: item.html }} />
              <div className="layer-stage print-layer-stage layer-stage-back" aria-hidden="true">
                {backBaseImages.map((image) => image.visible === false ? null : (
                  <div
                    key={image.id}
                    className={`slide-layer base-image-layer depth-back ${image.frame === "screen" ? "base-screen-frame" : ""}`}
                    style={{
                      left: `${image.x}%`,
                      top: `${image.y}%`,
                      width: `${image.width}%`,
                      zIndex: image.zIndex ?? 12,
                    }}
                  >
                    {image.frame === "screen" ? (
                      <div className="base-screen-bar" aria-hidden="true"><span></span><span></span><span></span></div>
                    ) : null}
                    <img src={normalizeAssetUrl(image.src)} alt={image.alt || image.name} draggable={false} />
                  </div>
                ))}
                {backLayers.map((layer) => layer.visible ? (
                  <div
                    key={layer.id}
                    className="slide-layer depth-back"
                    style={{
                      left: `${layer.x}%`,
                      top: `${layer.y}%`,
                      width: `${layer.width}%`,
                      zIndex: layer.zIndex,
                    }}
                  >
                    <img src={normalizeAssetUrl(layer.src)} alt={layer.name} draggable={false} />
                  </div>
                ) : null)}
                {backBaseElements.map((element) => element.visible === false ? null : (
                  <div
                    key={element.id}
                    className="slide-layer base-element-layer depth-back"
                    data-layer-id={element.id}
                    style={{
                      left: `${element.x}%`,
                      top: `${element.y}%`,
                      width: `${element.width}%`,
                      height: `${element.height}%`,
                      zIndex: element.zIndex ?? 18,
                    }}
                    dangerouslySetInnerHTML={{ __html: element.html }}
                  />
                ))}
                {backContainers.map((container) => container.visible ? (
                  <div
                    key={container.id}
                    className={`slide-layer slide-container-layer depth-back container-${container.kind}`}
                    style={{
                      left: `${container.x}%`,
                      top: `${container.y}%`,
                      width: `${container.width}%`,
                      height: `${container.height}%`,
                      zIndex: container.zIndex,
                    }}
                  >
                    {container.kind === "image" ? (
                      <img src={normalizeAssetUrl(container.imageUrl)} alt={container.name} draggable={false} />
                    ) : (
                      <div className="slide-container-render" dangerouslySetInnerHTML={{ __html: containerRenderableMarkup(container) }} />
                    )}
                  </div>
                ) : null)}
              </div>
              <div className="layer-stage print-layer-stage layer-stage-front" aria-hidden="true">
                {frontBaseImages.map((image) => image.visible === false ? null : (
                  <div
                    key={image.id}
                    className={`slide-layer base-image-layer depth-front ${image.frame === "screen" ? "base-screen-frame" : ""}`}
                    style={{
                      left: `${image.x}%`,
                      top: `${image.y}%`,
                      width: `${image.width}%`,
                      zIndex: image.zIndex ?? 12,
                    }}
                  >
                    {image.frame === "screen" ? (
                      <div className="base-screen-bar" aria-hidden="true"><span></span><span></span><span></span></div>
                    ) : null}
                    <img src={normalizeAssetUrl(image.src)} alt={image.alt || image.name} draggable={false} />
                  </div>
                ))}
                {frontLayers.map((layer) => layer.visible ? (
                  <div
                    key={layer.id}
                    className="slide-layer depth-front"
                    style={{
                      left: `${layer.x}%`,
                      top: `${layer.y}%`,
                      width: `${layer.width}%`,
                      zIndex: layer.zIndex,
                    }}
                  >
                    <img src={normalizeAssetUrl(layer.src)} alt={layer.name} draggable={false} />
                  </div>
                ) : null)}
                {frontBaseElements.map((element) => element.visible === false ? null : (
                  <div
                    key={element.id}
                    className="slide-layer base-element-layer depth-front"
                    data-layer-id={element.id}
                    style={{
                      left: `${element.x}%`,
                      top: `${element.y}%`,
                      width: `${element.width}%`,
                      height: `${element.height}%`,
                      zIndex: element.zIndex ?? 18,
                    }}
                    dangerouslySetInnerHTML={{ __html: element.html }}
                  />
                ))}
                {frontContainers.map((container) => container.visible ? (
                  <div
                    key={container.id}
                    className={`slide-layer slide-container-layer depth-front container-${container.kind}`}
                    style={{
                      left: `${container.x}%`,
                      top: `${container.y}%`,
                      width: `${container.width}%`,
                      height: `${container.height}%`,
                      zIndex: container.zIndex,
                    }}
                  >
                    {container.kind === "image" ? (
                      <img src={normalizeAssetUrl(container.imageUrl)} alt={container.name} draggable={false} />
                    ) : (
                      <div className="slide-container-render" dangerouslySetInnerHTML={{ __html: containerRenderableMarkup(container) }} />
                    )}
                  </div>
                ) : null)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function enrichBaseElements(baseElements: BaseElementLayer[], overrides: Record<string, BaseElementOverride>): BaseElementLayer[] {
  return baseElements.map((element) => {
    const override = overrides[element.id];
    if (!override) return element;
    return {
      ...element,
      ...override,
      html: override.html || element.html,
      name: override.name || element.name,
      kind: override.kind || element.kind,
    };
  });
}

function enrichBaseImages(baseImages: BaseImageLayer[], overrides: Record<string, BaseImageOverride>): BaseImageLayer[] {
  return baseImages.map((image) => {
    const override = overrides[image.id];
    if (!override) return image;
    return {
      ...image,
      ...override,
      src: override.src || image.src,
      name: override.name || image.name,
      alt: override.alt || image.alt,
      frame: override.frame || image.frame,
    };
  });
}
