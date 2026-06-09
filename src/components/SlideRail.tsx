import { PlusIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import type { Slide } from "../types";
import { AppButton } from "./ui/controls";

type SlideRailProps = {
  slides: Slide[];
  currentSlide: number;
  onSelect: (slide: number) => void;
  onAddSlide: () => void;
};

export default function SlideRail({ slides, currentSlide, onSelect, onAddSlide }: SlideRailProps) {
  return (
    <aside className="slide-rail" aria-label="Daftar slide">
      <div className="rail-header">
        <strong><RectangleStackIcon aria-hidden="true" />Slides</strong>
        <span>{slides.length}</span>
      </div>
      <div className="rail-list">
        {slides.map((slide) => {
          const thumbnail = slide.images?.[0];
          return (
            <AppButton
              key={slide.index}
              variant="ghost"
              className={`rail-item ${slide.index === currentSlide ? "active" : ""}`}
              onClick={() => onSelect(slide.index)}
            >
              <span className="rail-thumb">
                {thumbnail ? <img src={normalizeSlideImage(thumbnail)} alt="" /> : <span>{slide.index}</span>}
              </span>
              <span className="rail-copy">
                <strong>{slide.title}</strong>
                <small>{slide.chapter}</small>
              </span>
            </AppButton>
          );
        })}
        <button type="button" className="rail-add" aria-label="Add slide" onClick={onAddSlide}>
          <PlusIcon aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

function normalizeSlideImage(path: string) {
  return path.startsWith("/") ? path : `/${path.replace(/^\/+/, "")}`;
}
