import { useMemo, useState } from "react";
import { DocumentMagnifyingGlassIcon, InformationCircleIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { ReferenceEntry, SelectionTarget, Slide, ThesisBlock } from "../types";
import DraftPanel from "./DraftPanel";
import ReferencePreview from "./ReferencePreview";
import ReplaceTextPanel from "./ReplaceTextPanel";
import { AppButton, IconButton, TrafficLights } from "./ui/controls";

type DetailModalProps = {
  slide: Slide;
  target: SelectionTarget;
  references: Record<string, ReferenceEntry>;
  thesisBlocks: ThesisBlock[];
  onClose: () => void;
  onShowDraft: (query: string) => void;
  onReplaceText: (replacement: string) => void;
};

function contextFor(slide: Slide, target: SelectionTarget) {
  const text = `${slide.title} ${target.text}`.toLowerCase();
  if (text.includes("crossover") || text.includes("divers") || text.includes("cr ")) {
    return "Bagian ini menjelaskan Cr sebagai intensitas pertukaran genetik. Pada versi fuzzy, diversity dan stagnansi hasil crossover dibaca untuk menaikkan atau menurunkan crossover rate agar eksplorasi tidak berhenti terlalu dini.";
  }
  if (text.includes("mutation") || text.includes("mutasi") || text.includes("mr ")) {
    return "Bagian ini menjelaskan Mr sebagai kontrol perubahan gen. Fuzzy mutation berbeda dari crossover karena membaca pergerakan skor fitness dari iterasi sebelumnya, terutama setelah iterasi lebih dari satu.";
  }
  if (text.includes("fitness") || text.includes("penalty") || text.includes("penalti") || text.includes("tatap muka")) {
    return "Bagian ini mengikat kualitas jadwal ke nilai fitness. Pelanggaran ruang, kelompok, asisten, dan benturan praktikum dengan mata kuliah tatap muka/teori masuk sebagai penalty; konflik tatap muka diberi bobot menengah hingga tinggi.";
  }
  if (text.includes("greedy") || text.includes("repair") || text.includes("post-processing")) {
    return "Bagian ini menempatkan greedy/repair sebagai tahap pasca-evolusi: kandidat jadwal yang masih menyisakan konflik diperbaiki dengan memilih alternatif ruang atau waktu yang lebih feasible.";
  }
  if (text.includes("gui") || text.includes("generated schedule") || text.includes("dashboard")) {
    return "Bagian ini menunjukkan bagaimana hasil optimasi dibaca pengguna melalui GUI: konfigurasi run, evolusi fitness, jadwal akhir, status valid, dan laporan evaluasi.";
  }
  if (text.includes("kromosom") || text.includes("gen")) {
    return "Bagian ini menjelaskan representasi solusi. Satu kromosom adalah satu kandidat jadwal lengkap, sedangkan setiap gen menyimpan informasi satu sesi praktikum beserta atribut ruang, hari, waktu, group, dan asisten.";
  }
  return "Konteks ini diambil dari slide aktif dan diarahkan ke paragraf draft yang paling dekat secara kata kunci, sehingga teks slide bisa diganti tanpa kehilangan hubungan dengan skripsi.";
}

export default function DetailModal({
  slide,
  target,
  references,
  thesisBlocks,
  onClose,
  onShowDraft,
  onReplaceText,
}: DetailModalProps) {
  const [mode, setMode] = useState<"summary" | "draft" | "replace">("summary");
  const [draftQuery, setDraftQuery] = useState(target.text || slide.title);
  const context = useMemo(() => contextFor(slide, target), [slide, target]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-label="Detail item slide">
        <IconButton className="modal-close" onClick={onClose} label="Tutup" icon={<XMarkIcon aria-hidden="true" />} />
        <div className="modal-heading">
          <TrafficLights />
          <span className="modal-icon"><InformationCircleIcon aria-hidden="true" /></span>
          <div>
            <p>{slide.chapter} - Slide {String(slide.index).padStart(2, "0")}</p>
            <h2>{target.text ? target.text.slice(0, 160) : slide.title}</h2>
          </div>
        </div>

        <div className="modal-tabs">
          <AppButton variant={mode === "summary" ? "primary" : "secondary"} icon={<InformationCircleIcon aria-hidden="true" />} onClick={() => setMode("summary")}>Konteks</AppButton>
          <AppButton variant={mode === "draft" ? "primary" : "secondary"} icon={<DocumentMagnifyingGlassIcon aria-hidden="true" />} onClick={() => {
            setMode("draft");
            onShowDraft(draftQuery);
          }}>Lihat di draft</AppButton>
          <AppButton variant={mode === "replace" ? "primary" : "secondary"} icon={<PencilSquareIcon aria-hidden="true" />} onClick={() => setMode("replace")}>Replace text</AppButton>
        </div>

        {mode === "summary" ? (
          <div className="modal-scroll">
            <section className="modal-section">
              <h3>Konteks skripsi</h3>
              <p>{context}</p>
            </section>
            <section className="modal-section">
              <h3>Rujukan APA</h3>
              <ReferencePreview slide={slide} references={references} />
            </section>
          </div>
        ) : null}

        {mode === "draft" ? (
          <div className="modal-scroll">
            <DraftPanel blocks={thesisBlocks} query={draftQuery} onQueryChange={setDraftQuery} limit={10} />
          </div>
        ) : null}

        {mode === "replace" ? (
          <div className="modal-scroll">
            <ReplaceTextPanel
              target={target}
              blocks={thesisBlocks}
              initialQuery={draftQuery}
              onApply={(replacement) => {
                onReplaceText(replacement);
                onClose();
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
