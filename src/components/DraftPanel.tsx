import { MagnifyingGlassIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import type { ThesisBlock } from "../types";
import { highlightText, useDraftSearch } from "../hooks/useDraftSearch";
import { AppButton, TextField } from "./ui/controls";

type DraftPanelProps = {
  blocks: ThesisBlock[];
  query: string;
  onQueryChange: (query: string) => void;
  limit?: number;
  selectable?: boolean;
  onUseSelection?: (block: ThesisBlock, selectedText: string) => void;
};

export default function DraftPanel({
  blocks,
  query,
  onQueryChange,
  limit = 12,
  selectable = false,
  onUseSelection,
}: DraftPanelProps) {
  const results = useDraftSearch(blocks, query, limit);

  return (
    <section className="draft-panel">
      <div className="panel-search">
        <TextField
          label="Cari di draft skripsi"
          icon={<MagnifyingGlassIcon aria-hidden="true" />}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Cari paragraf, fuzzy, greedy, penalti..."
        />
      </div>
      <div className="draft-results">
        {results.map((block) => (
          <article key={block.id} className="draft-card">
            <div className="draft-meta">
              <span>{block.section || "Draft"}</span>
              <span>Par. {block.index}</span>
            </div>
            <p>
              {highlightText(block.text, query).map((part) => (
                <mark key={part.index} className={part.hit ? "hit" : ""}>{part.text}</mark>
              ))}
            </p>
            {selectable ? (
              <AppButton
                size="sm"
                icon={<PlusCircleIcon aria-hidden="true" />}
                onClick={() => {
                  const selected = window.getSelection()?.toString().trim();
                  onUseSelection?.(block, selected || block.text);
                }}
              >
                Tambah teks terseleksi
              </AppButton>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
