import { useEffect, useState } from "react";
import type { AssetsData, SlidesData, ThesisData } from "./types";
import AppShell from "./components/AppShell";
import { publicUrl } from "./utils/slideDom";

type PresenterPayload = {
  slidesData: SlidesData;
  thesisData: ThesisData;
  assetsData: AssetsData;
};

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Gagal memuat ${url}: ${response.status}`);
  return response.json() as Promise<T>;
}

export default function App() {
  const [payload, setPayload] = useState<PresenterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadJson<SlidesData>(publicUrl("/data/slides.json")),
      loadJson<ThesisData>(publicUrl("/data/thesis.json")),
      loadJson<AssetsData>(publicUrl("/data/assets.json")),
    ])
      .then(([slidesData, thesisData, assetsData]) => {
        if (!cancelled) setPayload({ slidesData, thesisData, assetsData });
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      cancelled = true;
    };
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

  return (
    <AppShell
      slidesData={payload.slidesData}
      thesisData={payload.thesisData}
      assetsData={payload.assetsData}
    />
  );
}
