import { describe, expect, it } from "vitest";
import type { DashboardProject } from "../src/components/dashboard/projectData";
import { createBlankProjectSlides, createBlankSlide, shouldUseBlankProjectSlides } from "../src/utils/projectSlides";

const project: DashboardProject = {
  id: "local-project-42",
  title: "Untitled Flex-PPT 42",
  description: "Blank project",
  ownerEmail: "author@example.com",
  type: "presentation",
  category: "Draft",
  updatedAt: "2026-06-08T00:00:00.000Z",
  thumbnail: "/assets/generated-concept/integrated-scheduling-pipeline.png",
  visibility: "private",
  slideCount: 1,
  provider: "local",
  accent: "#0f766e",
};

describe("project slide selection", () => {
  it("marks local draft projects as blank editor projects", () => {
    expect(shouldUseBlankProjectSlides("local-project-1")).toBe(true);
    expect(shouldUseBlankProjectSlides("project-flex-ppt-thesis")).toBe(false);
  });

  it("creates an isolated blank slide deck for a new local project", () => {
    const slidesData = createBlankProjectSlides(project);

    expect(slidesData.slides).toHaveLength(1);
    expect(slidesData.slides[0]).toMatchObject({
      index: 1,
      title: "Untitled Flex-PPT 42",
      chapter: "Draft",
      citations: [],
      images: [],
    });
    expect(slidesData.slides[0].html).toContain("blank-editor-slide");
    expect(slidesData.slides[0].html).not.toContain("data-edit-id=");
    expect(slidesData.referencePdfs).toEqual({});
  });

  it("creates empty appended slides without seeded editable text", () => {
    const slide = createBlankSlide(3, "Slide baru");

    expect(slide).toMatchObject({
      index: 3,
      title: "Slide baru",
      chapter: "Draft",
      bodyText: "",
      images: [],
    });
    expect(slide.html).toContain("blank-editor-slide");
    expect(slide.html).not.toContain("data-edit-id=");
    expect(slide.html).not.toContain("<h1");
  });
});
