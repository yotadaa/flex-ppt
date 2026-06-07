import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PhotoIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import type { AssetItem, SelectionTarget } from "../types";
import { normalizeAssetUrl } from "../utils/slideDom";
import { AppButton, SegmentedControl, TextField } from "./ui/controls";

type AssetPanelProps = {
  assets: AssetItem[];
  selectedTarget: SelectionTarget | null;
  selectedLayerId: string | null;
  onAddLayer: (asset: AssetItem) => void;
  onReplaceImage: (asset: AssetItem) => void;
};

const filters = ["all", "isometric", "gui", "logo", "slide"] as const;

function isReferenceScreenshot(asset: AssetItem) {
  return asset.kind === "reference" || asset.path.includes("/reference-pdf-pages/");
}

export default function AssetPanel({ assets, selectedTarget, selectedLayerId, onAddLayer, onReplaceImage }: AssetPanelProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");

  const shown = useMemo(() => {
    const q = query.toLowerCase();
    return assets
      .filter((asset) => !isReferenceScreenshot(asset))
      .filter((asset) => filter === "all" || asset.kind === filter)
      .filter((asset) => !q || asset.name.toLowerCase().includes(q) || asset.kind.includes(q))
      .slice(0, 90);
  }, [assets, filter, query]);

  return (
    <section className="asset-panel">
      <div className="panel-search">
        <TextField
          label="Cari aset gambar"
          icon={<MagnifyingGlassIcon aria-hidden="true" />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="isometric, GUI, logo..."
        />
      </div>
      <SegmentedControl
        className="filter-row"
        value={filter}
        onChange={setFilter}
        options={filters.map((item) => ({ value: item, label: item }))}
      />
      <div className="asset-grid">
        {shown.map((asset) => (
          <article
            key={asset.id}
            className="asset-card"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-skripsi-asset", JSON.stringify(asset));
              event.dataTransfer.effectAllowed = "copy";
            }}
          >
            <img src={normalizeAssetUrl(asset.path)} alt={asset.name} loading="lazy" />
            <div>
              <strong>{asset.name}</strong>
              <span>{asset.kind}</span>
            </div>
            <div className="asset-actions">
              <AppButton size="sm" icon={<RectangleStackIcon aria-hidden="true" />} onClick={() => onAddLayer(asset)}>Insert layer</AppButton>
              <AppButton
                size="sm"
                icon={<PhotoIcon aria-hidden="true" />}
                disabled={selectedTarget?.kind !== "image" && !selectedLayerId}
                onClick={() => onReplaceImage(asset)}
              >
                Replace image
              </AppButton>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
