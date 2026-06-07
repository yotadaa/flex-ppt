import { ArrowTopRightOnSquareIcon, DocumentIcon } from "@heroicons/react/24/outline";
import type { ReferenceEntry, Slide } from "../types";
import { normalizeAssetUrl, referenceForSlide, referenceKey } from "../utils/slideDom";

type ReferencePreviewProps = {
  slide: Slide;
  references: Record<string, ReferenceEntry>;
  limit?: number;
};

export default function ReferencePreview({ slide, references, limit = 2 }: ReferencePreviewProps) {
  const entries = slide.citations
    .slice(0, limit)
    .map((citation) => references[referenceKey(citation)] || references[citation.replace(/[()]/g, "")])
    .filter(Boolean)
    .map((entry) => referenceForSlide(entry, slide.index));

  if (!entries.length) {
    return <p className="empty-note">Slide ini tidak memakai rujukan APA eksplisit.</p>;
  }

  return (
    <div className="reference-grid">
      {entries.map((entry) => (
        <a
          key={entry.citation}
          className="reference-card"
          href={normalizeAssetUrl(entry.articleUrl || `assets/reference-pdfs/${entry.file}`)}
          target="_blank"
          rel="noreferrer"
          title="Buka artikel/PDF di tab baru"
        >
          <div className="reference-card-head">
            <span className="cite-badge">{entry.citation}</span>
            <span><DocumentIcon aria-hidden="true" />{entry.page ? `Hal. ${entry.page}` : "PDF lokal"}</span>
            <ArrowTopRightOnSquareIcon aria-hidden="true" />
          </div>
          <strong>{entry.title}</strong>
          {entry.image ? (
            <img src={normalizeAssetUrl(entry.image)} alt={`Preview halaman ${entry.citation}`} />
          ) : (
            <div className="reference-missing">Preview belum tersedia, tetapi file rujukan bisa dibuka.</div>
          )}
          {entry.hits?.length ? <small>Kata cocok: {entry.hits.slice(0, 8).join(", ")}</small> : null}
        </a>
      ))}
    </div>
  );
}
