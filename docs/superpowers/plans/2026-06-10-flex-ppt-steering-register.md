# Flex-PPT Steering Register Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every user steer for Flex-PPT visible, executable, validated, and auditable.

**Architecture:** This register sits above the detailed editor MVP plan and tracks user-facing requirements across data, dashboard, editor interaction, design, auth, database, and release work. Implementation remains in the existing Next.js/React app with local auth first, optional Supabase database integration through server routes, and no committed QA artifacts.

**Tech Stack:** Next.js App Router, React, TypeScript, Heroicons, Vitest, Playwright/browser smoke checks, Supabase Postgres server routes, localStorage fallback.

---

### Task A: Repo, Environment, And Release Hygiene

**Files:**
- Modify: `.gitignore`
- Modify: `.env.example`
- Modify: `package.json`

- [x] Set the app dev/start port to `5999`.
- [x] Keep QA screenshots/reports out of the repo; save temporary audit screenshots outside `C:\skripsi\flex-ppt`.
- [x] Verify `.gitignore` ignores local env files, build outputs, temp QA artifacts, and dependency folders while keeping source data/assets tracked.
- [ ] Use HTTPS remote `https://github.com/yotadaa/flex-ppt.git`.
- [ ] Commit completed task groups with focused staging.
- [ ] Push `main` after final validation.

### Task B: Docs And Product Understanding

**Files:**
- Read: `docs/**/*.md`
- Skip: docs/files named or scoped as `claude-edit`
- Modify: `docs/superpowers/plans/2026-06-08-editor-mvp-layout-tools.md`
- Modify: `docs/superpowers/plans/2026-06-10-flex-ppt-steering-register.md`

- [x] Read project markdown docs except `claude-edit`.
- [x] Build a structured blueprint for the Next.js conversion, auth, editor MVP, dashboard, and validation flow.
- [x] Rebuild tasklists when new steering arrives.
- [x] Keep this register updated before claiming a prompt is handled.

### Task C: Auth, Database, And Project Persistence

**Files:**
- Modify: `src/server/auth.ts`
- Modify: `src/server/database.ts`
- Modify: `src/server/projectsRepository.ts`
- Modify: `app/api/projects/route.ts`
- Modify: `app/api/projects/[id]/route.ts`
- Modify: `src/components/dashboard/ProjectDashboard.tsx`

- [x] Use local email auth for now, no email confirmation.
- [x] Check `.env.example` and local env for Supabase/Postgres database URLs without exposing values.
- [ ] Support three database URLs with provider selection/round-robin planning.
- [ ] Add provider tracking in database-backed records where relevant.
- [ ] Create new projects through the project API and persist to database when DB env is valid.
- [x] Fall back to local mode cleanly when DB env is absent or unavailable.
- [x] Use local MySQL for now with `root/password` and auto-created `flex_ppt.projects`.
- [x] Keep Supabase/Postgres available behind explicit `FLEX_DATABASE_MODE=supabase`.
- [ ] Handle Windows-to-WSL MySQL connectivity when WSL `mysqld` listens on `127.0.0.1:3306` but the Windows app sees `ECONNREFUSED`.
- [ ] Document local MySQL connection options: Windows MySQL service, WSL IP/port proxy, or `LOCAL_DATABASE_URL` override.
- [ ] Make database-created draft projects open as blank editor projects.

### Task D: Dashboard Canva-Like Layout, Not Canva Colors

**Files:**
- Modify: `src/components/dashboard/ProjectDashboard.tsx`
- Modify: `src/components/dashboard/projectData.ts`
- Modify: `src/styles/app.css`

- [x] Use Canva-like dashboard information architecture and layout density.
- [x] Do not copy Canva's color scheme.
- [x] Remove Templates menu.
- [ ] Make Projects, AI, and Trash clickable and stateful.
- [ ] Add Settings for account, behavior, design, and data controls.
- [ ] Add Trash flows: view deleted items, restore, permanently delete.
- [ ] Fix Add New so it creates and opens a new blank project instead of loading an existing project.

### Task E: Mac-Oriented Design Research And Audit

**Files:**
- Modify: `docs/design/macos-canva-reference-research.md`
- Modify: `src/styles/app.css`

- [x] Research macOS design direction: SF/system typography, translucent surfaces, compact controls, subtle borders, grouped toolbars, restrained color.
- [x] Use mac-ish vibe with neutral graphite/teal direction, not purple Canva-like theming.
- [ ] Audit screenshots after changes for mac orientation, spacing, hierarchy, and anomalies.
- [ ] Iterate visual issues before final commit.

### Task F: Editor Layout And Tooling MVP

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/EditorToolbelt.tsx`
- Modify: `src/components/Inspector.tsx`
- Modify: `src/components/SlideRail.tsx`
- Modify: `src/components/SlideCanvas.tsx`
- Modify: `src/styles/app.css`

- [x] Use Heroicons for tools.
- [x] Add top editorial/Figma-like toolbar.
- [x] Put slide list at the bottom like Canva.
- [x] Make slide rail thinner and remove duplicated/redundant slide numbers.
- [ ] Move right sidebar tabs to the left edge of the right sidebar.
- [ ] Show references in list view.
- [ ] Keep right inspector for selected element controls.

### Task G: Dynamic Slide Objects And Components

**Files:**
- Modify: `src/types.ts`
- Modify: `src/hooks/useEditorState.ts`
- Modify: `src/utils/editorTools.ts`
- Modify: `src/utils/containers.ts`
- Modify: `src/components/SlideCanvas.tsx`
- Modify: `src/components/LayerPanel.tsx`
- Modify: `src/components/ElementPropertiesPanel.tsx`
- Modify: `src/components/ContainerPanel.tsx`

- [x] Add tools: rectangle `R`, line `L`, arrow `Shift+L`, ellipse `O`, polygon, star, image/video, element, pen `P`, pencil `Shift+P`, text `T`, comment, move `V`, hand `H`, scale `K`, component.
- [x] Add containers that can render HTML/SVG/image content.
- [x] Add element editing fields for HTML/CSS/JS and AI-assisted generation hooks.
- [ ] Add component creation flow for reusable selected objects.
- [ ] Add shape and element styling controls in the inspector.
- [ ] Right-click text should expose layer-style controls.

### Task H: Slide Creation And Blank Starts

**Files:**
- Modify: `src/utils/projectSlides.ts`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/SlideRail.tsx`
- Modify: `src/hooks/useEditorState.ts`
- Test: `tests/projectSlides.test.ts`

- [x] New project starts from blank slide content.
- [x] New blank slide has no seeded heading/body/data-edit text.
- [x] User adds heading/subheading/body through Text tool.
- [x] Add slide from bottom rail and keep slide count/search/print state in sync.
- [ ] Validate Add New opens the new blank project every time.

### Task I: Resize And Selection Behavior

**Files:**
- Modify: `src/components/SlideCanvas.tsx`
- Modify: `src/hooks/useEditorState.ts`
- Modify: `src/styles/app.css`
- Test: `tests/editorTools.test.ts`
- Test: `tests/slideAnimation.test.ts`

- [x] Support width and height for image layers and managed base images.
- [x] Add edge/corner resize handles.
- [x] Remove large floating scale button because edge/corner handles control width, height, and scaling.
- [ ] Drag side handles changes width or height independently.
- [ ] Drag corner handles changes both dimensions.
- [x] Clicking an element/card/image must not refresh or reload the whole view.
- [x] Clicking any slide element must not retrigger slide/element entrance animations.
- [x] Slide/element entrance animations trigger only when moving to another slide.

### Task J: Reference Modal Regression

**Files:**
- Modify: `src/components/SlideCanvas.tsx`
- Modify: `src/components/AppShell.tsx`
- Test: `tests/slideAnimation.test.ts`

- [x] Single-clicking a paragraph/text element opens the detail/reference modal again.
- [x] Image clicks keep image selection controls instead of opening the reference modal.
- [x] Chapter chip clicks still navigate sections.
- [x] Double-click remains harmless and does not conflict with single-click behavior.

### Task K: Source Data And Assets Injection

**Files:**
- Modify: `public/data/assets.json`
- Modify: `public/data/slides.json`
- Modify: `public/data/thesis.json`
- Modify: `src/data/assets.json`
- Modify: `src/data/slides.json`
- Modify: `src/data/thesis.json`
- Modify: `public/assets/**`

- [x] Inject `C:\skripsi\presentation\ppt-brief\public\data` into app `public/data`.
- [x] Mirror data into `src/data` for repo consistency.
- [x] Copy all source public assets into app `public/assets`.
- [x] Compare source and destination asset counts.
- [x] Validate all referenced asset paths exist after injection.
- [x] Run tests/build after data injection.
- [x] Treat current app `/data` copied from `C:\skripsi\presentation\ppt-brief\public\data` as the first data-backed dashboard project.
- [x] Copy `C:\skripsi\presentation\code-snapshot\public\data` into a project-specific app data folder.
- [x] Show exactly two data-backed projects in the dashboard: `ppt-brief` and `code-snapshot`.
- [x] Opening each project must load its own slides/thesis/assets payload.

### Task L: Validation, Audit, Iterate

**Files:**
- No committed QA artifacts.

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Start or confirm dev server at `http://127.0.0.1:5999`.
- [x] Use browser/Playwright screenshot evidence for fixed interaction flows.
- [x] Analyze screenshots for anomalies: re-triggered animations, layout jumps, clipped inspector, broken data assets, modal regressions, slide rail duplication, and non-mac-ish styling.
- [x] Fix any anomalies found, then rerun affected checks.

### Task M: Fullscreen And Non-Fullscreen Slide Style Parity

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/styles/slide-compat.css`
- Modify: `src/components/SlideCanvas.tsx`
- Optional Modify: source data only if slide HTML itself is inconsistent.

- [x] Capture non-fullscreen screenshots for the current Crossover/Rekombinasi slide after data injection.
- [x] Capture fullscreen screenshots for the current Crossover/Rekombinasi slide after data injection.
- [x] Compare spacing, typography, chip/pill backgrounds, gene/operator visual styling, card backgrounds, icon contrast, and footer placement between the two modes.
- [x] Fix the mismatch where slide gene/card visuals lose background and shadow in fullscreen/presenting mode.
- [x] Sweep additional slide style cause by removing the global presenting-mode `[data-edit-id]` background reset.
- [x] Re-run screenshots after fixes and document remaining intentional differences.

### Task N: Fullscreen Presentation Fit And Motion

**Files:**
- Modify: `src/components/SlideCanvas.tsx`
- Modify: `src/styles/app.css`
- Test: `tests/slideAnimation.test.ts`

- [x] Capture user-reported fullscreen anomaly where a dark bottom band reduces effective slide height.
- [x] Remove the hidden bottom slide-rail grid row from presenting mode so the canvas owns the full fullscreen viewport.
- [x] Ensure fullscreen slide scale uses the complete fullscreen canvas area.
- [x] Fix first next-slide transition in fullscreen so smooth entrance animation triggers immediately, without needing back/forward first.
- [x] Keep the prior rule: clicking existing slide elements must not retrigger animations.
- [x] Fix regression where clicking the slide after a transition retriggers entrance animation; entry animation class must be consumed and cleared after the slide transition.
- [x] Validate fullscreen next/prev with screenshot evidence and computed layout measurements.
