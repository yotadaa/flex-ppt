import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowsUpDownIcon,
  ChevronDownIcon,
  ClockIcon,
  FolderIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RectangleStackIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import type { SlidesData } from "../../types";
import { AppButton, IconButton, TextField, TrafficLights } from "../ui/controls";
import { createDraftProject, filterDashboardProjects, seedProjectsFromSlides, type DashboardProject, type DashboardProjectType } from "./projectData";

type ProjectDashboardProps = {
  slidesData: SlidesData;
  userEmail: string;
  isDemo: boolean;
  accessToken?: string;
  onOpenProject: (project: DashboardProject) => void;
  onSignOut: () => void;
};

const filters: Array<{ id: "all" | DashboardProjectType; label: string }> = [
  { id: "all", label: "Any type" },
  { id: "presentation", label: "Presentation" },
  { id: "design", label: "Design" },
  { id: "whiteboard", label: "Whiteboard" },
  { id: "folder", label: "Folder" },
];

export default function ProjectDashboard({ slidesData, userEmail, isDemo, accessToken, onOpenProject, onSignOut }: ProjectDashboardProps) {
  const [projects, setProjects] = useState(() => seedProjectsFromSlides(slidesData.slides, userEmail));
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | DashboardProjectType>("all");
  const visibleProjects = useMemo(() => filterDashboardProjects(projects, { query, type }), [projects, query, type]);
  const recents = visibleProjects.slice(0, 6);

  useEffect(() => {
    if (isDemo || !accessToken) return;
    let cancelled = false;

    fetch("/api/projects", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (response) => response.ok ? response.json() : null)
      .then((payload: { projects?: DashboardProject[]; configured?: boolean } | null) => {
        if (cancelled || !payload?.configured || !payload.projects?.length) return;
        setProjects(payload.projects);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [accessToken, isDemo]);

  async function createProject() {
    const draft = createDraftProject(userEmail, projects.length + 1);
    setProjects((current) => [draft, ...current]);
    if (isDemo || !accessToken) {
      onOpenProject(draft);
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });
      if (!response.ok) {
        onOpenProject(draft);
        return;
      }
      const payload = await response.json() as { project?: DashboardProject };
      const persisted = payload.project || draft;
      setProjects((current) => current.map((project) => project.id === draft.id ? persisted : project));
      onOpenProject(persisted);
    } catch {
      onOpenProject(draft);
    }
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-global-nav" aria-label="Navigasi utama">
        <TrafficLights />
        <button type="button" className="dashboard-create" onClick={createProject} aria-label="Create project">
          <PlusIcon aria-hidden="true" />
          <span>Create</span>
        </button>
        <nav>
          <a className="active"><HomeIcon aria-hidden="true" /><span>Home</span></a>
          <a><FolderIcon aria-hidden="true" /><span>Projects</span></a>
          <a><RectangleStackIcon aria-hidden="true" /><span>Templates</span></a>
          <a><SparklesIcon aria-hidden="true" /><span>AI</span></a>
        </nav>
        <button type="button" className="dashboard-trash">
          <TrashIcon aria-hidden="true" />
          <span>Trash</span>
        </button>
      </aside>

      <aside className="dashboard-side-panel" aria-label="Project collections">
        <div className="dashboard-logo">Flex-PPT</div>
        <AppButton className="invite-button" icon={<UserCircleIcon aria-hidden="true" />} onClick={() => undefined}>
          {isDemo ? "Demo workspace" : userEmail}
        </AppButton>
        <section>
          <h2>Recent designs</h2>
          {recents.map((project) => (
            <button key={project.id} type="button" className="recent-row" onClick={() => onOpenProject(project)}>
              <img src={project.thumbnail} alt="" />
              <span>{project.title}</span>
            </button>
          ))}
        </section>
        <button type="button" className="sign-out-button" onClick={onSignOut}>Sign out</button>
      </aside>

      <section className="dashboard-main">
        <div className="dashboard-hero">
          <h1>What will you design today?</h1>
          <TextField
            className="dashboard-search"
            icon={<MagnifyingGlassIcon aria-hidden="true" />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, slides and uploads"
            aria-label="Search projects"
          />
          <div className="dashboard-type-row" role="list" aria-label="Project type filters">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={type === filter.id ? "active" : ""}
                onClick={() => setType(filter.id)}
              >
                {filter.label}
                <ChevronDownIcon aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-section-head">
          <h2>Recents</h2>
          <div>
            <IconButton label="Sort projects" icon={<ArrowsUpDownIcon aria-hidden="true" />} />
            <IconButton label="Grid view" icon={<Squares2X2Icon aria-hidden="true" />} />
            <IconButton label="Create project" icon={<PlusIcon aria-hidden="true" />} onClick={createProject} />
          </div>
        </div>

        <div className="project-row">
          {recents.map((project) => (
            <ProjectCard key={project.id} project={project} compact onOpen={() => onOpenProject(project)} />
          ))}
        </div>

        <div className="dashboard-section-head designs-head">
          <h2>Designs</h2>
          <span>{visibleProjects.length} project</span>
        </div>
        <div className="project-grid">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onOpen={() => onOpenProject(project)} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ProjectCard({ project, onOpen, compact = false }: { project: DashboardProject; onOpen: () => void; compact?: boolean }) {
  return (
    <button type="button" className={`project-card ${compact ? "compact" : ""}`} onClick={onOpen}>
      <span className="project-thumb" style={{ "--project-accent": project.accent } as CSSProperties}>
        <img src={project.thumbnail} alt="" />
        {project.visibility === "private" ? <span className="privacy-pill">Private</span> : null}
      </span>
      <strong>{project.title}</strong>
      <span className="project-meta">
        <ClockIcon aria-hidden="true" />
        {project.type} - {project.slideCount} slide - {project.provider}
      </span>
    </button>
  );
}
