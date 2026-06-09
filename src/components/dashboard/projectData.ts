import type { Slide } from "../../types";

export type DashboardProjectType = "presentation" | "design" | "whiteboard" | "folder";
export type DashboardVisibility = "private" | "shared";

export type DashboardProject = {
  id: string;
  title: string;
  description: string;
  ownerEmail: string;
  type: DashboardProjectType;
  category: string;
  updatedAt: string;
  thumbnail: string;
  visibility: DashboardVisibility;
  slideCount: number;
  provider: string;
  accent: string;
  trashedAt?: string;
};

export type ProjectFilters = {
  query: string;
  type: "all" | DashboardProjectType;
};

const fallbackThumbnail = "/assets/generated-concept/integrated-scheduling-pipeline.png";

export function seedProjectsFromSlides(slides: Slide[], ownerEmail = "local@flex-ppt.test"): DashboardProject[] {
  const firstImage = slides.find((slide) => slide.images.length)?.images[0] || fallbackThumbnail;
  const thumbnail = firstImage.startsWith("/") ? firstImage : `/${firstImage.replace(/^\/+/, "")}`;

  return [
    {
      id: "project-flex-ppt-thesis",
      title: "Optimasi Penjadwalan Praktikum",
      description: "Deck skripsi dengan editor layer, draft, referensi, export PDF, Algoritma Genetika, dan Fuzzy Logic.",
      ownerEmail,
      type: "presentation",
      category: "Skripsi",
      updatedAt: new Date().toISOString(),
      thumbnail,
      visibility: "private",
      slideCount: slides.length,
      provider: "local",
      accent: "#14b8a6",
    },
  ];
}

export function createDraftProject(ownerEmail: string, sequence: number): DashboardProject {
  return {
    id: `local-project-${sequence}`,
    title: `Untitled Flex-PPT ${sequence}`,
    description: "Presentation workspace baru.",
    ownerEmail,
    type: "presentation",
    category: "Draft",
    updatedAt: new Date().toISOString(),
    thumbnail: fallbackThumbnail,
    visibility: "private",
    slideCount: 1,
    provider: "local",
    accent: "#0f8f86",
  };
}

export function isBlankDraftProject(project: DashboardProject) {
  return project.id.startsWith("local-project-") || project.category.toLowerCase() === "draft";
}

export function mergeDashboardProjects(primary: DashboardProject[], fallback: DashboardProject[]) {
  const seen = new Set<string>();
  return [...primary, ...fallback].filter((project) => {
    if (seen.has(project.id)) return false;
    seen.add(project.id);
    return true;
  });
}

export function filterDashboardProjects(projects: DashboardProject[], filters: ProjectFilters) {
  const query = filters.query.trim().toLowerCase();
  return projects
    .filter((project) => filters.type === "all" || project.type === filters.type)
    .filter((project) => {
      if (!query) return true;
      return [
        project.title,
        project.description,
        project.ownerEmail,
        project.type,
        project.category,
        project.provider,
      ].some((value) => value.toLowerCase().includes(query));
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}
