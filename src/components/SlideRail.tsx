import { RectangleStackIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { useMemo } from "react";
import type { Slide } from "../types";
import { AppButton } from "./ui/controls";

type SlideRailProps = {
  slides: Slide[];
  currentSlide: number;
  onSelect: (slide: number) => void;
};

export default function SlideRail({ slides, currentSlide, onSelect }: SlideRailProps) {
  const groups = useMemo(() => {
    const map = new Map<string, Slide[]>();
    slides.forEach((slide) => {
      const group = map.get(slide.chapter) || [];
      group.push(slide);
      map.set(slide.chapter, group);
    });
    return Array.from(map.entries()).map(([chapter, items]) => ({ chapter, items }));
  }, [slides]);

  return (
    <aside className="slide-rail" aria-label="Daftar slide">
      <div className="rail-header">
        <strong><RectangleStackIcon aria-hidden="true" />Slides</strong>
        <span>{slides.length}</span>
      </div>
      <div className="rail-list">
        {groups.map((group) => (
          <section className="rail-section" key={group.chapter}>
            <h3>{group.chapter}</h3>
            {group.items.map((slide) => (
              <AppButton
                key={slide.index}
                variant="ghost"
                className={`rail-item ${slide.index === currentSlide ? "active" : ""}`}
                onClick={() => onSelect(slide.index)}
              >
                <Squares2X2Icon className="rail-item-icon" aria-hidden="true" />
                <span className="rail-number">{String(slide.index).padStart(2, "0")}</span>
                <span className="rail-copy">
                  <strong>{slide.title}</strong>
                  <small>{slide.chapter}</small>
                </span>
              </AppButton>
            ))}
          </section>
        ))}
      </div>
    </aside>
  );
}
