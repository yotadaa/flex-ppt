import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import type { EditorState } from "../types";
import { AppButton, IconButton, NumberStepper, TextField } from "./ui/controls";

type ToolbarProps = {
  state: EditorState;
  slideCount: number;
  isFullscreen: boolean;
  searchQuery: string;
  searchMatchCount: number;
  onGoToSlide: (slide: number) => void;
  onSearchChange: (query: string) => void;
  onSearchPrev: () => void;
  onSearchNext: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void | Promise<void>;
};

export default function Toolbar({
  state,
  slideCount,
  isFullscreen,
  searchQuery,
  searchMatchCount,
  onGoToSlide,
  onSearchChange,
  onSearchPrev,
  onSearchNext,
  onUndo,
  onRedo,
  onOpenPalette,
  onOpenSettings,
  onToggleFullscreen,
}: ToolbarProps) {
  const autosaveDate = new Date(state.autosavedAt);

  return (
    <header className="editor-toolbar">
      <div className="toolbar-brand">
        <span className="brand-mark">FST</span>
        <div>
          <strong>Presenter Web React</strong>
          <span>Optimasi Penjadwalan Praktikum</span>
        </div>
      </div>

      <div className="toolbar-cluster slide-nav-cluster">
        <IconButton label="Slide sebelumnya" icon={<ArrowLeftIcon aria-hidden="true" />} onClick={() => onGoToSlide(state.currentSlide - 1)} />
        <label className="slide-jump" aria-label="Pindah slide">
          <NumberStepper
            label="Slide"
            min={1}
            max={slideCount}
            value={state.currentSlide}
            onChange={onGoToSlide}
            showButtons={false}
          />
          <span>/ {slideCount}</span>
        </label>
        <IconButton label="Slide berikutnya" icon={<ArrowRightIcon aria-hidden="true" />} onClick={() => onGoToSlide(state.currentSlide + 1)} />
      </div>

      <div className="toolbar-search" role="search">
        <TextField
          icon={<MagnifyingGlassIcon aria-hidden="true" />}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cari teks di slide..."
          aria-label="Cari teks di slide"
        />
        <span className="search-count">{searchQuery.trim().length >= 2 ? `${searchMatchCount} hasil` : "min 2 huruf"}</span>
        <IconButton label="Hasil sebelumnya" compact disabled={!searchMatchCount} icon={<ArrowLeftIcon aria-hidden="true" />} onClick={onSearchPrev} />
        <IconButton label="Hasil berikutnya" compact disabled={!searchMatchCount} icon={<ArrowRightIcon aria-hidden="true" />} onClick={onSearchNext} />
      </div>

      <div className="toolbar-cluster grow">
        <AppButton icon={<CommandLineIcon aria-hidden="true" />} onClick={onOpenPalette}>Ctrl+K</AppButton>
        <AppButton icon={<ArrowUturnLeftIcon aria-hidden="true" />} disabled={!state.history.length} onClick={onUndo}>Undo</AppButton>
        <AppButton icon={<ArrowUturnRightIcon aria-hidden="true" />} disabled={!state.future.length} onClick={onRedo}>Redo</AppButton>
        <AppButton
          variant="primary"
          icon={isFullscreen ? <ArrowsPointingInIcon aria-hidden="true" /> : <ArrowsPointingOutIcon aria-hidden="true" />}
          onClick={() => void onToggleFullscreen()}
        >
          {isFullscreen ? "Exit" : "Fullscreen"} <kbd>F</kbd>
        </AppButton>
        <AppButton icon={<Cog6ToothIcon aria-hidden="true" />} onClick={onOpenSettings}>Settings</AppButton>
      </div>

      <div className="autosave-pill" title={autosaveDate.toLocaleString("id-ID")}>
        Autosave {autosaveDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </header>
  );
}
