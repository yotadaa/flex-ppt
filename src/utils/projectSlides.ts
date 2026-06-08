import type { DashboardProject } from "../components/dashboard/projectData";
import type { SlidesData } from "../types";

export function shouldUseBlankProjectSlides(projectId: string) {
  return projectId.startsWith("local-project-");
}

export function createBlankProjectSlides(project: DashboardProject): SlidesData {
  return {
    slides: [
      {
        index: 1,
        title: project.title,
        chapter: "Draft",
        citations: [],
        bodyText: "Blank editable slide",
        images: [],
        html: `
          <section class="slide blank-editor-slide" data-slide="blank">
            <div class="blank-slide-frame">
              <p data-edit-id="blank-kicker">Flex-PPT draft</p>
              <h1 data-edit-id="blank-title">${escapeHtml(project.title)}</h1>
              <p data-edit-id="blank-body">Add text, shapes, elements, images, and AI-generated containers from the editor toolbar.</p>
            </div>
          </section>
        `,
      },
    ],
    referencePdfs: {},
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
