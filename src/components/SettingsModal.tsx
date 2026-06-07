import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  SwatchIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import type { FontFamilyName, ThemeName } from "../types";
import { AppButton, ColorField, IconButton, SelectMenu, SegmentedControl, TrafficLights } from "./ui/controls";

const themes: Array<{ value: ThemeName; label: string }> = [
  { value: "light", label: "Light Academic" },
  { value: "mint", label: "Mint Lab" },
  { value: "navy", label: "Navy Focus" },
  { value: "paper", label: "Warm Paper" },
  { value: "contrast", label: "High Contrast" },
];

const fontFamilies: Array<{ value: FontFamilyName; label: string; note: string }> = [
  { value: "inter", label: "Inter", note: "Modern dan rapi untuk slide akademik." },
  { value: "jakarta", label: "Plus Jakarta Sans", note: "Google font lokal, hangat dan formal." },
  { value: "noto", label: "Noto Sans", note: "Google font lokal, sangat terbaca." },
  { value: "sourceSerif", label: "Source Serif 4", note: "Google font lokal, akademik dan formal." },
  { value: "robotoSlab", label: "Roboto Slab", note: "Google font lokal, tegas untuk heading." },
  { value: "system", label: "System UI", note: "Mengikuti font bawaan sistem." },
  { value: "serif", label: "Serif", note: "Lebih formal seperti dokumen." },
  { value: "mono", label: "Monospace", note: "Cocok untuk detail teknis/kode." },
  { value: "rounded", label: "Rounded", note: "Lebih lembut untuk presentasi visual." },
];

type SettingsModalProps = {
  theme: ThemeName;
  fontFamily: FontFamilyName;
  accent: string;
  isPdfExporting: boolean;
  onClose: () => void;
  onThemeChange: (theme: ThemeName) => void;
  onFontFamilyChange: (fontFamily: FontFamilyName) => void;
  onAccentChange: (accent: string) => void;
  onExportPdf: () => void;
  onExportState: () => string;
  onImportState: (value: string) => void;
  onResetSlide: () => void;
  onResetAll: () => void;
};

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SettingsModal({
  theme,
  fontFamily,
  accent,
  isPdfExporting,
  onClose,
  onThemeChange,
  onFontFamilyChange,
  onAccentChange,
  onExportPdf,
  onExportState,
  onImportState,
  onResetSlide,
  onResetAll,
}: SettingsModalProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<"visual" | "export" | "reset">("visual");

  return (
    <div className="settings-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-label="Konfigurasi presenter">
        <header className="settings-head">
          <TrafficLights />
          <div className="settings-icon"><Cog6ToothIcon aria-hidden="true" /></div>
          <div>
            <p>Konfigurasi</p>
            <h2>Pengaturan Presenter</h2>
          </div>
          <IconButton className="modal-close settings-close" label="Tutup konfigurasi" icon={<XMarkIcon aria-hidden="true" />} onClick={onClose} />
        </header>

        <div className="settings-shell">
          <aside className="settings-nav" aria-label="Kategori pengaturan">
            <SegmentedControl
              className="settings-nav-control"
              value={section}
              onChange={setSection}
              options={[
                { value: "visual", label: "Tampilan", icon: <SwatchIcon aria-hidden="true" /> },
                { value: "export", label: "Export", icon: <DocumentArrowDownIcon aria-hidden="true" /> },
                { value: "reset", label: "Reset", icon: <TrashIcon aria-hidden="true" /> },
              ]}
            />
          </aside>

          <div className="settings-grid">
            {section === "visual" ? (
              <section className="settings-section">
                <h3>Visual slide</h3>
                <SelectMenu label="Theme" value={theme} options={themes} onChange={onThemeChange} />
                <SelectMenu label="Font family" value={fontFamily} options={fontFamilies} onChange={onFontFamilyChange} />
                <ColorField label="Accent color" value={accent} icon={<SwatchIcon aria-hidden="true" />} onChange={onAccentChange} />
              </section>
            ) : null}

            {section === "export" ? (
              <section className="settings-section">
                <h3>Export</h3>
                <p className="settings-note">Export PDF akan mengunduh file 16:9 secara langsung dan memakai theme, font, serta warna aksen aktif.</p>
                <AppButton className="settings-action" variant="primary" size="lg" disabled={isPdfExporting} icon={<DocumentArrowDownIcon aria-hidden="true" />} onClick={onExportPdf}>
                  {isPdfExporting ? "Menyiapkan PDF" : "Export PDF"}
                </AppButton>
                <AppButton className="settings-action" size="lg" icon={<ArrowDownTrayIcon aria-hidden="true" />} onClick={() => downloadText("skripsi-presenter-state.json", onExportState())}>
                  Export State JSON
                </AppButton>
                <AppButton className="settings-action" size="lg" icon={<ArrowUpTrayIcon aria-hidden="true" />} onClick={() => importRef.current?.click()}>
                  Import State JSON
                </AppButton>
                <input
                  ref={importRef}
                  hidden
                  type="file"
                  accept="application/json"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    onImportState(await file.text());
                    event.target.value = "";
                  }}
                />
              </section>
            ) : null}

            {section === "reset" ? (
              <section className="settings-section danger-zone">
                <h3>Reset</h3>
                <AppButton className="settings-action" size="lg" icon={<ArrowPathIcon aria-hidden="true" />} onClick={() => window.confirm("Reset slide aktif?") && onResetSlide()}>
                  Reset Slide Aktif
                </AppButton>
                <AppButton className="settings-action" variant="danger" size="lg" icon={<TrashIcon aria-hidden="true" />} onClick={() => window.confirm("Reset semua edit dan layer?") && onResetAll()}>
                  Reset Semua
                </AppButton>
              </section>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
