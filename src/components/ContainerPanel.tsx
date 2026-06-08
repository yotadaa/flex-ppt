import { useMemo, useState } from "react";
import {
  CodeBracketIcon,
  PhotoIcon,
  SparklesIcon,
  SquaresPlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { AssetItem, SlideContainer, SlideContainerKind } from "../types";
import { stripMarkdownCodeFence } from "../utils/containers";
import { normalizeAssetUrl } from "../utils/slideDom";
import { AppButton, NumberStepper, TextField } from "./ui/controls";

type ContainerPanelProps = {
  containers: SlideContainer[];
  assets: AssetItem[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onAddContainer: (kind?: SlideContainerKind, patch?: Partial<SlideContainer>) => void;
  onUpdateContainer: (id: string, patch: Partial<SlideContainer>, saveHistory?: boolean, historyBeforePatch?: Partial<SlideContainer>) => void;
  onDeleteContainer: (id: string) => void;
  onDuplicateContainer: (id: string) => void;
};

type GenerateMode = "html" | "svg";

export default function ContainerPanel({
  containers,
  assets,
  selectedLayerId,
  onSelectLayer,
  onAddContainer,
  onUpdateContainer,
  onDeleteContainer,
  onDuplicateContainer,
}: ContainerPanelProps) {
  const selected = useMemo(
    () => containers.find((container) => container.id === selectedLayerId) || containers[0] || null,
    [containers, selectedLayerId],
  );
  const [prompt, setPrompt] = useState("Buat struktur visual akademik modern untuk poin utama slide ini.");
  const [busyMode, setBusyMode] = useState<GenerateMode | null>(null);
  const [error, setError] = useState("");
  const imageAssets = useMemo(
    () => assets.filter((asset) => ["slide", "isometric", "gui", "reference", "logo"].includes(asset.kind)).slice(0, 18),
    [assets],
  );

  async function generate(mode: GenerateMode) {
    setBusyMode(mode);
    setError("");
    try {
      const response = await fetch("/api/ai/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, prompt }),
      });
      if (!response.ok) throw new Error(`AI request failed with ${response.status}`);
      const data = await response.json() as { result?: string };
      const result = stripMarkdownCodeFence(data.result || "");
      if (!result) throw new Error("AI response kosong.");
      const patch: Partial<SlideContainer> = mode === "svg"
        ? { kind: "svg", svg: result, html: "", name: selected?.name || "AI SVG container" }
        : { kind: "html", html: result, svg: "", name: selected?.name || "AI HTML container" };
      if (selected) onUpdateContainer(selected.id, patch);
      else onAddContainer(mode, patch);
    } catch (generationError) {
      const fallback = mode === "svg"
        ? `<svg viewBox="0 0 360 220" role="img" aria-label="AI fallback"><rect width="360" height="220" rx="26" fill="#f8fafc"/><circle cx="78" cy="82" r="34" fill="#60a5fa"/><rect x="128" y="56" width="204" height="18" rx="9" fill="#0f172a"/><rect x="128" y="92" width="164" height="14" rx="7" fill="#64748b"/><path d="M72 152h236" stroke="#14b8a6" stroke-width="10" stroke-linecap="round"/></svg>`
        : `<div class="dynamic-container-card"><strong>AI fallback</strong><span>${prompt.slice(0, 120)}</span></div>`;
      if (selected) onUpdateContainer(selected.id, mode === "svg" ? { kind: "svg", svg: fallback, html: "" } : { kind: "html", html: fallback, svg: "" });
      else onAddContainer(mode, mode === "svg" ? { svg: fallback } : { html: fallback });
      setError(generationError instanceof Error ? generationError.message : "AI endpoint belum siap, fallback lokal dipakai.");
    } finally {
      setBusyMode(null);
    }
  }

  function updateSelected(patch: Partial<SlideContainer>) {
    if (!selected) return;
    onUpdateContainer(selected.id, patch);
  }

  return (
    <section className="container-panel">
      <div className="container-actions">
        <AppButton size="sm" icon={<CodeBracketIcon aria-hidden="true" />} onClick={() => onAddContainer("html")}>HTML</AppButton>
        <AppButton size="sm" icon={<SparklesIcon aria-hidden="true" />} onClick={() => onAddContainer("svg")}>SVG</AppButton>
        <AppButton size="sm" icon={<PhotoIcon aria-hidden="true" />} onClick={() => onAddContainer("image")}>Image</AppButton>
      </div>

      {!containers.length ? (
        <p className="empty-note">Belum ada container di slide ini. Tambah HTML, SVG, atau image container.</p>
      ) : (
        <div className="container-list">
          {containers
            .slice()
            .sort((a, b) => b.zIndex - a.zIndex)
            .map((container) => (
              <button
                key={container.id}
                type="button"
                className={`container-list-item ${selected?.id === container.id ? "active" : ""}`}
                onClick={() => onSelectLayer(container.id)}
              >
                <span>{container.name}</span>
                <small>{container.kind.toUpperCase()} - {container.provider}</small>
              </button>
            ))}
        </div>
      )}

      {selected ? (
        <div className="container-editor">
          <TextField label="Name" value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} />
          <div className="layer-fields">
            <NumberStepper label="X" min={0} max={95} value={Math.round(selected.x)} onChange={(value) => updateSelected({ x: value })} />
            <NumberStepper label="Y" min={0} max={92} value={Math.round(selected.y)} onChange={(value) => updateSelected({ y: value })} />
            <NumberStepper label="W" min={4} max={95} value={Math.round(selected.width)} onChange={(value) => updateSelected({ width: value })} />
            <NumberStepper label="H" min={3} max={82} value={Math.round(selected.height)} onChange={(value) => updateSelected({ height: value })} />
            <NumberStepper label="Z" min={1} max={999} value={selected.zIndex} onChange={(value) => updateSelected({ zIndex: value })} />
          </div>
          <div className="container-actions">
            <AppButton size="sm" onClick={() => updateSelected({ visible: !selected.visible })}>{selected.visible ? "Hide" : "Show"}</AppButton>
            <AppButton size="sm" onClick={() => updateSelected({ locked: !selected.locked })}>{selected.locked ? "Unlock" : "Lock"}</AppButton>
            <AppButton size="sm" onClick={() => updateSelected({ depth: selected.depth === "back" ? "front" : "back" })}>{selected.depth === "back" ? "Depan teks" : "Belakang teks"}</AppButton>
            <AppButton size="sm" icon={<SquaresPlusIcon aria-hidden="true" />} onClick={() => onDuplicateContainer(selected.id)}>Duplicate</AppButton>
            <AppButton size="sm" variant="danger" className="danger-text" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteContainer(selected.id)}>Delete</AppButton>
          </div>

          {selected.kind === "image" ? (
            <TextField label="Image URL" value={selected.imageUrl} onChange={(event) => updateSelected({ imageUrl: event.target.value })} />
          ) : (
            <>
              <label className="container-textarea">
                <span>{selected.kind === "svg" ? "SVG markup" : "HTML markup"}</span>
                <textarea
                  value={selected.kind === "svg" ? selected.svg : selected.html}
                  spellCheck={false}
                  onChange={(event) => updateSelected(selected.kind === "svg" ? { svg: event.target.value } : { html: event.target.value })}
                />
              </label>
              {selected.kind === "html" ? (
                <>
                  <label className="container-textarea">
                    <span>CSS</span>
                    <textarea
                      value={selected.css || ""}
                      spellCheck={false}
                      onChange={(event) => updateSelected({ css: event.target.value })}
                    />
                  </label>
                  <label className="container-textarea">
                    <span>JS</span>
                    <textarea
                      value={selected.js || ""}
                      spellCheck={false}
                      onChange={(event) => updateSelected({ js: event.target.value })}
                    />
                  </label>
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <div className="container-ai-box">
        <label className="container-textarea">
          <span>AI prompt</span>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </label>
        <div className="container-actions">
          <AppButton size="sm" icon={<SparklesIcon aria-hidden="true" />} disabled={busyMode != null} onClick={() => void generate("html")}>
            {busyMode === "html" ? "Generating" : "Generate HTML"}
          </AppButton>
          <AppButton size="sm" icon={<SparklesIcon aria-hidden="true" />} disabled={busyMode != null} onClick={() => void generate("svg")}>
            {busyMode === "svg" ? "Generating" : "Generate SVG"}
          </AppButton>
        </div>
        {error ? <p className="container-error">{error}</p> : null}
      </div>

      {imageAssets.length ? (
        <div className="container-asset-grid">
          {imageAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => {
                if (selected) updateSelected({ kind: "image", imageUrl: asset.path, name: asset.name });
                else onAddContainer("image", { imageUrl: asset.path, name: asset.name });
              }}
            >
              <img src={normalizeAssetUrl(asset.path)} alt={asset.name} />
              <span>{asset.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
