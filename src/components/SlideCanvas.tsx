import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsPointingOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
  PhotoIcon,
  RectangleStackIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { AssetItem, BaseElementLayer, BaseElementOverride, BaseImageLayer, BaseImageOverride, DesignShape, FontFamilyName, ImageDepth, SelectionTarget, Slide, SlideComment, SlideContainer, SlideLayer } from "../types";
import { containerElementSrcDoc, containerRenderableMarkup } from "../utils/containers";
import { normalizeAssetUrl, targetFromElement } from "../utils/slideDom";
import { AppButton, ColorField, IconButton, NumberStepper, SelectMenu } from "./ui/controls";

const SLIDE_WIDTH = 1536;
const SLIDE_HEIGHT = 864;

const textFontOptions: Array<{ value: "inherit" | FontFamilyName; label: string; note?: string }> = [
  { value: "inherit", label: "Ikuti slide", note: "Gunakan font tema aktif." },
  { value: "inter", label: "Inter", note: "Sans modern dan netral." },
  { value: "jakarta", label: "Plus Jakarta Sans", note: "Sans hangat untuk akademik." },
  { value: "noto", label: "Noto Sans", note: "Sans stabil untuk teks panjang." },
  { value: "sourceSerif", label: "Source Serif 4", note: "Serif formal." },
  { value: "robotoSlab", label: "Roboto Slab", note: "Slab untuk aksen tegas." },
];

type AlignmentGuide = {
  orientation: "vertical" | "horizontal";
  position: number;
  start: number;
  end: number;
};

type AlignmentDistanceHint = {
  orientation: "horizontal" | "vertical";
  x: number;
  y: number;
  length: number;
  text: string;
};

type AlignmentOverlay = {
  guides: AlignmentGuide[];
  distances: AlignmentDistanceHint[];
};

type SlideCanvasProps = {
  slide: Slide;
  html: string;
  theme: string;
  accent: string;
  isEditingLocked?: boolean;
  chapterStartByName: Record<string, number>;
  layers: SlideLayer[];
  containers: SlideContainer[];
  shapes: DesignShape[];
  comments: SlideComment[];
  baseImages: BaseImageLayer[];
  baseElements: BaseElementLayer[];
  selectedLayerId: string | null;
  onRegisterBaseImages: (images: BaseImageLayer[]) => void;
  onRegisterBaseElements: (elements: BaseElementLayer[]) => void;
  onSelectTarget: (target: SelectionTarget | null) => void;
  onOpenTargetDetail: (target: SelectionTarget) => void;
  onSelectLayer: (layerId: string | null) => void;
  onUpdateLayer: (layerId: string, patch: Partial<SlideLayer>, saveHistory?: boolean, historyBeforePatch?: Partial<SlideLayer>) => void;
  onUpdateContainer: (containerId: string, patch: Partial<SlideContainer>, saveHistory?: boolean, historyBeforePatch?: Partial<SlideContainer>) => void;
  onUpdateShape: (shapeId: string, patch: Partial<DesignShape>) => void;
  onUpdateComment: (commentId: string, patch: Partial<SlideComment>) => void;
  onUpdateBaseImage: (layerId: string, patch: Partial<BaseImageOverride>, saveHistory?: boolean, historyBeforePatch?: Partial<BaseImageOverride>) => void;
  onUpdateBaseElement: (layerId: string, patch: Partial<BaseElementOverride>, saveHistory?: boolean, historyBeforePatch?: Partial<BaseElementOverride>) => void;
  onBeginLayerEdit: (layerId: string, beforePatch?: Partial<SlideLayer>) => void;
  onBeginContainerEdit: (containerId: string, beforePatch?: Partial<SlideContainer>) => void;
  onBeginBaseImageEdit: (layerId: string, beforePatch?: Partial<BaseImageOverride>) => void;
  onBeginBaseElementEdit: (layerId: string, beforePatch?: Partial<BaseElementOverride>) => void;
  onDeleteLayer: (layerId: string) => void;
  onDeleteBaseImage: (layerId: string) => void;
  onDeleteBaseElement: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onDuplicateBaseImage: (layerId: string) => void;
  onUpdateTextStyle: (target: SelectionTarget, stylePatch: Record<string, string>) => void;
  onAddLayer: (asset: AssetItem, position?: { x: number; y: number; width?: number }) => void;
  onGoToSlide: (slide: number) => void;
  onNext: () => void;
  onPrev: () => void;
};

export default function SlideCanvas({
  slide,
  html,
  theme,
  accent,
  isEditingLocked = false,
  chapterStartByName,
  layers,
  containers,
  shapes,
  comments,
  baseImages,
  baseElements,
  selectedLayerId,
  onRegisterBaseImages,
  onRegisterBaseElements,
  onSelectTarget,
  onOpenTargetDetail,
  onSelectLayer,
  onUpdateLayer,
  onUpdateContainer,
  onUpdateShape,
  onUpdateComment,
  onUpdateBaseImage,
  onUpdateBaseElement,
  onBeginLayerEdit,
  onBeginContainerEdit,
  onBeginBaseImageEdit,
  onBeginBaseElementEdit,
  onDeleteLayer,
  onDeleteBaseImage,
  onDeleteBaseElement,
  onDuplicateLayer,
  onDuplicateBaseImage,
  onUpdateTextStyle,
  onAddLayer,
  onGoToSlide,
  onNext,
  onPrev,
}: SlideCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const previousSlideIndexRef = useRef(slide.index);
  const dragRef = useRef<
  | { mode: "move"; kind: "base" | "layer"; id: string; startX: number; startY: number; x: number; y: number; moved: boolean }
    | { mode: "move"; kind: "container"; id: string; startX: number; startY: number; x: number; y: number; moved: boolean }
    | { mode: "move"; kind: "element"; id: string; startX: number; startY: number; x: number; y: number; moved: boolean }
    | { mode: "resize"; kind: "base" | "layer"; id: string; startX: number; width: number; moved: boolean }
    | { mode: "resize"; kind: "container"; id: string; startX: number; startY: number; width: number; height: number; moved: boolean }
    | { mode: "resize"; kind: "element"; id: string; startX: number; startY: number; width: number; height: number; moved: boolean }
    | null
  >(null);
  const gestureRef = useRef<{ pointerId: number; startX: number; startY: number; startTime: number } | null>(null);
  const [imageTip, setImageTip] = useState<
    | { kind: "base"; layerId: string; title: string; x: number; y: number }
    | { kind: "layer"; layerId: string; title: string; x: number; y: number }
    | null
  >(null);
  const [elementTip, setElementTip] = useState<{ layerId: string; title: string; x: number; y: number } | null>(null);
  const [isLayerDragging, setIsLayerDragging] = useState(false);
  const [alignmentOverlay, setAlignmentOverlay] = useState<AlignmentOverlay | null>(null);
  const [textTip, setTextTip] = useState<{
    target: SelectionTarget;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: "inherit" | FontFamilyName;
    color: string;
    padding: number;
  } | null>(null);
  const transitionDirection = slide.index >= previousSlideIndexRef.current ? "forward" : "backward";
  const imageTipPosition = useMemo(() => {
    if (!imageTip) return null;
    const frame = frameRef.current;
    const panel = viewportRef.current?.closest(".canvas-panel");
    const shell = frame?.parentElement;
    if (!frame || !panel || !shell) {
      return {
        left: `${imageTip.x}%`,
        top: `${imageTip.y}%`,
      } satisfies CSSProperties;
    }

    const frameRect = frame.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const tipWidth = 250;
    const tipHeight = 128;
    const margin = 12;
    const selectedLayer = frame.querySelector<HTMLElement>(`.slide-layer[data-layer-id="${escapeSelector(imageTip.layerId)}"]`);
    const selectedRect = selectedLayer?.getBoundingClientRect();
    const anchorX = frameRect.left + (imageTip.x / 100) * frameRect.width - shellRect.left;
    const anchorY = selectedRect ? selectedRect.top - shellRect.top : frameRect.top + (imageTip.y / 100) * frameRect.height - shellRect.top;
    const minCenterX = panelRect.left + tipWidth / 2 + margin - shellRect.left;
    const maxCenterX = Math.max(minCenterX, panelRect.right - tipWidth / 2 - margin - shellRect.left);
    const minTop = panelRect.top + tipHeight + margin - shellRect.top;
    const maxTop = Math.max(minTop, panelRect.bottom - margin - shellRect.top);
    const centerX = Math.max(minCenterX, Math.min(maxCenterX, anchorX));
    const top = Math.max(minTop, Math.min(maxTop, anchorY));
    const arrowX = Math.max(18, Math.min(tipWidth - 18, anchorX - (centerX - tipWidth / 2)));

    return {
      left: `${centerX}px`,
      position: "absolute",
      top: `${top}px`,
      "--tip-arrow-x": `${arrowX}px`,
    } satisfies CSSProperties & Record<"--tip-arrow-x", string>;
  }, [imageTip, scale]);
  const elementTipPosition = useMemo(() => {
    if (!elementTip) return null;
    return floatingTipPosition(elementTip.x, elementTip.y, frameRef.current, viewportRef.current?.closest(".canvas-panel") as HTMLElement | null, elementTip.layerId);
  }, [elementTip, scale]);

  useEffect(() => {
    const resize = () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const styles = window.getComputedStyle(viewport);
      const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const availableWidth = Math.max(0, rect.width - horizontalPadding);
      const availableHeight = Math.max(0, rect.height - verticalPadding);
      setScale(Math.min(availableWidth / SLIDE_WIDTH, availableHeight / SLIDE_HEIGHT));
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    previousSlideIndexRef.current = slide.index;
    setImageTip(null);
    setElementTip(null);
    setIsLayerDragging(false);
    setAlignmentOverlay(null);
    setTextTip(null);
  }, [slide.index]);

  useEffect(() => {
    if (!baseImages.length) return;
    const frame = frameRef.current;
    if (!frame) return;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const frameRect = frame.getBoundingClientRect();
      if (!frameRect.width || !frameRect.height) return;
      const measured = baseImages
        .map((image, index) => {
          const node = frame.querySelector<HTMLImageElement>(`img[data-edit-id="${escapeSelector(image.editId)}"]`);
          if (!node) return null;
          const measuredNode = image.frame === "screen" ? (node.closest(".screen-frame") as HTMLElement | null) || node : node;
          const rect = measuredNode.getBoundingClientRect();
          if (rect.width <= 1 || rect.height <= 1) return null;
          return {
            ...image,
            x: ((rect.left + rect.width / 2 - frameRect.left) / frameRect.width) * 100,
            y: ((rect.top + rect.height / 2 - frameRect.top) / frameRect.height) * 100,
            width: (rect.width / frameRect.width) * 100,
            zIndex: image.zIndex ?? index + 12,
            visible: image.visible ?? true,
            locked: image.locked ?? false,
          };
        })
        .filter(Boolean) as BaseImageLayer[];
      if (measured.length) onRegisterBaseImages(measured);
    };

    const frameId = window.requestAnimationFrame(() => {
      measure();
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [baseImages, html, onRegisterBaseImages, scale, slide.index]);

  useEffect(() => {
    if (!baseElements.length) return;
    const frame = frameRef.current;
    if (!frame) return;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const frameRect = frame.getBoundingClientRect();
      if (!frameRect.width || !frameRect.height) return;
      const measured = baseElements
        .map((element, index) => {
          const node = frame.querySelector<HTMLElement>(`[data-managed-element-id="${escapeSelector(element.id)}"]`);
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          if (rect.width <= 1 || rect.height <= 1) return null;
          return {
            ...element,
            x: ((rect.left + rect.width / 2 - frameRect.left) / frameRect.width) * 100,
            y: ((rect.top + rect.height / 2 - frameRect.top) / frameRect.height) * 100,
            width: (rect.width / frameRect.width) * 100,
            height: (rect.height / frameRect.height) * 100,
            zIndex: element.zIndex ?? index + 18,
            visible: element.visible ?? true,
            locked: element.locked ?? false,
          };
        })
        .filter(Boolean) as BaseElementLayer[];
      if (measured.length) onRegisterBaseElements(measured);
    };

    const frameId = window.requestAnimationFrame(measure);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [baseElements, html, onRegisterBaseElements, scale, slide.index]);

  const managedBaseImages = useMemo(
    () => baseImages.filter((image) => image.x != null && image.y != null && image.width != null),
    [baseImages],
  );
  const managedBaseElements = useMemo(
    () => baseElements.filter((element) => element.x != null && element.y != null && element.width != null && element.height != null),
    [baseElements],
  );
  const backBaseImages = useMemo(() => managedBaseImages.filter((image) => (image.depth || "front") === "back"), [managedBaseImages]);
  const frontBaseImages = useMemo(() => managedBaseImages.filter((image) => (image.depth || "front") !== "back"), [managedBaseImages]);
  const backBaseElements = useMemo(() => managedBaseElements.filter((element) => (element.depth || "front") === "back"), [managedBaseElements]);
  const frontBaseElements = useMemo(() => managedBaseElements.filter((element) => (element.depth || "front") !== "back"), [managedBaseElements]);
  const backLayers = useMemo(() => layers.filter((layer) => (layer.depth || "front") === "back"), [layers]);
  const frontLayers = useMemo(() => layers.filter((layer) => (layer.depth || "front") !== "back"), [layers]);
  const backContainers = useMemo(() => containers.filter((container) => (container.depth || "front") === "back"), [containers]);
  const frontContainers = useMemo(() => containers.filter((container) => (container.depth || "front") !== "back"), [containers]);
  const activeShapes = useMemo(() => shapes.filter((shape) => shape.visible), [shapes]);
  const activeComments = useMemo(() => comments.filter((comment) => !comment.resolved), [comments]);
  const slideProgress = useMemo(() => `${slide.index}`, [slide.index]);

  function isEditInteractionLocked() {
    return isEditingLocked || isPresentationGestureEnabled();
  }

  return (
    <main className="canvas-panel">
      <div className="canvas-meta">
        <div>
          <span className="chapter-pill">{slide.chapter}</span>
          <strong>{slide.title}</strong>
        </div>
        <span>{slideProgress}</span>
      </div>

      <div
        className="slide-viewport"
        ref={viewportRef}
        onPointerDown={(event) => {
          if (!isPresentationGestureEnabled()) return;
          gestureRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startTime: Date.now(),
          };
        }}
        onPointerUp={(event) => {
          const gesture = gestureRef.current;
          gestureRef.current = null;
          if (!gesture || gesture.pointerId !== event.pointerId || !isPresentationGestureEnabled()) return;

          const deltaX = event.clientX - gesture.startX;
          const deltaY = event.clientY - gesture.startY;
          const elapsed = Date.now() - gesture.startTime;
          const viewport = viewportRef.current;
          const rect = viewport?.getBoundingClientRect();
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);
          const isSwipe = absX >= 54 && absX > absY * 1.35 && elapsed < 900;

          if (isSwipe) {
            event.preventDefault();
            if (deltaX < 0) onNext();
            else onPrev();
            return;
          }

          if (!rect || absX > 12 || absY > 12) return;
          const edgeWidth = Math.max(44, rect.width * 0.16);
          const localX = event.clientX - rect.left;
          const interactive = (event.target as HTMLElement).closest(".chapter .chip, button, input, select, textarea, a, [contenteditable='true']");
          if (interactive) return;

          if (localX <= edgeWidth) {
            event.preventDefault();
            onPrev();
          } else if (localX >= rect.width - edgeWidth) {
            event.preventDefault();
            onNext();
          }
        }}
        onPointerCancel={() => {
          gestureRef.current = null;
        }}
        onDragOver={(event) => {
          if (isEditInteractionLocked()) return;
          if (event.dataTransfer.types.includes("application/x-skripsi-asset")) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={(event) => {
          if (isEditInteractionLocked()) return;
          const raw = event.dataTransfer.getData("application/x-skripsi-asset");
          if (!raw) return;
          event.preventDefault();
          const asset = JSON.parse(raw) as AssetItem;
          const shell = frameRef.current?.getBoundingClientRect();
          if (!shell) return;
          const x = Math.max(4, Math.min(96, ((event.clientX - shell.left) / shell.width) * 100));
          const y = Math.max(4, Math.min(94, ((event.clientY - shell.top) / shell.height) * 100));
          onAddLayer(asset, { x, y, width: 20 });
        }}
      >
        <IconButton className="nav-hit left" label="Slide sebelumnya" icon={<ChevronLeftIcon aria-hidden="true" />} onClick={onPrev} />
          <div
            key={slide.index}
            className={`slide-scale-shell slide-enter-${transitionDirection}`}
            style={{
              width: SLIDE_WIDTH * scale,
              height: SLIDE_HEIGHT * scale,
          }}
        >
          <div
            ref={frameRef}
            className={`react-slide-frame ${managedBaseImages.length ? "has-managed-base-images" : ""} ${managedBaseElements.length ? "has-managed-base-elements" : ""} ${containers.length ? "has-dynamic-containers" : ""}`}
            data-slide-theme={theme}
            style={{ transform: `scale(${scale})`, "--slide-accent": accent } as CSSProperties}
            onContextMenu={(event) => {
              if (isEditInteractionLocked()) {
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              const target = event.target as HTMLElement;
              const selected = targetFromElement(target, slide.index);
              const selectedNode = target.closest("[data-edit-id]") as HTMLElement | null;
              if (!selected || !selectedNode || selected.kind === "image") return;
              event.preventDefault();
              event.stopPropagation();
              const frameRect = frameRef.current?.getBoundingClientRect();
              const styles = window.getComputedStyle(selectedNode);
              const fontSize = parseFloat(styles.fontSize) || 18;
              const padding = parseFloat(styles.paddingTop) || 0;
              setImageTip(null);
              setElementTip(null);
              onSelectLayer(null);
              onSelectTarget(null);
              setTextTip({
                target: selected,
                x: frameRect ? ((event.clientX - frameRect.left) / frameRect.width) * 100 : 50,
                y: frameRect ? ((event.clientY - frameRect.top) / frameRect.height) * 100 : 50,
                fontSize: Math.round(fontSize),
                fontFamily: "inherit",
                color: rgbToHex(styles.color) || "#0f172a",
                padding: Math.round(padding),
              });
            }}
            onClick={(event) => {
              const target = event.target as HTMLElement;
              const chapterChip = target.closest(".chapter .chip") as HTMLElement | null;
              if (chapterChip) {
                event.preventDefault();
                event.stopPropagation();
                const chapter = chapterChip.textContent?.trim();
                const targetSlide = chapter ? chapterStartByName[chapter] : undefined;
                if (targetSlide) onGoToSlide(targetSlide);
                return;
              }
              if (isEditInteractionLocked()) {
                setImageTip(null);
                setTextTip(null);
                onSelectLayer(null);
                onSelectTarget(null);
                return;
              }
              const layerHit = target.closest(".slide-layer");
              if (layerHit) return;
              const selected = targetFromElement(target, slide.index);
              const selectedNode = (target.closest("[data-edit-id]") || target.closest("img")) as HTMLElement | null;
              if (selected?.kind === "image" && selectedNode && frameRef.current) {
                const imageRect = selectedNode.getBoundingClientRect();
                const frameRect = frameRef.current.getBoundingClientRect();
                const baseImage = baseImages.find((item) => item.editId === selected.editId);
                if (baseImage) {
                  onSelectTarget(null);
                  onSelectLayer(baseImage.id);
                } else {
                  onSelectLayer(null);
                  onSelectTarget(selected);
                }
                setImageTip({
                  kind: "base",
                  layerId: baseImage?.id || selected.editId,
                  title: baseImage?.name || selected.text || "Gambar slide",
                  x: ((imageRect.left + imageRect.width / 2 - frameRect.left) / frameRect.width) * 100,
                  y: ((imageRect.top - frameRect.top) / frameRect.height) * 100,
                });
              } else {
                onSelectLayer(null);
                onSelectTarget(selected);
                setImageTip(null);
                setElementTip(null);
                setTextTip(null);
              }
            }}
            onDoubleClick={(event) => {
              if (isEditInteractionLocked()) return;
              const target = event.target as HTMLElement;
              if (target.closest(".slide-layer")) return;
              const selected = targetFromElement(target, slide.index);
              if (!selected || selected.kind === "image") return;
              event.preventDefault();
              event.stopPropagation();
              onSelectLayer(null);
              onSelectTarget(selected);
              onOpenTargetDetail(selected);
            }}
          >
            <div className="slide-html-host" dangerouslySetInnerHTML={{ __html: html }} />
            {renderLayerStage("back", backBaseImages, backLayers, backBaseElements, backContainers)}
            {renderLayerStage("front", frontBaseImages, frontLayers, frontBaseElements, frontContainers)}
            {renderShapeStage(activeShapes, activeComments)}
          </div>

          {alignmentOverlay && isLayerDragging ? (
            <div className="alignment-overlay" aria-hidden="true">
              {alignmentOverlay.guides.map((guide, index) => (
                <span
                  key={`guide-${guide.orientation}-${index}`}
                  className={`alignment-guide alignment-guide-${guide.orientation}`}
                  style={
                    guide.orientation === "vertical"
                      ? { left: `${guide.position}px`, top: `${guide.start}px`, height: `${Math.max(12, guide.end - guide.start)}px` }
                      : { top: `${guide.position}px`, left: `${guide.start}px`, width: `${Math.max(12, guide.end - guide.start)}px` }
                  }
                />
              ))}
              {alignmentOverlay.distances.map((hint, index) => (
                <span
                  key={`distance-${hint.orientation}-${index}`}
                  className={`alignment-distance alignment-distance-${hint.orientation}`}
                  style={
                    hint.orientation === "horizontal"
                      ? { left: `${hint.x}px`, top: `${hint.y}px`, width: `${Math.max(16, hint.length)}px` }
                      : { left: `${hint.x}px`, top: `${hint.y}px`, height: `${Math.max(16, hint.length)}px` }
                  }
                >
                  <b>{hint.text}</b>
                </span>
              ))}
            </div>
          ) : null}

          {imageTip && !isEditInteractionLocked() ? (
            <div
              className={`image-layer-tooltip ${imageTip.kind === "base" ? "base-tip" : "overlay-tip"} ${isLayerDragging ? "is-dragging" : ""}`}
              style={imageTipPosition || undefined}
            >
              <div className="image-tip-head">
                <PhotoIcon aria-hidden="true" />
                <strong>{imageTip.title}</strong>
                <IconButton compact label="Tutup kontrol gambar" icon={<XMarkIcon aria-hidden="true" />} onClick={() => setImageTip(null)} />
              </div>
              {imageTip.kind === "base" ? (
                <div className="image-tip-actions">
                  {(() => {
                    const layer = managedBaseImages.find((item) => item.id === imageTip.layerId);
                    if (!layer) return null;
                    const locked = layer.locked === true;
                    const isBehindText = layer.depth === "back";
                    return (
                      <>
                        <AppButton size="sm" icon={locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(layer.id, { locked: !locked })}>{locked ? "Unlock" : "Lock"}</AppButton>
                        <AppButton size="sm" icon={<EyeSlashIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(layer.id, { visible: false })}>Hide</AppButton>
                        <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(layer.id, { zIndex: (layer.zIndex ?? 12) + 1 })}>Front</AppButton>
                        <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(layer.id, { zIndex: Math.max(1, (layer.zIndex ?? 12) - 1) })}>Back</AppButton>
                        <AppButton size="sm" icon={isBehindText ? <ArrowUpIcon aria-hidden="true" /> : <ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(layer.id, { depth: isBehindText ? "front" : "back" })}>{isBehindText ? "Depan teks" : "Belakang teks"}</AppButton>
                        <AppButton size="sm" icon={<DocumentDuplicateIcon aria-hidden="true" />} onClick={() => onDuplicateBaseImage(layer.id)}>Duplicate</AppButton>
                        <AppButton size="sm" variant="danger" icon={<TrashIcon aria-hidden="true" />} onClick={() => { onDeleteBaseImage(layer.id); setImageTip(null); }}>Delete</AppButton>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="image-tip-actions">
                  {(() => {
                    const layer = layers.find((item) => item.id === imageTip.layerId);
                    if (!layer) return null;
                    const isBehindText = layer.depth === "back";
                    return (
                      <>
                        <AppButton size="sm" icon={layer.locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}>{layer.locked ? "Unlock" : "Lock"}</AppButton>
                        <AppButton size="sm" icon={<EyeSlashIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { visible: false })}>Hide</AppButton>
                        <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex + 1 })}>Front</AppButton>
                        <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex - 1 })}>Back</AppButton>
                        <AppButton size="sm" icon={isBehindText ? <ArrowUpIcon aria-hidden="true" /> : <ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { depth: isBehindText ? "front" : "back" })}>{isBehindText ? "Depan teks" : "Belakang teks"}</AppButton>
                        <AppButton size="sm" icon={<DocumentDuplicateIcon aria-hidden="true" />} onClick={() => onDuplicateLayer(layer.id)}>Duplicate</AppButton>
                        <AppButton size="sm" variant="danger" icon={<TrashIcon aria-hidden="true" />} onClick={() => { onDeleteLayer(layer.id); setImageTip(null); }}>Delete</AppButton>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : null}

          {elementTip && !isEditInteractionLocked() ? (
            <div className={`image-layer-tooltip element-layer-tooltip ${isLayerDragging ? "is-dragging" : ""}`} style={elementTipPosition || undefined}>
              <div className="image-tip-head">
                <RectangleStackIcon aria-hidden="true" />
                <strong>{elementTip.title}</strong>
                <IconButton compact label="Tutup kontrol kartu" icon={<XMarkIcon aria-hidden="true" />} onClick={() => setElementTip(null)} />
              </div>
              <div className="image-tip-actions">
                {(() => {
                  const element = managedBaseElements.find((item) => item.id === elementTip.layerId);
                  if (!element) return null;
                  const locked = element.locked === true;
                  const isBehindText = element.depth === "back";
                  return (
                    <>
                      <AppButton size="sm" icon={locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateBaseElement(element.id, { locked: !locked })}>{locked ? "Unlock" : "Lock"}</AppButton>
                      <AppButton size="sm" icon={<EyeSlashIcon aria-hidden="true" />} onClick={() => onUpdateBaseElement(element.id, { visible: false })}>Hide</AppButton>
                      <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateBaseElement(element.id, { zIndex: (element.zIndex ?? 18) + 1 })}>Front</AppButton>
                      <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateBaseElement(element.id, { zIndex: Math.max(1, (element.zIndex ?? 18) - 1) })}>Back</AppButton>
                      <AppButton size="sm" icon={isBehindText ? <ArrowUpIcon aria-hidden="true" /> : <ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateBaseElement(element.id, { depth: isBehindText ? "front" : "back" })}>{isBehindText ? "Depan teks" : "Belakang teks"}</AppButton>
                      <AppButton size="sm" variant="danger" icon={<TrashIcon aria-hidden="true" />} onClick={() => { onDeleteBaseElement(element.id); setElementTip(null); }}>Hide card</AppButton>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : null}

          {textTip && !isEditInteractionLocked() ? (
            <div
              className="text-style-tooltip"
              style={{ left: `${textTip.x}%`, top: `${textTip.y}%` }}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="image-tip-head">
                <PhotoIcon aria-hidden="true" />
                <strong>Atur teks terpilih</strong>
                <IconButton compact label="Tutup kontrol teks" icon={<XMarkIcon aria-hidden="true" />} onClick={() => setTextTip(null)} />
              </div>
              <div className="text-style-grid">
                <NumberStepper
                  label="Font"
                  min={1}
                  value={textTip.fontSize}
                  onChange={(value) => applyTextStyle({ fontSize: value }, { fontSize: `${value}px` })}
                />
                <NumberStepper
                  label="Pad"
                  min={0}
                  max={32}
                  value={textTip.padding}
                  onChange={(value) => applyTextStyle({ padding: value }, { padding: value ? `${value}px` : "" })}
                />
                <SelectMenu
                  label="Font family"
                  value={textTip.fontFamily}
                  options={textFontOptions}
                  onChange={(value) => applyTextStyle({ fontFamily: value }, { fontFamily: value === "inherit" ? "" : fontCssValue(value) })}
                />
                <ColorField
                  label="Warna"
                  value={textTip.color}
                  onChange={(value) => applyTextStyle({ color: value }, { color: value })}
                />
              </div>
            </div>
          ) : null}
        </div>
        <IconButton className="nav-hit right" label="Slide berikutnya" icon={<ChevronRightIcon aria-hidden="true" />} onClick={onNext} />
      </div>
    </main>
  );

  function renderLayerStage(
    depth: ImageDepth,
    baseItems: BaseImageLayer[],
    overlayItems: SlideLayer[],
    elementItems: BaseElementLayer[],
    containerItems: SlideContainer[],
  ) {
    return (
      <div className={`layer-stage layer-stage-${depth}`} aria-label={depth === "back" ? "Layer gambar belakang teks" : "Layer gambar depan teks"}>
        {baseItems.map((image) => {
          if (image.visible === false) return null;
          const locked = image.locked === true;
          const selected = selectedLayerId === image.id;
          return (
            <div
              key={image.id}
              className={`slide-layer base-image-layer depth-${depth} ${image.frame === "screen" ? "base-screen-frame" : ""} ${selected ? "selected" : ""} ${locked ? "locked" : ""}`}
              data-layer-id={image.id}
              style={{
                left: `${image.x}%`,
                top: `${image.y}%`,
                width: `${image.width}%`,
                zIndex: image.zIndex ?? 12,
              }}
              onPointerDown={(event) => startImageMove(event, "base", image.id, image.name, image.x ?? 50, image.y ?? 50, locked)}
            >
              {image.frame === "screen" ? (
                <div className="base-screen-bar" aria-hidden="true"><span></span><span></span><span></span></div>
              ) : null}
              <img src={normalizeAssetUrl(image.src)} alt={image.alt || image.name} draggable={false} />
              {selected && !locked ? (
                <IconButton
                  compact
                  className="resize-handle resize-se"
                  label="Resize gambar"
                  icon={<ArrowsPointingOutIcon aria-hidden="true" />}
                  onPointerDown={(event) => startImageResize(event, "base", image.id, image.width ?? 12)}
                />
              ) : null}
            </div>
          );
        })}
        {elementItems.map((element) => {
          if (element.visible === false) return null;
          const locked = element.locked === true;
          const selected = selectedLayerId === element.id;
          return (
            <div
              key={element.id}
              className={`slide-layer base-element-layer depth-${depth} ${selected ? "selected" : ""} ${locked ? "locked" : ""}`}
              data-layer-id={element.id}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.width}%`,
                height: `${element.height}%`,
                zIndex: element.zIndex ?? 18,
              }}
              onPointerDown={(event) => startElementMove(event, element.id, element.name, element.x ?? 50, element.y ?? 50, locked)}
            >
              <div className="base-element-content" dangerouslySetInnerHTML={{ __html: element.html }} />
              {selected && !locked ? (
                <IconButton
                  compact
                  className="resize-handle resize-se"
                  label="Resize kartu"
                  icon={<ArrowsPointingOutIcon aria-hidden="true" />}
                  onPointerDown={(event) => startElementResize(event, element.id, element.width ?? 12, element.height ?? 8)}
                />
              ) : null}
            </div>
          );
        })}
        {containerItems.map((container) => {
          if (!container.visible) return null;
          const locked = container.locked === true;
          const selected = selectedLayerId === container.id;
          return (
            <div
              key={container.id}
              className={`slide-layer slide-container-layer depth-${depth} container-${container.kind} ${selected ? "selected" : ""} ${locked ? "locked" : ""}`}
              data-layer-id={container.id}
              style={{
                left: `${container.x}%`,
                top: `${container.y}%`,
                width: `${container.width}%`,
                height: `${container.height}%`,
                zIndex: container.zIndex,
              }}
              onPointerDown={(event) => startContainerMove(event, container.id, container.x, container.y, locked)}
            >
              {container.kind === "image" ? (
                <img src={normalizeAssetUrl(container.imageUrl)} alt={container.name} draggable={false} />
              ) : container.kind === "html" ? (
                <iframe
                  title={container.name}
                  className="slide-container-frame"
                  sandbox="allow-scripts"
                  srcDoc={containerElementSrcDoc(container)}
                />
              ) : (
                <div className="slide-container-render" dangerouslySetInnerHTML={{ __html: containerRenderableMarkup(container) }} />
              )}
              {selected && !locked ? (
                <IconButton
                  compact
                  className="resize-handle resize-se"
                  label="Resize container"
                  icon={<ArrowsPointingOutIcon aria-hidden="true" />}
                  onPointerDown={(event) => startContainerResize(event, container.id, container.width, container.height)}
                />
              ) : null}
            </div>
          );
        })}
        {overlayItems.map((layer) => {
          if (!layer.visible) return null;
          const selected = selectedLayerId === layer.id;
          return (
            <div
              key={layer.id}
              className={`slide-layer depth-${depth} ${selected ? "selected" : ""} ${layer.locked ? "locked" : ""}`}
              data-layer-id={layer.id}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: `${layer.width}%`,
                zIndex: layer.zIndex,
              }}
              onPointerDown={(event) => startImageMove(event, "layer", layer.id, layer.name, layer.x, layer.y, layer.locked)}
            >
              <img src={normalizeAssetUrl(layer.src)} alt={layer.name} draggable={false} />
              {selected && !layer.locked ? (
                <IconButton
                  compact
                  className="resize-handle resize-se"
                  label="Resize gambar"
                  icon={<ArrowsPointingOutIcon aria-hidden="true" />}
                  onPointerDown={(event) => startImageResize(event, "layer", layer.id, layer.width)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  function renderShapeStage(shapeItems: DesignShape[], commentItems: SlideComment[]) {
    return (
      <div className="shape-stage" aria-label="Editorial objects">
        {shapeItems
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((shape) => {
            const selected = selectedLayerId === shape.id;
            return (
              <div
                key={shape.id}
                className={`design-shape design-shape-${shape.kind} ${selected ? "selected" : ""} ${shape.locked ? "locked" : ""}`}
                data-layer-id={shape.id}
                style={{
                  left: `${shape.x}%`,
                  top: `${shape.y}%`,
                  width: `${shape.width}%`,
                  height: `${shape.height}%`,
                  zIndex: shape.zIndex,
                  opacity: shape.opacity,
                  transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelectTarget(null);
                  onSelectLayer(shape.id);
                  setImageTip(null);
                  setElementTip(null);
                  setTextTip(null);
                }}
                onDoubleClick={(event) => {
                  if (shape.locked) return;
                  event.preventDefault();
                  onUpdateShape(shape.id, { rotation: (shape.rotation + 15) % 360 });
                }}
              >
                {renderShapeContent(shape)}
              </div>
            );
          })}
        {commentItems.map((comment) => {
          const selected = selectedLayerId === comment.id;
          return (
            <button
              key={comment.id}
              type="button"
              className={`slide-comment ${selected ? "selected" : ""}`}
              style={{ left: `${comment.x}%`, top: `${comment.y}%`, zIndex: 980 }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSelectTarget(null);
                onSelectLayer(comment.id);
              }}
              onDoubleClick={(event) => {
                event.preventDefault();
                onUpdateComment(comment.id, { resolved: true });
              }}
            >
              <span>{comment.authorEmail.slice(0, 1).toUpperCase()}</span>
              <strong>{comment.text}</strong>
            </button>
          );
        })}
      </div>
    );
  }

  function renderShapeContent(shape: DesignShape) {
    const commonStyle = {
      background: shape.fill,
      borderColor: shape.stroke,
      borderWidth: shape.strokeWidth,
      borderRadius: `${shape.cornerRadius}px`,
    } as CSSProperties;
    if (shape.kind === "rectangle" || shape.kind === "ellipse") {
      return <span className="shape-box" style={commonStyle} />;
    }
    if (shape.kind === "text") {
      return <span className="shape-text">{shape.text}</span>;
    }
    if (shape.kind === "line" || shape.kind === "arrow") {
      return (
        <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {shape.kind === "arrow" ? (
            <defs>
              <marker id={`${shape.id}-arrow`} markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L8,3 z" fill={shape.stroke} />
              </marker>
            </defs>
          ) : null}
          <line
            x1="4"
            y1="50"
            x2="96"
            y2="50"
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth * 2}
            strokeLinecap="round"
            markerEnd={shape.kind === "arrow" ? `url(#${shape.id}-arrow)` : undefined}
          />
        </svg>
      );
    }
    if (shape.kind === "polygon" || shape.kind === "star") {
      return (
        <svg className="shape-svg" viewBox="0 0 100 100" aria-hidden="true">
          <polygon points={shape.path} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth * 1.8} strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <svg className="shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={shape.path} fill="none" stroke={shape.stroke} strokeWidth={shape.strokeWidth * 2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  function startImageMove(
    event: ReactPointerEvent,
    kind: "base" | "layer",
    id: string,
    title: string,
    x: number,
    y: number,
    locked: boolean,
  ) {
    if (locked) return;
    if (isEditInteractionLocked()) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectTarget(null);
    onSelectLayer(id);
    setTextTip(null);
    setImageTip({ kind, layerId: id, title, x, y });
    setElementTip(null);
    setIsLayerDragging(true);
    dragRef.current = {
      mode: "move",
      kind,
      id,
      startX: event.clientX,
      startY: event.clientY,
      x,
      y,
      moved: false,
    };
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
  }

  function startImageResize(event: ReactPointerEvent, kind: "base" | "layer", id: string, width: number) {
    if (isEditInteractionLocked()) return;
    event.preventDefault();
    event.stopPropagation();
    setIsLayerDragging(true);
    dragRef.current = {
      mode: "resize",
      kind,
      id,
      startX: event.clientX,
      width,
      moved: false,
    };
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
  }

  function startElementMove(
    event: ReactPointerEvent,
    id: string,
    title: string,
    x: number,
    y: number,
    locked: boolean,
  ) {
    if (locked) return;
    if (isEditInteractionLocked()) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectTarget(null);
    onSelectLayer(id);
    setTextTip(null);
    setImageTip(null);
    setElementTip({ layerId: id, title, x, y });
    setIsLayerDragging(true);
    dragRef.current = {
      mode: "move",
      kind: "element",
      id,
      startX: event.clientX,
      startY: event.clientY,
      x,
      y,
      moved: false,
    };
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
  }

  function startElementResize(event: ReactPointerEvent, id: string, width: number, height: number) {
    if (isEditInteractionLocked()) return;
    event.preventDefault();
    event.stopPropagation();
    setIsLayerDragging(true);
    dragRef.current = {
      mode: "resize",
      kind: "element",
      id,
      startX: event.clientX,
      startY: event.clientY,
      width,
      height,
      moved: false,
    };
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
  }

  function startContainerMove(
    event: ReactPointerEvent,
    id: string,
    x: number,
    y: number,
    locked: boolean,
  ) {
    if (locked) return;
    if (isEditInteractionLocked()) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectTarget(null);
    onSelectLayer(id);
    setTextTip(null);
    setImageTip(null);
    setElementTip(null);
    setIsLayerDragging(true);
    dragRef.current = {
      mode: "move",
      kind: "container",
      id,
      startX: event.clientX,
      startY: event.clientY,
      x,
      y,
      moved: false,
    };
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
  }

  function startContainerResize(event: ReactPointerEvent, id: string, width: number, height: number) {
    if (isEditInteractionLocked()) return;
    event.preventDefault();
    event.stopPropagation();
    setIsLayerDragging(true);
    dragRef.current = {
      mode: "resize",
      kind: "container",
      id,
      startX: event.clientX,
      startY: event.clientY,
      width,
      height,
      moved: false,
    };
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
  }

  function applyTextStyle(tipPatch: Partial<NonNullable<typeof textTip>>, stylePatch: Record<string, string>) {
    if (!textTip) return;
    const nextTip = { ...textTip, ...tipPatch };
    setTextTip(nextTip);
    onUpdateTextStyle(textTip.target, stylePatch);
  }

  function pointerMove(event: PointerEvent) {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame) return;
    const rect = frame.getBoundingClientRect();
    if (drag.mode === "resize") {
      setAlignmentOverlay(null);
      if (!drag.moved && Math.abs(event.clientX - drag.startX) <= 2) return;
      if (!drag.moved) {
        if (drag.kind === "element") onBeginBaseElementEdit(drag.id, { width: drag.width, height: drag.height });
        else if (drag.kind === "container") onBeginContainerEdit(drag.id, { width: drag.width, height: drag.height });
        else if (drag.kind === "base") onBeginBaseImageEdit(drag.id, { width: drag.width });
        else onBeginLayerEdit(drag.id, { width: drag.width });
        drag.moved = true;
      }
      const nextWidth = drag.width + ((event.clientX - drag.startX) / rect.width) * 100;
      if (drag.kind === "element") {
        const nextHeight = drag.height + ((event.clientY - drag.startY) / rect.height) * 100;
        onUpdateBaseElement(drag.id, {
          width: Math.max(4, Math.min(95, nextWidth)),
          height: Math.max(3, Math.min(82, nextHeight)),
        }, false);
        return;
      }
      if (drag.kind === "container") {
        const nextHeight = drag.height + ((event.clientY - drag.startY) / rect.height) * 100;
        onUpdateContainer(drag.id, {
          width: Math.max(4, Math.min(95, nextWidth)),
          height: Math.max(3, Math.min(82, nextHeight)),
        }, false);
        return;
      }
      const patch = { width: Math.max(4, Math.min(95, nextWidth)) };
      if (drag.kind === "base") onUpdateBaseImage(drag.id, patch, false);
      else onUpdateLayer(drag.id, patch, false);
      return;
    }
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) <= 2) return;
    if (!drag.moved) {
      if (drag.kind === "element") onBeginBaseElementEdit(drag.id, { x: drag.x, y: drag.y });
      else if (drag.kind === "container") onBeginContainerEdit(drag.id, { x: drag.x, y: drag.y });
      else if (drag.kind === "base") onBeginBaseImageEdit(drag.id, { x: drag.x, y: drag.y });
      else onBeginLayerEdit(drag.id, { x: drag.x, y: drag.y });
      drag.moved = true;
    }
    const nextX = drag.x + ((event.clientX - drag.startX) / rect.width) * 100;
    const nextY = drag.y + ((event.clientY - drag.startY) / rect.height) * 100;
    const alignment = getAlignmentOverlay(frame, drag.id, nextX, nextY);
    const patch = {
      x: Math.max(0, Math.min(95, alignment.x)),
      y: Math.max(0, Math.min(92, alignment.y)),
    };
    setAlignmentOverlay(alignment.overlay);
    setImageTip((tip) => tip && tip.layerId === drag.id ? { ...tip, x: patch.x, y: patch.y } : tip);
    setElementTip((tip) => tip && tip.layerId === drag.id ? { ...tip, x: patch.x, y: patch.y } : tip);
    if (drag.kind === "element") onUpdateBaseElement(drag.id, patch, false);
    else if (drag.kind === "container") onUpdateContainer(drag.id, patch, false);
    else if (drag.kind === "base") onUpdateBaseImage(drag.id, patch, false);
    else onUpdateLayer(drag.id, patch, false);
  }

  function pointerUp() {
    const drag = dragRef.current;
    if (drag?.moved) {
      if (drag.mode === "resize") {
        if (drag.kind === "element") {
          onUpdateBaseElement(drag.id, {}, true, { width: drag.width, height: drag.height });
        } else if (drag.kind === "container") {
          onUpdateContainer(drag.id, {}, true, { width: drag.width, height: drag.height });
        } else if (drag.kind === "base") {
          onUpdateBaseImage(drag.id, {}, true, { width: drag.width });
        } else {
          onUpdateLayer(drag.id, {}, true, { width: drag.width });
        }
      } else if (drag.kind === "element") {
        onUpdateBaseElement(drag.id, {}, true, { x: drag.x, y: drag.y });
      } else if (drag.kind === "container") {
        onUpdateContainer(drag.id, {}, true, { x: drag.x, y: drag.y });
      } else if (drag.kind === "base") {
        onUpdateBaseImage(drag.id, {}, true, { x: drag.x, y: drag.y });
      } else {
        onUpdateLayer(drag.id, {}, true, { x: drag.x, y: drag.y });
      }
    }
    dragRef.current = null;
    setIsLayerDragging(false);
    setAlignmentOverlay(null);
    window.removeEventListener("pointermove", pointerMove);
    window.removeEventListener("pointerup", pointerUp);
  }

  function isPresentationGestureEnabled() {
    const viewport = viewportRef.current;
    return Boolean(document.fullscreenElement || viewport?.closest(".app-shell.is-presenting"));
  }
}

function escapeSelector(value: string) {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}

function rgbToHex(value: string) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return "";
  return `#${[match[1], match[2], match[3]].map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`;
}

function fontCssValue(value: "inherit" | FontFamilyName) {
  if (value === "inherit") return "";
  const stacks: Record<FontFamilyName, string> = {
    inter: "Inter, ui-sans-serif, system-ui, sans-serif",
    jakarta: "\"Plus Jakarta Sans\", Inter, ui-sans-serif, system-ui, sans-serif",
    noto: "\"Noto Sans\", Inter, ui-sans-serif, system-ui, sans-serif",
    sourceSerif: "\"Source Serif 4\", Georgia, serif",
    robotoSlab: "\"Roboto Slab\", Georgia, serif",
    system: "ui-sans-serif, system-ui, sans-serif",
    serif: "Georgia, serif",
    mono: "\"Cascadia Mono\", Consolas, monospace",
    rounded: "\"Trebuchet MS\", ui-sans-serif, system-ui, sans-serif",
  };
  return stacks[value];
}

function getAlignmentOverlay(frame: HTMLElement, activeId: string, x: number, y: number) {
  const frameRect = frame.getBoundingClientRect();
  const active = frame.querySelector<HTMLElement>(`.slide-layer[data-layer-id="${escapeSelector(activeId)}"]`);
  if (!active || frameRect.width <= 0 || frameRect.height <= 0) {
    return { x, y, overlay: null as AlignmentOverlay | null };
  }

  const activeRect = active.getBoundingClientRect();
  if (activeRect.width <= 1 || activeRect.height <= 1) {
    return { x, y, overlay: null as AlignmentOverlay | null };
  }

  const targets = [...frame.querySelectorAll<HTMLElement>(".slide-layer[data-layer-id]")]
    .filter((node) => node !== active && node.getAttribute("data-layer-id") !== activeId)
    .map((node) => node.getBoundingClientRect())
    .filter((rect) => rect.width > 1 && rect.height > 1);

  if (!targets.length) return { x, y, overlay: null as AlignmentOverlay | null };

  let centerX = frameRect.left + (x / 100) * frameRect.width;
  let centerY = frameRect.top + (y / 100) * frameRect.height;
  const width = activeRect.width;
  const height = activeRect.height;
  const threshold = 8;
  const candidate = () => rectFromCenter(centerX, centerY, width, height);
  const guides: AlignmentGuide[] = [];

  const verticalSnap = nearestAlignment(candidate(), targets, "x", threshold);
  if (verticalSnap) {
    centerX = verticalSnap.targetValue - verticalSnap.offset;
    const next = candidate();
    guides.push({
      orientation: "vertical",
      position: verticalSnap.targetValue - frameRect.left,
      start: Math.max(0, Math.min(next.top, verticalSnap.targetRect.top) - frameRect.top - 12),
      end: Math.min(frameRect.height, Math.max(next.bottom, verticalSnap.targetRect.bottom) - frameRect.top + 12),
    });
  }

  const horizontalSnap = nearestAlignment(candidate(), targets, "y", threshold);
  if (horizontalSnap) {
    centerY = horizontalSnap.targetValue - horizontalSnap.offset;
    const next = candidate();
    guides.push({
      orientation: "horizontal",
      position: horizontalSnap.targetValue - frameRect.top,
      start: Math.max(0, Math.min(next.left, horizontalSnap.targetRect.left) - frameRect.left - 12),
      end: Math.min(frameRect.width, Math.max(next.right, horizontalSnap.targetRect.right) - frameRect.left + 12),
    });
  }

  const distances = nearestDistanceHints(candidate(), targets, frameRect);
  const overlay = guides.length || distances.length ? { guides, distances } : null;
  return {
    x: ((centerX - frameRect.left) / frameRect.width) * 100,
    y: ((centerY - frameRect.top) / frameRect.height) * 100,
    overlay,
  };
}

function rectFromCenter(centerX: number, centerY: number, width: number, height: number) {
  return {
    left: centerX - width / 2,
    top: centerY - height / 2,
    right: centerX + width / 2,
    bottom: centerY + height / 2,
    width,
    height,
    centerX,
    centerY,
  };
}

function nearestAlignment(
  activeRect: ReturnType<typeof rectFromCenter>,
  targets: DOMRect[],
  axis: "x" | "y",
  threshold: number,
) {
  const activePoints = axis === "x"
    ? [
        { value: activeRect.left, offset: -activeRect.width / 2 },
        { value: activeRect.centerX, offset: 0 },
        { value: activeRect.right, offset: activeRect.width / 2 },
      ]
    : [
        { value: activeRect.top, offset: -activeRect.height / 2 },
        { value: activeRect.centerY, offset: 0 },
        { value: activeRect.bottom, offset: activeRect.height / 2 },
      ];
  let best: { diff: number; targetValue: number; offset: number; targetRect: DOMRect } | null = null;

  for (const targetRect of targets) {
    const targetPoints = axis === "x"
      ? [targetRect.left, targetRect.left + targetRect.width / 2, targetRect.right]
      : [targetRect.top, targetRect.top + targetRect.height / 2, targetRect.bottom];
    for (const activePoint of activePoints) {
      for (const targetValue of targetPoints) {
        const diff = Math.abs(activePoint.value - targetValue);
        if (diff <= threshold && (!best || diff < best.diff)) {
          best = { diff, targetValue, offset: activePoint.offset, targetRect };
        }
      }
    }
  }

  return best;
}

function nearestDistanceHints(activeRect: ReturnType<typeof rectFromCenter>, targets: DOMRect[], frameRect: DOMRect) {
  const maxDistance = 180;
  let horizontal: AlignmentDistanceHint | null = null;
  let vertical: AlignmentDistanceHint | null = null;

  for (const target of targets) {
    const verticalOverlap = Math.min(activeRect.bottom, target.bottom) - Math.max(activeRect.top, target.top);
    if (verticalOverlap > Math.min(activeRect.height, target.height) * 0.24) {
      const gap = activeRect.right <= target.left ? target.left - activeRect.right : target.right <= activeRect.left ? activeRect.left - target.right : null;
      if (gap != null && gap > 1 && gap <= maxDistance && (!horizontal || gap < horizontal.length)) {
        const start = activeRect.right <= target.left ? activeRect.right : target.right;
        const y = (Math.max(activeRect.top, target.top) + Math.min(activeRect.bottom, target.bottom)) / 2 - frameRect.top;
        horizontal = {
          orientation: "horizontal",
          x: start - frameRect.left,
          y,
          length: gap,
          text: `${Math.round(gap)}px`,
        };
      }
    }

    const horizontalOverlap = Math.min(activeRect.right, target.right) - Math.max(activeRect.left, target.left);
    if (horizontalOverlap > Math.min(activeRect.width, target.width) * 0.24) {
      const gap = activeRect.bottom <= target.top ? target.top - activeRect.bottom : target.bottom <= activeRect.top ? activeRect.top - target.bottom : null;
      if (gap != null && gap > 1 && gap <= maxDistance && (!vertical || gap < vertical.length)) {
        const start = activeRect.bottom <= target.top ? activeRect.bottom : target.bottom;
        const x = (Math.max(activeRect.left, target.left) + Math.min(activeRect.right, target.right)) / 2 - frameRect.left;
        vertical = {
          orientation: "vertical",
          x,
          y: start - frameRect.top,
          length: gap,
          text: `${Math.round(gap)}px`,
        };
      }
    }
  }

  return [horizontal, vertical].filter(Boolean) as AlignmentDistanceHint[];
}

function floatingTipPosition(x: number, y: number, frame: HTMLElement | null, panel: HTMLElement | null, layerId?: string) {
  const shell = frame?.parentElement;
  if (!frame || !panel || !shell) {
    return {
      left: `${x}%`,
      top: `${y}%`,
    } satisfies CSSProperties;
  }

  const frameRect = frame.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const shellRect = shell.getBoundingClientRect();
  const tipWidth = 250;
  const tipHeight = 128;
  const margin = 12;
  const selectedLayer = layerId ? frame.querySelector<HTMLElement>(`.slide-layer[data-layer-id="${escapeSelector(layerId)}"]`) : null;
  const selectedRect = selectedLayer?.getBoundingClientRect();
  const anchorX = frameRect.left + (x / 100) * frameRect.width - shellRect.left;
  const anchorY = selectedRect ? selectedRect.top - shellRect.top : frameRect.top + (y / 100) * frameRect.height - shellRect.top;
  const minCenterX = panelRect.left + tipWidth / 2 + margin - shellRect.left;
  const maxCenterX = Math.max(minCenterX, panelRect.right - tipWidth / 2 - margin - shellRect.left);
  const minTop = panelRect.top + tipHeight + margin - shellRect.top;
  const maxTop = Math.max(minTop, panelRect.bottom - margin - shellRect.top);
  const centerX = Math.max(minCenterX, Math.min(maxCenterX, anchorX));
  const top = Math.max(minTop, Math.min(maxTop, anchorY));
  const arrowX = Math.max(18, Math.min(tipWidth - 18, anchorX - (centerX - tipWidth / 2)));

  return {
    left: `${centerX}px`,
    position: "absolute",
    top: `${top}px`,
    "--tip-arrow-x": `${arrowX}px`,
  } satisfies CSSProperties & Record<"--tip-arrow-x", string>;
}
