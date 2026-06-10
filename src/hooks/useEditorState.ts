import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AssetItem, BaseElementLayer, BaseElementOverride, BaseImageLayer, BaseImageOverride, ComponentDefinition, DesignShape, DesignShapeKind, EditorSnapshot, EditorState, EditorTool, FontFamilyName, SelectionTarget, SlideComment, SlideContainer, SlideContainerKind, SlideLayer, ThemeName } from "../types";
import { createSlideContainer } from "../utils/containers";
import { createDesignShape, createSlideComment } from "../utils/editorTools";
import { applyElementStyle, replaceElementText, replaceImageSource } from "../utils/slideDom";

const STORAGE_KEY = "skripsi-presenter-react-editor-v1";

type InitialState = Pick<EditorState, "slideHtmlByIndex" | "layers">;

function isBaseLayerId(layerId: string | null) {
  return Boolean(layerId?.startsWith("base-") && !layerId.startsWith("base-element-"));
}

function isBaseElementLayerId(layerId: string | null) {
  return Boolean(layerId?.startsWith("base-element-"));
}

function isShapeLayerId(layerId: string | null) {
  return Boolean(layerId?.startsWith("shape-"));
}

function storageKeyForProject(projectId: string) {
  return `${STORAGE_KEY}:${projectId || "default"}`;
}

function snapshot(state: EditorState): EditorSnapshot {
  return {
    slideHtmlByIndex: { ...state.slideHtmlByIndex },
    layers: state.layers.map((layer) => ({ ...layer })),
    containers: state.containers.map((container) => ({ ...container })),
    shapes: state.shapes.map((shape) => ({ ...shape })),
    comments: state.comments.map((comment) => ({ ...comment })),
    components: state.components.map((component) => ({ ...component })),
    baseImageOverrides: Object.fromEntries(
      Object.entries(state.baseImageOverrides).map(([key, image]) => [key, { ...image }]),
    ),
    baseElementOverrides: Object.fromEntries(
      Object.entries(state.baseElementOverrides).map(([key, element]) => [key, { ...element }]),
    ),
    theme: state.theme,
    fontFamily: state.fontFamily,
    accent: state.accent,
  };
}

function loadState(initial: InitialState, storageKey: string): EditorState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<EditorState> & { version?: number };
      if (parsed.version === 1) {
        const storedSlides = parsed.slideHtmlByIndex && Object.keys(parsed.slideHtmlByIndex).length
          ? { ...initial.slideHtmlByIndex, ...parsed.slideHtmlByIndex }
          : initial.slideHtmlByIndex;
        const currentSlide = parsed.currentSlide || 1;
        return {
          currentSlide,
          previousSlide: parsed.previousSlide || currentSlide,
          slideChangeKey: parsed.slideChangeKey || 0,
          theme: parsed.theme || "light",
          fontFamily: parsed.fontFamily || "inter",
          accent: parsed.accent || "#14b8a6",
          selectedTarget: null,
          selectedLayerId: null,
          draftQuery: "",
          inspectorTab: "draft",
          slideHtmlByIndex: storedSlides,
          layers: parsed.layers || initial.layers,
          containers: parsed.containers || [],
          shapes: parsed.shapes || [],
          comments: parsed.comments || [],
          components: parsed.components || [],
          baseImageOverrides: parsed.baseImageOverrides || {},
          baseElementOverrides: parsed.baseElementOverrides || {},
          activeTool: parsed.activeTool || "move",
          history: [],
          future: [],
          autosavedAt: parsed.autosavedAt || Date.now(),
        };
      }
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
  return {
    currentSlide: 1,
    previousSlide: 1,
    slideChangeKey: 0,
    theme: "light",
    fontFamily: "inter",
    accent: "#14b8a6",
    selectedTarget: null,
    selectedLayerId: null,
    draftQuery: "",
    inspectorTab: "draft",
    slideHtmlByIndex: initial.slideHtmlByIndex,
    layers: initial.layers,
    containers: [],
    shapes: [],
    comments: [],
    components: [],
    baseImageOverrides: {},
    baseElementOverrides: {},
    activeTool: "move",
    history: [],
    future: [],
    autosavedAt: Date.now(),
  };
}

export function useEditorState(slideCount: number, initialSlideHtmlByIndex: Record<number, string>, projectId = "default") {
  const storageKey = useMemo(() => storageKeyForProject(projectId), [projectId]);
  const [state, setState] = useState<EditorState>(() => loadState({ slideHtmlByIndex: initialSlideHtmlByIndex, layers: [] }, storageKey));
  const activeLayerTransactionsRef = useRef<Record<string, EditorSnapshot>>({});
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    const { history, future, selectedTarget, selectedLayerId, ...persisted } = state;
    localStorage.setItem(storageKey, JSON.stringify({ ...persisted, version: 1, selectedTarget: null, selectedLayerId: null }));
    if (process.env.NODE_ENV === "development") {
      (window as Window & { __skripsiEditorDebug?: unknown }).__skripsiEditorDebug = {
        historyLength: state.history.length,
        futureLength: state.future.length,
        currentSlide: state.currentSlide,
        selectedLayerId: state.selectedLayerId,
        baseImageOverrides: state.baseImageOverrides,
        baseElementOverrides: state.baseElementOverrides,
        layers: state.layers,
        containers: state.containers,
        shapes: state.shapes,
        comments: state.comments,
        components: state.components,
        activeTool: state.activeTool,
        historyTail: state.history.at(-1),
        futureHead: state.future[0],
      };
    }
  }, [state, storageKey]);

  const commit = useCallback((mutator: (draft: EditorState) => EditorState) => {
    setState((prev) => {
      const next = mutator(prev);
      return {
        ...next,
        history: [...prev.history.slice(-30), snapshot(prev)],
        future: [],
        autosavedAt: Date.now(),
      };
    });
  }, []);

  const goToSlide = useCallback((slide: number) => {
    setState((prev) => {
      const nextSlide = Math.min(slideCount, Math.max(1, slide));
      const changed = nextSlide !== prev.currentSlide;
      return {
        ...prev,
        currentSlide: nextSlide,
        previousSlide: changed ? prev.currentSlide : prev.previousSlide,
        slideChangeKey: changed ? prev.slideChangeKey + 1 : prev.slideChangeKey,
        selectedTarget: null,
        selectedLayerId: null,
      };
    });
  }, [slideCount]);

  const addSlide = useCallback((slideIndex: number, html: string) => {
    commit((prev) => ({
      ...prev,
      previousSlide: prev.currentSlide,
      currentSlide: slideIndex,
      slideChangeKey: prev.slideChangeKey + 1,
      slideHtmlByIndex: {
        ...prev.slideHtmlByIndex,
        [slideIndex]: html,
      },
      selectedTarget: null,
      selectedLayerId: null,
      draftQuery: "",
      inspectorTab: "draft",
    }));
  }, [commit]);

  const setTheme = useCallback((theme: ThemeName) => {
    commit((prev) => ({ ...prev, theme }));
  }, [commit]);

  const setFontFamily = useCallback((fontFamily: FontFamilyName) => {
    commit((prev) => ({ ...prev, fontFamily }));
  }, [commit]);

  const setAccent = useCallback((accent: string) => {
    commit((prev) => ({ ...prev, accent }));
  }, [commit]);

  const selectTarget = useCallback((target: SelectionTarget | null) => {
    setState((prev) => ({
      ...prev,
      selectedTarget: target,
      selectedLayerId: null,
      draftQuery: target?.text.slice(0, 180) || prev.draftQuery,
    }));
  }, []);

  const selectLayer = useCallback((layerId: string | null) => {
    setState((prev) => ({ ...prev, selectedLayerId: layerId, selectedTarget: null }));
  }, []);

  const setDraftQuery = useCallback((draftQuery: string) => {
    setState((prev) => ({ ...prev, draftQuery, inspectorTab: "draft" }));
  }, []);

  const setInspectorTab = useCallback((inspectorTab: EditorState["inspectorTab"]) => {
    setState((prev) => ({ ...prev, inspectorTab }));
  }, []);

  const setActiveTool = useCallback((activeTool: EditorTool) => {
    setState((prev) => ({ ...prev, activeTool }));
  }, []);

  const replaceText = useCallback((replacement: string, targetOverride?: SelectionTarget) => {
    commit((prev) => {
      const target = targetOverride || prev.selectedTarget;
      if (!target) return prev;
      const html = prev.slideHtmlByIndex[target.slideIndex] || initialSlideHtmlByIndex[target.slideIndex] || "";
      return {
        ...prev,
        slideHtmlByIndex: {
          ...prev.slideHtmlByIndex,
          [target.slideIndex]: replaceElementText(html, target.editId, replacement),
        },
      };
    });
  }, [commit]);

  const updateTargetStyle = useCallback((target: SelectionTarget, stylePatch: Record<string, string>) => {
    commit((prev) => {
      const html = prev.slideHtmlByIndex[target.slideIndex] || initialSlideHtmlByIndex[target.slideIndex] || "";
      return {
        ...prev,
        slideHtmlByIndex: {
          ...prev.slideHtmlByIndex,
          [target.slideIndex]: applyElementStyle(html, target.editId, stylePatch),
        },
        selectedTarget: target,
      };
    });
  }, [commit, initialSlideHtmlByIndex]);

  const replaceImage = useCallback((asset: AssetItem) => {
    commit((prev) => {
      if (isBaseLayerId(prev.selectedLayerId) && prev.baseImageOverrides[prev.selectedLayerId as string]) {
        const layerId = prev.selectedLayerId as string;
        return {
          ...prev,
          baseImageOverrides: {
            ...prev.baseImageOverrides,
            [layerId]: {
              ...prev.baseImageOverrides[layerId],
              src: asset.path,
              name: asset.name,
              alt: asset.name,
            },
          },
        };
      }
      if (prev.selectedLayerId) {
        if (prev.containers.some((container) => container.id === prev.selectedLayerId)) {
          return {
            ...prev,
            containers: prev.containers.map((container) => container.id === prev.selectedLayerId ? {
              ...container,
              kind: "image",
              imageUrl: asset.path,
              name: asset.name,
            } : container),
          };
        }
        if (isBaseElementLayerId(prev.selectedLayerId)) return prev;
        if (!prev.layers.some((layer) => layer.id === prev.selectedLayerId)) return prev;
        return {
          ...prev,
          layers: prev.layers.map((layer) => layer.id === prev.selectedLayerId ? {
            ...layer,
            assetId: asset.id,
            src: asset.path,
            name: asset.name,
          } : layer),
        };
      }
      const target = prev.selectedTarget;
      if (!target || target.kind !== "image") return prev;
      const html = prev.slideHtmlByIndex[target.slideIndex] || initialSlideHtmlByIndex[target.slideIndex] || "";
      return {
        ...prev,
        slideHtmlByIndex: {
          ...prev.slideHtmlByIndex,
          [target.slideIndex]: replaceImageSource(html, target.editId, asset.path.replace(/^\//, "")),
        },
      };
    });
  }, [commit]);

  const registerBaseImages = useCallback((images: BaseImageLayer[]) => {
    if (!images.length) return;
    setState((prev) => {
      let changed = false;
      const nextOverrides = { ...prev.baseImageOverrides };
      images.forEach((image, index) => {
        if (image.x == null || image.y == null || image.width == null) return;
        const existing = nextOverrides[image.id];
        if (!existing) {
          changed = true;
          nextOverrides[image.id] = {
            id: image.id,
            slideIndex: image.slideIndex,
            editId: image.editId,
            src: image.src,
            name: image.name,
            alt: image.alt,
            x: image.x,
            y: image.y,
            width: image.width,
            height: image.height,
            zIndex: image.zIndex ?? index + 12,
            depth: image.depth ?? "front",
            frame: image.frame,
            visible: image.visible ?? true,
            locked: image.locked ?? false,
          };
          return;
        }

        const src = existing.src || image.src;
        const name = existing.name || image.name;
        const alt = existing.alt || image.alt;
        const depth = existing.depth || image.depth || "front";
        const frame = existing.frame || image.frame;
        const height = existing.height ?? image.height;
        if (src !== existing.src || name !== existing.name || alt !== existing.alt || depth !== existing.depth || frame !== existing.frame || height !== existing.height) {
          nextOverrides[image.id] = { ...existing, src, name, alt, depth, frame, height };
          changed = true;
        }
      });
      return changed ? { ...prev, baseImageOverrides: nextOverrides, autosavedAt: Date.now() } : prev;
    });
  }, []);

  const registerBaseElements = useCallback((elements: BaseElementLayer[]) => {
    if (!elements.length) return;
    setState((prev) => {
      let changed = false;
      const nextOverrides = { ...prev.baseElementOverrides };
      elements.forEach((element, index) => {
        if (element.x == null || element.y == null || element.width == null || element.height == null) return;
        const existing = nextOverrides[element.id];
        if (!existing) {
          changed = true;
          nextOverrides[element.id] = {
            id: element.id,
            slideIndex: element.slideIndex,
            editId: element.editId,
            html: element.html,
            name: element.name,
            kind: element.kind,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            zIndex: element.zIndex ?? index + 18,
            depth: element.depth ?? "front",
            visible: element.visible ?? true,
            locked: element.locked ?? false,
          };
          return;
        }

        if (existing.html !== element.html || existing.name !== element.name || existing.kind !== element.kind) {
          nextOverrides[element.id] = {
            ...existing,
            html: element.html,
            name: element.name,
            kind: element.kind,
          };
          changed = true;
        }
      });
      return changed ? { ...prev, baseElementOverrides: nextOverrides, autosavedAt: Date.now() } : prev;
    });
  }, []);

  const beginBaseImageEdit = useCallback((layerId: string, beforePatch?: Partial<BaseImageOverride>) => {
    const transactionKey = `base:${layerId}`;
    const existingSnapshot = activeLayerTransactionsRef.current[transactionKey];
    if (existingSnapshot && !beforePatch) return;
    const initialSnapshot = existingSnapshot || snapshot(stateRef.current);
    if (beforePatch && initialSnapshot.baseImageOverrides[layerId]) {
      initialSnapshot.baseImageOverrides = {
        ...initialSnapshot.baseImageOverrides,
        [layerId]: {
          ...initialSnapshot.baseImageOverrides[layerId],
          ...beforePatch,
        },
      };
    }
    activeLayerTransactionsRef.current[transactionKey] = initialSnapshot;
  }, []);

  const beginLayerEdit = useCallback((layerId: string, beforePatch?: Partial<SlideLayer>) => {
    const transactionKey = `layer:${layerId}`;
    const existingSnapshot = activeLayerTransactionsRef.current[transactionKey];
    if (existingSnapshot && !beforePatch) return;
    const initialSnapshot = existingSnapshot || snapshot(stateRef.current);
    if (beforePatch) {
      initialSnapshot.layers = initialSnapshot.layers.map((layer) => layer.id === layerId ? { ...layer, ...beforePatch } : layer);
    }
    activeLayerTransactionsRef.current[transactionKey] = initialSnapshot;
  }, []);

  const beginBaseElementEdit = useCallback((layerId: string, beforePatch?: Partial<BaseElementOverride>) => {
    const transactionKey = `element:${layerId}`;
    const existingSnapshot = activeLayerTransactionsRef.current[transactionKey];
    if (existingSnapshot && !beforePatch) return;
    const initialSnapshot = existingSnapshot || snapshot(stateRef.current);
    if (beforePatch && initialSnapshot.baseElementOverrides[layerId]) {
      initialSnapshot.baseElementOverrides = {
        ...initialSnapshot.baseElementOverrides,
        [layerId]: {
          ...initialSnapshot.baseElementOverrides[layerId],
          ...beforePatch,
        },
      };
    }
    activeLayerTransactionsRef.current[transactionKey] = initialSnapshot;
  }, []);

  const updateBaseImage = useCallback((
    layerId: string,
    patch: Partial<BaseImageOverride>,
    saveHistory = true,
    historyBeforePatch?: Partial<BaseImageOverride>,
  ) => {
    const updater = (prev: EditorState) => {
      const layer = prev.baseImageOverrides[layerId];
      if (!layer) return prev;
      return {
        ...prev,
        baseImageOverrides: {
          ...prev.baseImageOverrides,
          [layerId]: { ...layer, ...patch },
        },
      };
    };
    const transactionKey = `base:${layerId}`;
    if (saveHistory) {
      setState((prev) => {
        const transactionStart = activeLayerTransactionsRef.current[transactionKey];
        if (transactionStart) delete activeLayerTransactionsRef.current[transactionKey];
        const next = updater(prev);
        if (next === prev && !transactionStart && !historyBeforePatch) return prev;
        let historySnapshot = transactionStart || snapshot(prev);
        if (historyBeforePatch) {
          const historyLayer = historySnapshot.baseImageOverrides[layerId] || prev.baseImageOverrides[layerId];
          if (historyLayer) {
            historySnapshot = {
              ...historySnapshot,
              baseImageOverrides: {
                ...historySnapshot.baseImageOverrides,
                [layerId]: { ...historyLayer, ...historyBeforePatch },
              },
            };
          }
        }
        return {
          ...next,
          history: [...prev.history.slice(-30), historySnapshot],
          future: [],
          autosavedAt: Date.now(),
        };
      });
    } else {
      setState((prev) => {
        const next = updater(prev);
        return next === prev ? prev : { ...next, autosavedAt: Date.now() };
      });
    }
  }, []);

  const deleteBaseImage = useCallback((layerId: string) => {
    commit((prev) => {
      const layer = prev.baseImageOverrides[layerId];
      if (!layer) return prev;
      return {
        ...prev,
        baseImageOverrides: {
          ...prev.baseImageOverrides,
          [layerId]: { ...layer, visible: false },
        },
        selectedLayerId: null,
      };
    });
  }, [commit]);

  const updateBaseElement = useCallback((
    layerId: string,
    patch: Partial<BaseElementOverride>,
    saveHistory = true,
    historyBeforePatch?: Partial<BaseElementOverride>,
  ) => {
    const updater = (prev: EditorState) => {
      const element = prev.baseElementOverrides[layerId];
      if (!element) return prev;
      return {
        ...prev,
        baseElementOverrides: {
          ...prev.baseElementOverrides,
          [layerId]: { ...element, ...patch },
        },
      };
    };
    const transactionKey = `element:${layerId}`;
    if (saveHistory) {
      setState((prev) => {
        const transactionStart = activeLayerTransactionsRef.current[transactionKey];
        if (transactionStart) delete activeLayerTransactionsRef.current[transactionKey];
        const next = updater(prev);
        if (next === prev && !transactionStart && !historyBeforePatch) return prev;
        let historySnapshot = transactionStart || snapshot(prev);
        if (historyBeforePatch) {
          const historyElement = historySnapshot.baseElementOverrides[layerId] || prev.baseElementOverrides[layerId];
          if (historyElement) {
            historySnapshot = {
              ...historySnapshot,
              baseElementOverrides: {
                ...historySnapshot.baseElementOverrides,
                [layerId]: { ...historyElement, ...historyBeforePatch },
              },
            };
          }
        }
        return {
          ...next,
          history: [...prev.history.slice(-30), historySnapshot],
          future: [],
          autosavedAt: Date.now(),
        };
      });
    } else {
      setState((prev) => {
        const next = updater(prev);
        return next === prev ? prev : { ...next, autosavedAt: Date.now() };
      });
    }
  }, []);

  const deleteBaseElement = useCallback((layerId: string) => {
    commit((prev) => {
      const element = prev.baseElementOverrides[layerId];
      if (!element) return prev;
      return {
        ...prev,
        baseElementOverrides: {
          ...prev.baseElementOverrides,
          [layerId]: { ...element, visible: false },
        },
        selectedLayerId: null,
      };
    });
  }, [commit]);

  const duplicateBaseImage = useCallback((layerId: string) => {
    commit((prev) => {
      const base = prev.baseImageOverrides[layerId];
      if (!base) return prev;
      const maxZ = prev.layers.filter((layer) => layer.slideIndex === base.slideIndex).reduce((max, layer) => Math.max(max, layer.zIndex), base.zIndex);
      const duplicate: SlideLayer = {
        id: `layer-${Date.now()}`,
        slideIndex: base.slideIndex,
        assetId: "",
        src: base.src,
        name: `${base.name} copy`,
        x: Math.min(88, base.x + 4),
        y: Math.min(82, base.y + 4),
        width: base.width,
        height: base.height,
        zIndex: maxZ + 1,
        depth: base.depth || "front",
        visible: true,
        locked: false,
      };
      return { ...prev, layers: [...prev.layers, duplicate], selectedLayerId: duplicate.id };
    });
  }, [commit]);

  const addLayer = useCallback((asset: AssetItem, position?: { x: number; y: number; width?: number; height?: number }) => {
    commit((prev) => {
      const maxZ = prev.layers.filter((layer) => layer.slideIndex === prev.currentSlide).reduce((max, layer) => Math.max(max, layer.zIndex), 20);
      const layer: SlideLayer = {
        id: `layer-${Date.now()}`,
        slideIndex: prev.currentSlide,
        assetId: asset.id,
        src: asset.path,
        name: asset.name,
        x: position?.x ?? 58,
        y: position?.y ?? 42,
        width: position?.width ?? 22,
        height: position?.height ?? 16,
        zIndex: maxZ + 1,
        depth: "front",
        visible: true,
        locked: false,
      };
      return { ...prev, layers: [...prev.layers, layer], selectedLayerId: layer.id };
    });
  }, [commit]);

  const duplicateLayer = useCallback((layerId: string) => {
    commit((prev) => {
      const layer = prev.layers.find((item) => item.id === layerId);
      if (!layer) return prev;
      const duplicate: SlideLayer = {
        ...layer,
        id: `layer-${Date.now()}`,
        name: `${layer.name} copy`,
        x: Math.min(88, layer.x + 4),
        y: Math.min(82, layer.y + 4),
        zIndex: layer.zIndex + 1,
      };
      return { ...prev, layers: [...prev.layers, duplicate], selectedLayerId: duplicate.id };
    });
  }, [commit]);

  const addShape = useCallback((kind: DesignShapeKind) => {
    commit((prev) => {
      const sameSlideShapes = prev.shapes.filter((shape) => shape.slideIndex === prev.currentSlide);
      const maxZ = sameSlideShapes.reduce((max, shape) => Math.max(max, shape.zIndex), 60);
      const shape = createDesignShape({
        slideIndex: prev.currentSlide,
        kind,
        sequence: prev.shapes.length + 1,
        patch: { zIndex: maxZ + 1 },
      });
      return {
        ...prev,
        activeTool: kind,
        shapes: [...prev.shapes, shape],
        selectedLayerId: shape.id,
        selectedTarget: null,
        inspectorTab: "layers",
      };
    });
  }, [commit]);

  const duplicateShape = useCallback((shapeId: string) => {
    commit((prev) => {
      const shape = prev.shapes.find((item) => item.id === shapeId);
      if (!shape) return prev;
      const duplicate: DesignShape = {
        ...shape,
        id: `shape-${shape.slideIndex}-${prev.shapes.length + 1}`,
        name: `${shape.name} copy`,
        x: Math.min(92, shape.x + 4),
        y: Math.min(88, shape.y + 4),
        zIndex: shape.zIndex + 1,
        locked: false,
        visible: true,
      };
      return { ...prev, shapes: [...prev.shapes, duplicate], selectedLayerId: duplicate.id, selectedTarget: null };
    });
  }, [commit]);

  const updateShape = useCallback((
    shapeId: string,
    patch: Partial<DesignShape>,
    saveHistory = true,
    historyBeforePatch?: Partial<DesignShape>,
  ) => {
    const updater = (prev: EditorState) => ({
      ...prev,
      shapes: prev.shapes.map((shape) => shape.id === shapeId ? { ...shape, ...patch } : shape),
    });
    if (saveHistory) {
      setState((prev) => {
        const next = updater(prev);
        let historySnapshot = snapshot(prev);
        if (historyBeforePatch) {
          historySnapshot = {
            ...historySnapshot,
            shapes: historySnapshot.shapes.map((shape) => shape.id === shapeId ? { ...shape, ...historyBeforePatch } : shape),
          };
        }
        return {
          ...next,
          selectedLayerId: shapeId,
          selectedTarget: null,
          history: [...prev.history.slice(-30), historySnapshot],
          future: [],
          autosavedAt: Date.now(),
        };
      });
    } else {
      setState((prev) => {
        const next = updater(prev);
        return next === prev ? prev : { ...next, selectedLayerId: shapeId, selectedTarget: null, autosavedAt: Date.now() };
      });
    }
  }, []);

  const deleteShape = useCallback((shapeId: string) => {
    commit((prev) => ({
      ...prev,
      shapes: prev.shapes.filter((shape) => shape.id !== shapeId),
      selectedLayerId: prev.selectedLayerId === shapeId ? null : prev.selectedLayerId,
      components: prev.components.filter((component) => component.sourceId !== shapeId),
    }));
  }, [commit]);

  const addComment = useCallback((authorEmail = "local@flex-ppt.test") => {
    commit((prev) => {
      const comment = createSlideComment({
        slideIndex: prev.currentSlide,
        sequence: prev.comments.length + 1,
        authorEmail,
      });
      return {
        ...prev,
        activeTool: "comment",
        comments: [...prev.comments, comment],
        selectedLayerId: comment.id,
        selectedTarget: null,
        inspectorTab: "layers",
      };
    });
  }, [commit]);

  const updateComment = useCallback((commentId: string, patch: Partial<SlideComment>) => {
    commit((prev) => ({
      ...prev,
      comments: prev.comments.map((comment) => comment.id === commentId ? { ...comment, ...patch } : comment),
      selectedLayerId: commentId,
      selectedTarget: null,
    }));
  }, [commit]);

  const deleteComment = useCallback((commentId: string) => {
    commit((prev) => ({
      ...prev,
      comments: prev.comments.filter((comment) => comment.id !== commentId),
      selectedLayerId: prev.selectedLayerId === commentId ? null : prev.selectedLayerId,
    }));
  }, [commit]);

  const createComponentFromSelection = useCallback(() => {
    commit((prev) => {
      const selectedId = prev.selectedLayerId;
      if (!selectedId) return prev;
      const sourceKind: ComponentDefinition["sourceKind"] | null = isShapeLayerId(selectedId)
        ? "shape"
        : prev.containers.some((container) => container.id === selectedId)
          ? "container"
          : null;
      if (!sourceKind) return prev;
      const existing = prev.components.find((component) => component.sourceId === selectedId);
      if (existing) return prev;
      const label = sourceKind === "shape"
        ? prev.shapes.find((shape) => shape.id === selectedId)?.name
        : prev.containers.find((container) => container.id === selectedId)?.name;
      const component: ComponentDefinition = {
        id: `component-${prev.components.length + 1}`,
        name: `${label || "Selection"} component`,
        sourceId: selectedId,
        sourceKind,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        activeTool: "component",
        components: [...prev.components, component],
        shapes: sourceKind === "shape"
          ? prev.shapes.map((shape) => shape.id === selectedId ? { ...shape, componentId: component.id } : shape)
          : prev.shapes,
      };
    });
  }, [commit]);

  const addContainer = useCallback((kind: SlideContainerKind = "html", patch?: Partial<SlideContainer>) => {
    commit((prev) => {
      const sameSlideContainers = prev.containers.filter((container) => container.slideIndex === prev.currentSlide);
      const maxZ = sameSlideContainers.reduce((max, container) => Math.max(max, container.zIndex), 40);
      const container = createSlideContainer({
        slideIndex: prev.currentSlide,
        kind,
        sequence: prev.containers.length + 1,
        provider: patch?.provider || "local",
        patch: {
          ...patch,
          zIndex: patch?.zIndex ?? maxZ + 1,
        },
      });
      return {
        ...prev,
        containers: [...prev.containers, container],
        selectedLayerId: container.id,
        selectedTarget: null,
        inspectorTab: "containers",
      };
    });
  }, [commit]);

  const duplicateContainer = useCallback((containerId: string) => {
    commit((prev) => {
      const container = prev.containers.find((item) => item.id === containerId);
      if (!container) return prev;
      const duplicate: SlideContainer = {
        ...container,
        id: `container-${container.slideIndex}-${prev.containers.length + 1}`,
        name: `${container.name} copy`,
        x: Math.min(92, container.x + 4),
        y: Math.min(88, container.y + 4),
        zIndex: container.zIndex + 1,
        locked: false,
        visible: true,
      };
      return {
        ...prev,
        containers: [...prev.containers, duplicate],
        selectedLayerId: duplicate.id,
        selectedTarget: null,
        inspectorTab: "containers",
      };
    });
  }, [commit]);

  const beginContainerEdit = useCallback((containerId: string, beforePatch?: Partial<SlideContainer>) => {
    const transactionKey = `container:${containerId}`;
    const existingSnapshot = activeLayerTransactionsRef.current[transactionKey];
    if (existingSnapshot && !beforePatch) return;
    const initialSnapshot = existingSnapshot || snapshot(stateRef.current);
    if (beforePatch) {
      initialSnapshot.containers = initialSnapshot.containers.map((container) => (
        container.id === containerId ? { ...container, ...beforePatch } : container
      ));
    }
    activeLayerTransactionsRef.current[transactionKey] = initialSnapshot;
  }, []);

  const updateContainer = useCallback((
    containerId: string,
    patch: Partial<SlideContainer>,
    saveHistory = true,
    historyBeforePatch?: Partial<SlideContainer>,
  ) => {
    const updater = (prev: EditorState) => ({
      ...prev,
      containers: prev.containers.map((container) => container.id === containerId ? { ...container, ...patch } : container),
    });
    const transactionKey = `container:${containerId}`;
    if (saveHistory) {
      setState((prev) => {
        const transactionStart = activeLayerTransactionsRef.current[transactionKey];
        if (transactionStart) delete activeLayerTransactionsRef.current[transactionKey];
        const next = updater(prev);
        if (next.containers === prev.containers && !transactionStart && !historyBeforePatch) return prev;
        let historySnapshot = transactionStart || snapshot(prev);
        if (historyBeforePatch) {
          historySnapshot = {
            ...historySnapshot,
            containers: historySnapshot.containers.map((container) => (
              container.id === containerId ? { ...container, ...historyBeforePatch } : container
            )),
          };
        }
        return {
          ...next,
          selectedLayerId: containerId,
          selectedTarget: null,
          history: [...prev.history.slice(-30), historySnapshot],
          future: [],
          autosavedAt: Date.now(),
        };
      });
    } else {
      setState((prev) => {
        const next = updater(prev);
        return next === prev ? prev : { ...next, selectedLayerId: containerId, selectedTarget: null, autosavedAt: Date.now() };
      });
    }
  }, []);

  const deleteContainer = useCallback((containerId: string) => {
    commit((prev) => ({
      ...prev,
      containers: prev.containers.filter((container) => container.id !== containerId),
      selectedLayerId: prev.selectedLayerId === containerId ? null : prev.selectedLayerId,
      components: prev.components.filter((component) => component.sourceId !== containerId),
    }));
  }, [commit]);

  const updateLayer = useCallback((
    layerId: string,
    patch: Partial<SlideLayer>,
    saveHistory = true,
    historyBeforePatch?: Partial<SlideLayer>,
  ) => {
    const updater = (prev: EditorState) => ({
      ...prev,
      layers: prev.layers.map((layer) => layer.id === layerId ? { ...layer, ...patch } : layer),
    });
    const transactionKey = `layer:${layerId}`;
    if (saveHistory) {
      setState((prev) => {
        const transactionStart = activeLayerTransactionsRef.current[transactionKey];
        if (transactionStart) delete activeLayerTransactionsRef.current[transactionKey];
        const next = updater(prev);
        let historySnapshot = transactionStart || snapshot(prev);
        if (historyBeforePatch) {
          historySnapshot = {
            ...historySnapshot,
            layers: historySnapshot.layers.map((layer) => layer.id === layerId ? { ...layer, ...historyBeforePatch } : layer),
          };
        }
        return {
          ...next,
          history: [...prev.history.slice(-30), historySnapshot],
          future: [],
          autosavedAt: Date.now(),
        };
      });
    } else {
      setState((prev) => {
        const next = updater(prev);
        return next === prev ? prev : { ...next, autosavedAt: Date.now() };
      });
    }
  }, []);

  const deleteLayer = useCallback((layerId: string) => {
    commit((prev) => ({ ...prev, layers: prev.layers.filter((layer) => layer.id !== layerId), selectedLayerId: null }));
  }, [commit]);

  const undo = useCallback(() => {
    setState((prev) => {
      const previous = prev.history.at(-1);
      if (!previous) return prev;
      return {
        ...prev,
        ...previous,
        history: prev.history.slice(0, -1),
        future: [snapshot(prev), ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const next = prev.future[0];
      if (!next) return prev;
      return {
        ...prev,
        ...next,
        history: [...prev.history, snapshot(prev)],
        future: prev.future.slice(1),
      };
    });
  }, []);

  const resetSlide = useCallback((slideIndex: number) => {
    commit((prev) => {
      const nextHtml = { ...prev.slideHtmlByIndex, [slideIndex]: initialSlideHtmlByIndex[slideIndex] || "" };
      const nextOverrides = Object.fromEntries(
        Object.entries(prev.baseImageOverrides).filter(([, image]) => image.slideIndex !== slideIndex),
      );
      const nextElementOverrides = Object.fromEntries(
        Object.entries(prev.baseElementOverrides).filter(([, element]) => element.slideIndex !== slideIndex),
      );
      return {
        ...prev,
        slideHtmlByIndex: nextHtml,
        layers: prev.layers.filter((layer) => layer.slideIndex !== slideIndex),
        containers: prev.containers.filter((container) => container.slideIndex !== slideIndex),
        shapes: prev.shapes.filter((shape) => shape.slideIndex !== slideIndex),
        comments: prev.comments.filter((comment) => comment.slideIndex !== slideIndex),
        components: prev.components.filter((component) => {
          if (component.sourceKind === "shape") {
            return !prev.shapes.some((shape) => shape.slideIndex === slideIndex && shape.id === component.sourceId);
          }
          return !prev.containers.some((container) => container.slideIndex === slideIndex && container.id === component.sourceId);
        }),
        baseImageOverrides: nextOverrides,
        baseElementOverrides: nextElementOverrides,
        selectedLayerId: null,
        selectedTarget: null,
      };
    });
  }, [commit]);

  const exportState = useCallback(() => {
    return JSON.stringify({ version: 1, ...snapshot(state), theme: state.theme, fontFamily: state.fontFamily, accent: state.accent }, null, 2);
  }, [state]);

  const importState = useCallback((value: string) => {
    const parsed = JSON.parse(value) as Partial<EditorSnapshot> & Partial<Pick<EditorState, "theme" | "fontFamily" | "accent">>;
    commit((prev) => ({
      ...prev,
      slideHtmlByIndex: parsed.slideHtmlByIndex || prev.slideHtmlByIndex,
      layers: parsed.layers || prev.layers,
      containers: parsed.containers || prev.containers,
      shapes: parsed.shapes || prev.shapes,
      comments: parsed.comments || prev.comments,
      components: parsed.components || prev.components,
      baseImageOverrides: parsed.baseImageOverrides || prev.baseImageOverrides,
      baseElementOverrides: parsed.baseElementOverrides || prev.baseElementOverrides,
      theme: parsed.theme || prev.theme,
      fontFamily: parsed.fontFamily || prev.fontFamily,
      accent: parsed.accent || prev.accent,
    }));
  }, [commit]);

  const resetAll = useCallback(() => {
    commit((prev) => ({
      ...prev,
      slideHtmlByIndex: initialSlideHtmlByIndex,
      layers: [],
      containers: [],
      shapes: [],
      comments: [],
      components: [],
      baseImageOverrides: {},
      baseElementOverrides: {},
      selectedLayerId: null,
      selectedTarget: null,
      activeTool: "move",
    }));
  }, [commit]);

  return useMemo(() => ({
    state,
    goToSlide,
    addSlide,
    setTheme,
    setFontFamily,
    setAccent,
    selectTarget,
    selectLayer,
    setDraftQuery,
    setInspectorTab,
    setActiveTool,
    replaceText,
    updateTargetStyle,
    replaceImage,
    registerBaseImages,
    registerBaseElements,
    beginBaseImageEdit,
    beginBaseElementEdit,
    beginLayerEdit,
    updateBaseImage,
    updateBaseElement,
    deleteBaseImage,
    deleteBaseElement,
    duplicateBaseImage,
    addLayer,
    duplicateLayer,
    addShape,
    duplicateShape,
    updateShape,
    deleteShape,
    addComment,
    updateComment,
    deleteComment,
    createComponentFromSelection,
    addContainer,
    duplicateContainer,
    beginContainerEdit,
    updateContainer,
    deleteContainer,
    updateLayer,
    deleteLayer,
    undo,
    redo,
    resetSlide,
    exportState,
    importState,
    resetAll,
  }), [addComment, addContainer, addLayer, addShape, addSlide, beginBaseElementEdit, beginBaseImageEdit, beginContainerEdit, beginLayerEdit, createComponentFromSelection, deleteBaseElement, deleteBaseImage, deleteComment, deleteContainer, deleteLayer, deleteShape, duplicateBaseImage, duplicateContainer, duplicateLayer, duplicateShape, exportState, goToSlide, importState, redo, registerBaseElements, registerBaseImages, replaceImage, replaceText, resetAll, resetSlide, selectLayer, selectTarget, setAccent, setActiveTool, setDraftQuery, setFontFamily, setInspectorTab, setTheme, state, undo, updateBaseElement, updateBaseImage, updateComment, updateContainer, updateLayer, updateShape, updateTargetStyle]);
}
