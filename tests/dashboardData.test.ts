import { describe, expect, it } from "vitest";
import type { Slide } from "../src/types";
import { createDraftProject, filterDashboardProjects, seedProjectsFromSlides } from "../src/components/dashboard/projectData";

const slides: Slide[] = [
  {
    index: 1,
    title: "Cover Optimasi Penjadwalan Praktikum",
    chapter: "Pendahuluan",
    citations: [],
    bodyText: "Algoritma Genetika dan Fuzzy Logic",
    images: ["assets/generated-concept/integrated-scheduling-pipeline.png"],
    html: "<section>Cover</section>",
  },
  {
    index: 2,
    title: "Agenda Presentasi",
    chapter: "Pendahuluan",
    citations: [],
    bodyText: "Agenda, metodologi, hasil",
    images: [],
    html: "<section>Agenda</section>",
  },
];

describe("dashboard project data", () => {
  it("seeds a personal thesis presentation project from slide data", () => {
    const projects = seedProjectsFromSlides(slides, "user@example.com");

    expect(projects[0]).toMatchObject({
      id: "project-flex-ppt-thesis",
      title: "Optimasi Penjadwalan Praktikum",
      ownerEmail: "user@example.com",
      type: "presentation",
      slideCount: 2,
      provider: "local",
    });
    expect(projects[0].thumbnail).toContain("generated-concept");
  });

  it("filters by title, owner, type, and category text", () => {
    const projects = seedProjectsFromSlides(slides, "user@example.com");

    expect(filterDashboardProjects(projects, { query: "fuzzy", type: "all" })).toHaveLength(1);
    expect(filterDashboardProjects(projects, { query: "user@example.com", type: "all" })).toHaveLength(1);
    expect(filterDashboardProjects(projects, { query: "skripsi", type: "presentation" })).toHaveLength(1);
    expect(filterDashboardProjects(projects, { query: "skripsi", type: "whiteboard" })).toHaveLength(0);
  });

  it("creates a blank project draft with private visibility", () => {
    const draft = createDraftProject("author@example.com", 7);

    expect(draft).toMatchObject({
      title: "Untitled Flex-PPT 7",
      ownerEmail: "author@example.com",
      visibility: "private",
      type: "presentation",
      provider: "local",
    });
    expect(draft.id).toContain("local-project-7");
  });
});
