import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AssetItem, BaseElementLayer, BaseElementOverride, BaseImageLayer, BaseImageOverride, EditorSnapshot, EditorState, FontFamilyName, SelectionTarget, SlideLayer, ThemeName } from "../types";
import { applyElementStyle, replaceElementText, replaceImageSource } from "../utils/slideDom";

const STORAGE_KEY = "skripsi-presenter-react-editor-v1";

type InitialState = Pick<EditorState, "slideHtmlByIndex" | "layers">;

function isBaseLayerId(layerId: string | null) {
  return Boolean(layerId?.startsWith("base-") && !layerId.startsWith("base-element-"));
}

function isBaseElementLayerId(layerId: string | null) {
  return Boolean(layerId?.startsWith("base-element-"));
}

function snapshot(state: EditorState): EditorSnapshot {
  return {
    slideHtmlByIndex: { ...state.slideHtmlByIndex },
    layers: state.layers.map((layer) => ({ ...layer })),
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

function loadState(initial: InitialState): EditorState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<EditorState> & { version?: number };
      if (parsed.version === 1) {
        const storedSlides = parsed.slideHtmlByIndex && Object.keys(parsed.slideHtmlByIndex).length
          ? { ...initial.slideHtmlByIndex, ...parsed.slideHtmlByIndex }
          : initial.slideHtmlByIndex;
        return {
          currentSlide: parsed.currentSlide || 1,
          theme: parsed.theme || "light",
          fontFamily: parsed.fontFamily || "inter",
          accent: parsed.accent || "#14b8a6",
          selectedTarget: null,
          selectedLayerId: null,
          draftQuery: "",
          inspectorTab: "draft",
          slideHtmlByIndex: storedSlides,
          layers: parsed.layers || initial.layers,
          baseImageOverrides: parsed.baseImageOverrides || {},
          baseElementOverrides: parsed.baseElementOverrides || {},
          history: [],
          future: [],
          autosavedAt: parsed.autosavedAt || Date.now(),
        };
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return {
    currentSlide: 1,
    theme: "light",
    fontFamily: "inter",
    accent: "#14b8a6",
    selectedTarget: null,
    selectedLayerId: null,
    draftQuery: "",
    inspectorTab: "draft",
    slideHtmlByIndex: initial.slideHtmlByIndex,
    layers: initial.layers,
    baseImageOverrides: {},
    baseElementOverrides: {},
    history: [],
    future: [],
    autosavedAt: Date.now(),
  };
}

export function useEditorState(slideCount: number, initialSlideHtmlByIndex: Record<number, string>) {
  const [state, setState] = useState<EditorState>(() => loadState({ slideHtmlByIndex: initialSlideHtmlByIndex, layers: [] }));
  const activeLayerTransactionsRef = useRef<Record<string, EditorSnapshot>>({});
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    const { history, future, selectedTarget, selectedLayerId, ...persisted } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...persisted, version: 1, selectedTarget: null, selectedLayerId: null }));
    if (import.meta.env.DEV) {
      (window as Window & { __skripsiEditorDebug?: unknown }).__skripsiEditorDebug = {
        historyLength: state.history.length,
        futureLength: state.future.length,
        currentSlide: state.currentSlide,
        selectedLayerId: state.selectedLayerId,
        baseImageOverrides: state.baseImageOverrides,
        baseElementOverrides: state.baseElementOverrides,
        layers: state.layers,
        historyTail: state.history.at(-1),
        futureHead: state.future[0],
      };
    }
  }, [state]);

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
    setState((prev) => ({
      ...prev,
      currentSlide: Math.min(slideCount, Math.max(1, slide)),
      selectedTarget: null,
      selectedLayerId: null,
    }));
  }, [slideCount]);

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
        if (src !== existing.src || name !== existing.name || alt !== existing.alt || depth !== existing.depth || frame !== existing.frame) {
          nextOverrides[image.id] = { ...existing, src, name, alt, depth, frame };
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
        zIndex: maxZ + 1,
        depth: base.depth || "front",
        visible: true,
        locked: false,
      };
      return { ...prev, layers: [...prev.layers, duplicate], selectedLayerId: duplicate.id };
    });
  }, [commit]);

  const addLayer = useCallback((asset: AssetItem, position?: { x: number; y: number; width?: number }) => {
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
      baseImageOverrides: {},
      baseElementOverrides: {},
      selectedLayerId: null,
      selectedTarget: null,
    }));
  }, [commit]);

  return useMemo(() => ({
    state,
    goToSlide,
    setTheme,
    setFontFamily,
    setAccent,
    selectTarget,
    selectLayer,
    setDraftQuery,
    setInspectorTab,
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
    updateLayer,
    deleteLayer,
    undo,
    redo,
    resetSlide,
    exportState,
    importState,
    resetAll,
  }), [addLayer, beginBaseElementEdit, beginBaseImageEdit, beginLayerEdit, deleteBaseElement, deleteBaseImage, deleteLayer, duplicateBaseImage, duplicateLayer, exportState, goToSlide, importState, redo, registerBaseElements, registerBaseImages, replaceImage, replaceText, resetAll, resetSlide, selectLayer, selectTarget, setAccent, setDraftQuery, setFontFamily, setInspectorTab, setTheme, state, undo, updateBaseElement, updateBaseImage, updateLayer, updateTargetStyle]);
}
