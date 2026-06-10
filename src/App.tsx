"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetsData, SlidesData, ThesisData } from "./types";
import AppShell from "./components/AppShell";
import AuthScreen from "./components/auth/AuthScreen";
import ProjectDashboard from "./components/dashboard/ProjectDashboard";
import { createSeedProjectFromSlides, isBlankDraftProject, type DashboardProject } from "./components/dashboard/projectData";
import { clearLocalAuthSession, getLocalAuthSession, type LocalAuthSession } from "./lib/localAuth";
import { createBlankProjectSlides, shouldUseBlankProjectSlides } from "./utils/projectSlides";
import { publicUrl } from "./utils/slideDom";

type PresenterPayload = {
  slidesData: SlidesData;
  thesisData: ThesisData;
  assetsData: AssetsData;
};

type AppPayload = {
  defaultProject: PresenterPayload;
  projectDatasets: Record<string, PresenterPayload>;
};

const codeSnapshotDatasetId = "code-snapshot";

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Gagal memuat ${url}: ${response.status}`);
  return response.json() as Promise<T>;
}

async function loadPresenterPayload(basePath: string): Promise<PresenterPayload> {
  const [slidesData, thesisData, assetsData] = await Promise.all([
    loadJson<SlidesData>(publicUrl(`${basePath}/slides.json`)),
    loadJson<ThesisData>(publicUrl(`${basePath}/thesis.json`)),
    loadJson<AssetsData>(publicUrl(`${basePath}/assets.json`)),
  ]);
  return { slidesData, thesisData, assetsData };
}

export default function App() {
  const [payload, setPayload] = useState<AppPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<LocalAuthSession | null>(null);
  const [activeProject, setActiveProject] = useState<DashboardProject | null>(null);
  const userEmail = session?.user.email || null;
  const extraBuiltInProjects = useMemo(() => {
    if (!payload || !userEmail) return [];
    const codeSnapshotPayload = payload.projectDatasets[codeSnapshotDatasetId];
    if (!codeSnapshotPayload) return [];
    return [
      createSeedProjectFromSlides(codeSnapshotPayload.slidesData.slides, userEmail, {
        id: "project-code-snapshot",
        datasetId: codeSnapshotDatasetId,
        title: "Code Snapshot - Optimasi Penjadwalan Praktikum",
        description: "Project terpisah dari data C:\\skripsi\\presentation\\code-snapshot\\public\\data.",
        category: "Code Snapshot",
        accent: "#267a9c",
      }),
    ];
  }, [payload, userEmail]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadPresenterPayload("/data"),
      loadPresenterPayload("/projects/code-snapshot/data"),
    ])
      .then(([defaultProject, codeSnapshotProject]) => {
        if (!cancelled) {
          setPayload({
            defaultProject,
            projectDatasets: {
              [codeSnapshotDatasetId]: codeSnapshotProject,
            },
          });
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSession(getLocalAuthSession());
    setAuthReady(true);
  }, []);

  if (error) {
    return (
      <main className="boot-screen">
        <div>
          <p className="boot-label">Presenter React</p>
          <h1>Data gagal dimuat.</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="boot-screen">
        <div>
          <p className="boot-label">Presenter React</p>
          <h1>Memuat slide, draft, dan aset...</h1>
          <p>Data besar dimuat sebagai file JSON statis agar bundle awal tetap ringan.</p>
        </div>
      </main>
    );
  }

  if (!authReady) {
    return (
      <main className="boot-screen">
        <div>
          <p className="boot-label">Flex-PPT</p>
          <h1>Menyiapkan workspace...</h1>
          <p>Session dan data presenter sedang disiapkan.</p>
        </div>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <AuthScreen
        onAuthenticated={(nextSession) => {
          setSession(nextSession);
        }}
      />
    );
  }

  if (!activeProject) {
    return (
      <ProjectDashboard
        slidesData={payload.defaultProject.slidesData}
        extraProjects={extraBuiltInProjects}
        userEmail={userEmail}
        isDemo={false}
        onOpenProject={setActiveProject}
        onSignOut={() => {
          clearLocalAuthSession();
          setSession(null);
          setActiveProject(null);
        }}
      />
    );
  }

  const activeProjectPayload = activeProject.datasetId && activeProject.datasetId !== "default"
    ? payload.projectDatasets[activeProject.datasetId] || payload.defaultProject
    : payload.defaultProject;
  const projectSlidesData = shouldUseBlankProjectSlides(activeProject.id) || isBlankDraftProject(activeProject)
    ? createBlankProjectSlides(activeProject)
    : activeProjectPayload.slidesData;

  return (
    <div className="editor-project-host">
      <AppShell
        key={activeProject.id}
        projectId={activeProject.id}
        projectTitle={activeProject.title}
        userEmail={userEmail}
        slidesData={projectSlidesData}
        thesisData={activeProjectPayload.thesisData}
        assetsData={activeProjectPayload.assetsData}
        onReturnToDashboard={() => setActiveProject(null)}
      />
    </div>
  );
}
