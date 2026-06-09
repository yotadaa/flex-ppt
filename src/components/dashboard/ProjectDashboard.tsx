import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowPathIcon,
  ArrowsUpDownIcon,
  ChevronDownIcon,
  CircleStackIcon,
  ClockIcon,
  Cog6ToothIcon,
  FolderIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import type { SlidesData } from "../../types";
import { AppButton, ColorField, IconButton, TextField, TrafficLights } from "../ui/controls";
import {
  createDraftProject,
  filterDashboardProjects,
  mergeDashboardProjects,
  seedProjectsFromSlides,
  type DashboardProject,
  type DashboardProjectType,
} from "./projectData";

type ProjectDashboardProps = {
  slidesData: SlidesData;
  userEmail: string;
  isDemo: boolean;
  accessToken?: string;
  onOpenProject: (project: DashboardProject) => void;
  onSignOut: () => void;
};

type DashboardView = "home" | "projects" | "ai" | "trash" | "settings";

type DatabaseStatus = {
  state: "checking" | "connected" | "local" | "saving" | "error";
  message: string;
};

type DatabaseSummary = {
  mode?: string;
  providerCount?: number;
  dialects?: string[];
};

type DashboardSettings = {
  persistToDatabase: boolean;
  openNewProjectImmediately: boolean;
  compactCards: boolean;
  reduceMotion: boolean;
  dashboardAccent: string;
};

const filters: Array<{ id: "all" | DashboardProjectType; label: string }> = [
  { id: "all", label: "Any type" },
  { id: "presentation", label: "Presentation" },
  { id: "design", label: "Design" },
  { id: "whiteboard", label: "Whiteboard" },
  { id: "folder", label: "Folder" },
];

const defaultSettings: DashboardSettings = {
  persistToDatabase: true,
  openNewProjectImmediately: true,
  compactCards: true,
  reduceMotion: false,
  dashboardAccent: "#0f8f86",
};

export default function ProjectDashboard({ slidesData, userEmail, isDemo, accessToken, onOpenProject, onSignOut }: ProjectDashboardProps) {
  const seededProjects = useMemo(() => seedProjectsFromSlides(slidesData.slides, userEmail), [slidesData.slides, userEmail]);
  const [projects, setProjects] = useState(() => seededProjects);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | DashboardProjectType>("all");
  const [activeView, setActiveView] = useState<DashboardView>("home");
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    state: "checking",
    message: "Checking database configuration...",
  });

  useEffect(() => {
    setProjects((current) => mergeDashboardProjects(current, seededProjects));
  }, [seededProjects]);

  useEffect(() => {
    if (isDemo) {
      setDbStatus({ state: "local", message: "Demo workspace uses local projects only." });
      return;
    }

    let cancelled = false;
    fetch("/api/projects", {
      headers: projectRequestHeaders(userEmail, accessToken),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as { projects?: DashboardProject[]; configured?: boolean; database?: DatabaseSummary; error?: string } | null;
        if (cancelled) return;
        if (!response.ok) {
          setDbStatus({ state: "error", message: payload?.error || `Database API returned ${response.status}.` });
          return;
        }
        if (!payload?.configured) {
          setDbStatus({
            state: payload?.error ? "error" : "local",
            message: payload?.error
              ? `${payload.error}. Local fallback is active.`
              : "DATABASE_URL is not configured; local fallback is active.",
          });
          return;
        }
        setDbStatus({ state: "connected", message: `Projects are synced through ${describeDatabase(payload.database)}.` });
        setProjects((current) => mergeDashboardProjects(payload.projects || [], current));
      })
      .catch((error: unknown) => {
        if (!cancelled) setDbStatus({ state: "error", message: error instanceof Error ? error.message : String(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, isDemo, userEmail]);

  const activeProjects = useMemo(() => projects.filter((project) => !project.trashedAt), [projects]);
  const trashProjects = useMemo(() => projects.filter((project) => project.trashedAt), [projects]);
  const visibleProjects = useMemo(() => {
    const source = activeView === "trash" ? trashProjects : activeProjects;
    return filterDashboardProjects(source, { query, type });
  }, [activeProjects, activeView, query, trashProjects, type]);
  const recents = visibleProjects.slice(0, 6);

  async function createProject() {
    const draft = createDraftProject(userEmail, projects.length + 1);
    setProjects((current) => [draft, ...current]);

    if (isDemo || !settings.persistToDatabase) {
      setDbStatus({ state: "local", message: "Project created locally because database persistence is disabled." });
      if (settings.openNewProjectImmediately) onOpenProject(draft);
      return;
    }

    setDbStatus({ state: "saving", message: "Saving new project to database..." });
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          ...projectRequestHeaders(userEmail, accessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });
      const payload = await response.json().catch(() => null) as { project?: DashboardProject | null; configured?: boolean; database?: DatabaseSummary; error?: string } | null;
      if (!response.ok || !payload?.project) {
        setDbStatus({ state: "error", message: payload?.error || `Project save failed with ${response.status}. Local fallback is active.` });
        if (settings.openNewProjectImmediately) onOpenProject(draft);
        return;
      }

      const persisted = payload?.project || draft;
      setProjects((current) => current.map((project) => project.id === draft.id ? persisted : project));
      setDbStatus({ state: "connected", message: `Project saved to ${persisted.provider} via ${describeDatabase(payload?.database)}.` });
      if (settings.openNewProjectImmediately) onOpenProject(persisted);
    } catch (error) {
      setDbStatus({ state: "error", message: error instanceof Error ? error.message : String(error) });
      if (settings.openNewProjectImmediately) onOpenProject(draft);
    }
  }

  function moveToTrash(project: DashboardProject) {
    setProjects((current) => current.map((item) => (
      item.id === project.id ? { ...item, trashedAt: new Date().toISOString() } : item
    )));
  }

  function restoreProject(project: DashboardProject) {
    setProjects((current) => current.map((item) => {
      if (item.id !== project.id) return item;
      const { trashedAt, ...restored } = item;
      return restored;
    }));
  }

  async function deleteForever(project: DashboardProject) {
    setProjects((current) => current.filter((item) => item.id !== project.id));
    if (project.provider === "local" || isDemo) return;
    await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
      method: "DELETE",
      headers: projectRequestHeaders(userEmail, accessToken),
    }).catch(() => undefined);
  }

  const shellStyle = {
    "--dashboard-accent": settings.dashboardAccent,
  } as CSSProperties;

  return (
    <main className={`dashboard-shell ${settings.compactCards ? "is-compact" : ""} ${settings.reduceMotion ? "reduce-motion" : ""}`} style={shellStyle}>
      <aside className="dashboard-global-nav" aria-label="Navigasi utama">
        <TrafficLights />
        <button type="button" className="dashboard-create" onClick={createProject} aria-label="Create project">
          <PlusIcon aria-hidden="true" />
          <span>Create</span>
        </button>
        <nav>
          <NavItem view="home" activeView={activeView} icon={<HomeIcon aria-hidden="true" />} label="Home" onSelect={setActiveView} />
          <NavItem view="projects" activeView={activeView} icon={<FolderIcon aria-hidden="true" />} label="Projects" onSelect={setActiveView} />
          <NavItem view="ai" activeView={activeView} icon={<SparklesIcon aria-hidden="true" />} label="AI" onSelect={setActiveView} />
          <NavItem view="settings" activeView={activeView} icon={<Cog6ToothIcon aria-hidden="true" />} label="Settings" onSelect={setActiveView} />
        </nav>
        <button
          type="button"
          className={`dashboard-trash ${activeView === "trash" ? "active" : ""}`}
          onClick={() => setActiveView("trash")}
        >
          <TrashIcon aria-hidden="true" />
          <span>Trash</span>
        </button>
      </aside>

      <aside className="dashboard-side-panel" aria-label="Project collections">
        <div className="dashboard-logo">Flex-PPT</div>
        <AppButton className="invite-button" icon={<UserCircleIcon aria-hidden="true" />} onClick={() => setActiveView("settings")}>
          {isDemo ? "Demo workspace" : userEmail}
        </AppButton>
        <section>
          <h2>Recent designs</h2>
          {activeProjects.slice(0, 6).map((project) => (
            <button key={project.id} type="button" className="recent-row" onClick={() => onOpenProject(project)}>
              <img src={project.thumbnail} alt="" />
              <span>{project.title}</span>
            </button>
          ))}
        </section>
        <div className={`database-status status-${dbStatus.state}`}>
          <CircleStackIcon aria-hidden="true" />
          <span>{dbStatus.message}</span>
        </div>
        <button type="button" className="sign-out-button" onClick={onSignOut}>Sign out</button>
      </aside>

      <section className="dashboard-main">
        {activeView === "settings" ? (
          <SettingsView
            userEmail={userEmail}
            settings={settings}
            dbStatus={dbStatus}
            onSettingsChange={setSettings}
            onSignOut={onSignOut}
          />
        ) : activeView === "ai" ? (
          <AiView onCreateProject={createProject} dbStatus={dbStatus} />
        ) : activeView === "trash" ? (
          <TrashView projects={visibleProjects} onRestore={restoreProject} onDeleteForever={deleteForever} />
        ) : (
          <>
            <div className="dashboard-hero">
              <h1>{activeView === "projects" ? "All projects" : "What will you design today?"}</h1>
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
              <h2>{activeView === "projects" ? "Projects" : "Recents"}</h2>
              <div>
                <IconButton label="Sort projects" icon={<ArrowsUpDownIcon aria-hidden="true" />} />
                <IconButton label="Grid view" icon={<Squares2X2Icon aria-hidden="true" />} />
                <IconButton label="Create project" icon={<PlusIcon aria-hidden="true" />} onClick={createProject} />
              </div>
            </div>

            {activeView === "home" ? (
              <div className="project-row">
                {recents.map((project) => (
                  <ProjectCard key={project.id} project={project} compact onOpen={() => onOpenProject(project)} onTrash={() => moveToTrash(project)} />
                ))}
              </div>
            ) : null}

            <div className="dashboard-section-head designs-head">
              <h2>Designs</h2>
              <span>{visibleProjects.length} project</span>
            </div>
            <div className="project-grid">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={() => onOpenProject(project)} onTrash={() => moveToTrash(project)} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function NavItem({
  view,
  activeView,
  icon,
  label,
  onSelect,
}: {
  view: DashboardView;
  activeView: DashboardView;
  icon: ReactNode;
  label: string;
  onSelect: (view: DashboardView) => void;
}) {
  return (
    <button type="button" className={activeView === view ? "active" : ""} onClick={() => onSelect(view)}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ProjectCard({
  project,
  onOpen,
  onTrash,
  compact = false,
}: {
  project: DashboardProject;
  onOpen: () => void;
  onTrash?: () => void;
  compact?: boolean;
}) {
  return (
    <article className={`project-card ${compact ? "compact" : ""}`}>
      <button type="button" className="project-open" onClick={onOpen}>
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
      {onTrash ? (
        <IconButton className="project-card-action" label="Move to trash" icon={<TrashIcon aria-hidden="true" />} onClick={onTrash} />
      ) : null}
    </article>
  );
}

function SettingsView({
  userEmail,
  settings,
  dbStatus,
  onSettingsChange,
  onSignOut,
}: {
  userEmail: string;
  settings: DashboardSettings;
  dbStatus: DatabaseStatus;
  onSettingsChange: (settings: DashboardSettings) => void;
  onSignOut: () => void;
}) {
  const set = (patch: Partial<DashboardSettings>) => onSettingsChange({ ...settings, ...patch });
  return (
    <div className="dashboard-config-view">
      <header>
        <p>Settings</p>
        <h1>Workspace preferences</h1>
      </header>
      <section className="settings-grid">
        <article className="settings-card">
          <h2>Account</h2>
          <p>{userEmail}</p>
          <AppButton size="sm" icon={<UserCircleIcon aria-hidden="true" />} onClick={onSignOut}>Sign out</AppButton>
        </article>
        <article className="settings-card">
          <h2>Behavior</h2>
          <ToggleRow label="Open new projects immediately" checked={settings.openNewProjectImmediately} onChange={(checked) => set({ openNewProjectImmediately: checked })} />
          <ToggleRow label="Save new projects to database" checked={settings.persistToDatabase} onChange={(checked) => set({ persistToDatabase: checked })} />
          <ToggleRow label="Reduce dashboard motion" checked={settings.reduceMotion} onChange={(checked) => set({ reduceMotion: checked })} />
        </article>
        <article className="settings-card">
          <h2>Design</h2>
          <ToggleRow label="Compact mac-style cards" checked={settings.compactCards} onChange={(checked) => set({ compactCards: checked })} />
          <ColorField label="Accent" value={settings.dashboardAccent} onChange={(value) => set({ dashboardAccent: value })} />
        </article>
        <article className="settings-card">
          <h2>Data</h2>
          <p>{dbStatus.message}</p>
          <span className={`settings-status status-${dbStatus.state}`}>{dbStatus.state}</span>
        </article>
      </section>
    </div>
  );
}

function AiView({ onCreateProject, dbStatus }: { onCreateProject: () => void; dbStatus: DatabaseStatus }) {
  return (
    <div className="dashboard-config-view ai-config-view">
      <header>
        <p>AI workspace</p>
        <h1>Generate slide containers from prompts</h1>
      </header>
      <section className="settings-grid">
        <article className="settings-card wide">
          <h2>Container generation</h2>
          <p>AI generation is available inside the editor through the Containers panel and the server route that reads the OpenAI-compatible endpoint from env.</p>
          <AppButton icon={<SparklesIcon aria-hidden="true" />} onClick={onCreateProject}>Create AI-ready project</AppButton>
        </article>
        <article className="settings-card">
          <h2>Data status</h2>
          <p>{dbStatus.message}</p>
        </article>
      </section>
    </div>
  );
}

function TrashView({
  projects,
  onRestore,
  onDeleteForever,
}: {
  projects: DashboardProject[];
  onRestore: (project: DashboardProject) => void;
  onDeleteForever: (project: DashboardProject) => void;
}) {
  return (
    <div className="dashboard-config-view">
      <header>
        <p>Trash</p>
        <h1>Recover or permanently remove projects</h1>
      </header>
      {projects.length ? (
        <div className="trash-list">
          {projects.map((project) => (
            <article key={project.id} className="trash-row">
              <img src={project.thumbnail} alt="" />
              <div>
                <strong>{project.title}</strong>
                <span>{project.trashedAt ? `Moved ${new Date(project.trashedAt).toLocaleString()}` : "Moved recently"}</span>
              </div>
              <AppButton size="sm" icon={<ArrowPathIcon aria-hidden="true" />} onClick={() => onRestore(project)}>Restore</AppButton>
              <AppButton size="sm" variant="danger" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteForever(project)}>Delete</AppButton>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-note">Trash is empty.</p>
      )}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="settings-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function projectRequestHeaders(userEmail: string, accessToken?: string): Record<string, string> {
  if (accessToken) return { Authorization: `Bearer ${accessToken}` };
  return { "X-Flex-Local-Email": userEmail };
}

function describeDatabase(database?: DatabaseSummary) {
  const dialects = database?.dialects || [];
  if (database?.mode === "local-mysql" || dialects.includes("mysql")) return "local MySQL";
  if (database?.mode === "supabase" || dialects.includes("postgres")) return "Supabase/Postgres";
  return "the configured database";
}
