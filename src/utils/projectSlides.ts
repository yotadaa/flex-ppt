import type { DashboardProject } from "../components/dashboard/projectData";
import type { Slide, SlidesData } from "../types";

export function shouldUseBlankProjectSlides(projectId: string) {
  return projectId.startsWith("local-project-");
}

export function createBlankProjectSlides(project: DashboardProject): SlidesData {
  return {
    slides: [
      createBlankSlide(1, project.title),
    ],
    referencePdfs: {},
  };
}

export function createBlankSlide(index: number, title = `Untitled slide ${index}`, chapter = "Draft"): Slide {
  return {
    index,
    title,
    chapter,
    citations: [],
    bodyText: "",
    images: [],
    html: `
      <section class="slide blank-editor-slide" data-slide="blank" aria-label="${escapeHtml(title)}">
        <div class="blank-slide-frame" aria-hidden="true"></div>
      </section>
    `,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
