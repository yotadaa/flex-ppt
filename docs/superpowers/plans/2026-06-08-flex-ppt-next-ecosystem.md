# Flex-PPT Next Ecosystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Flex-PPT Vite presenter into a Next.js application with Supabase email auth, a Canva-like macOS-inspired project dashboard, round-robin Supabase database persistence, dynamic slide containers, and OpenAI-compatible AI generation.

**Architecture:** The existing slide editor remains the core client editor. Next.js App Router provides the app shell, route handlers for AI/database operations, and future SSR-compatible auth boundaries. Supabase Auth handles email/password identity, while application data is persisted through server routes that choose among comma-separated database providers in round-robin order and record the selected provider in every table.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Supabase Auth, `@supabase/supabase-js`, `@supabase/ssr`, PostgreSQL/Supabase, `pg`, Vitest, Heroicons, existing CSS/tokens, existing `html2canvas` and `jspdf` PDF export.

---

## Required Context Already Read

- `docs/README.md`
- `docs/architecture-and-code-map.md`
- `docs/feature-backlog-and-design-decisions.md`
- `docs/migration-checklist.md`
- `docs/next-agent-playbook.md`
- `docs/session-knowledge-and-milestones.md`
- `docs/source-planning-2026-06-05-react-presenter-editor.md`
- `docs/validation-and-qa-playbook.md`
- `docs/claude-audit/claude-audit.md`
- `docs/claude-audit/claude-audit-2.md`

Excluded as requested: any `claude-edit` markdown.

## External Research Inputs

- Apple HIG Materials: materials create depth, layering, and hierarchy; avoid using glass inside content in a way that weakens hierarchy.
- Apple HIG Toolbars: toolbars are grouped horizontal controls for frequent commands, navigation, search, and orientation; avoid overcrowding.
- Apple HIG Sidebars: sidebars expose broad app hierarchy and need enough space; use compact alternatives when space is tight.
- Supabase Next.js quickstart: current Next integration uses App Router and Supabase environment variables.
- Supabase signUp docs: if Confirm email is disabled, signUp returns user and session; if enabled, session is null.
- Supabase auth helper migration docs: use `@supabase/ssr`, not deprecated auth-helper packages.
- Next.js App Router and Route Handler docs: API logic belongs in `app/api/**/route.ts`.
- Canva dashboard screenshots from the user: default authenticated surface should be projects, search, filters, recents, designs grid, left nav.

## File Structure

### Conversion and bootstrap

- Modify: `package.json`  
  Replace Vite scripts with Next scripts on port `5999`; keep extraction scripts.
- Modify: `package-lock.json`  
  Updated by npm install.
- Modify: `tsconfig.json`  
  Include `app`, `src`, `tests`, and Next-generated types.
- Create: `next.config.mjs`  
  Next build config.
- Create: `next-env.d.ts`  
  Next TypeScript ambient declarations.
- Create: `app/layout.tsx`  
  Global shell and global CSS imports.
- Create: `app/page.tsx`  
  Client app entry.
- Modify: `src/App.tsx`  
  Become authenticated workspace controller: auth screen, dashboard, editor.
- Modify: `src/utils/slideDom.ts`  
  Replace Vite `import.meta.env.BASE_URL` with Next-safe base URL.
- Modify: `src/hooks/useEditorState.ts`  
  Replace Vite dev flag with `process.env.NODE_ENV`.
- Keep: `index.html`, `vite.config.*`  
  Historical Vite files remain but scripts use Next.

### Auth and dashboard

- Create: `src/lib/env.ts`  
  Read browser-safe Supabase env and server-only LLM/database env.
- Create: `src/lib/supabaseClient.ts`  
  Browser Supabase client with graceful missing-env handling.
- Create: `src/components/auth/AuthScreen.tsx`  
  Email login/register UI.
- Create: `src/components/dashboard/ProjectDashboard.tsx`  
  Canva-like project dashboard with mac-ish chrome.
- Create: `src/components/dashboard/projectData.ts`  
  Seed/demo project data and project type helpers.
- Modify: `src/styles/app.css`  
  Auth/dashboard/editor macOS visual additions.
- Modify: `.env.example`  
  Add Supabase public keys, LLM model, and comma-separated DB examples.

### Database provider and APIs

- Create: `src/server/providerRotation.ts`  
  Parse comma-separated URLs, randomize starting index, choose write provider round-robin.
- Create: `src/server/database.ts`  
  Create provider-aware `pg` pools and helper query functions.
- Create: `src/server/auth.ts`  
  Validate Supabase access token for server route handlers.
- Create: `src/server/projectsRepository.ts`  
  Project CRUD helpers and fallback behavior.
- Create: `app/api/projects/route.ts`  
  GET and POST projects.
- Create: `app/api/projects/[id]/route.ts`  
  GET, PATCH, DELETE one project.
- Create: `supabase/migrations/20260608000000_initial_flex_ppt_ecosystem.sql`  
  Tables with `provider` column and RLS policies.

### Dynamic containers and AI

- Modify: `src/types.ts`  
  Add `SlideContainer`, `SlideContainerKind`, and container fields in editor state.
- Create: `src/utils/containers.ts`  
  Sanitization, creation, duplication, and render helpers.
- Modify: `src/hooks/useEditorState.ts`  
  Add container state, history, persistence, CRUD operations.
- Modify: `src/components/SlideCanvas.tsx`  
  Render, select, move, resize, and edit containers.
- Modify: `src/components/LayerPanel.tsx`  
  Show containers as managed layers.
- Modify: `src/components/Inspector.tsx`  
  Add container editor section and AI controls.
- Create: `src/components/containers/ContainerPanel.tsx`  
  Add/edit HTML, SVG, image URL, and AI prompt UI.
- Create: `app/api/ai/containers/route.ts`  
  OpenAI-compatible server route for HTML/SVG generation.

### Tests and validation

- Create: `tests/providerRotation.test.ts`
- Create: `tests/containers.test.ts`
- Create: `tests/dashboardData.test.ts`
- Modify: `package.json`  
  Add `test` script with Vitest.
- Generate: `qa/next-ecosystem-audit.json`
- Generate: `qa/screenshots/next-dashboard-5999.png`
- Generate: `qa/screenshots/next-editor-containers-5999.png`

## Task 1: Planning, Research, And Secret Hygiene

**Files:**
- Modify: `.gitignore`
- Create: `docs/design/macos-canva-reference-research.md`
- Create: `docs/superpowers/plans/2026-06-08-flex-ppt-next-ecosystem.md`
- Track: `.env.example`

- [ ] Add `.env`, `.env.local`, and `.env.*.local` to `.gitignore`.
- [ ] Save macOS/Canva research with source links and implementation decisions.
- [ ] Save this blueprint plan.
- [ ] Validate `git status --short` shows `.env` ignored and docs tracked.
- [ ] Commit: `docs: plan next ecosystem implementation`

## Task 2: Next.js Conversion

**Files:**
- Modify: `package.json`, `package-lock.json`, `tsconfig.json`, `src/App.tsx`, `src/utils/slideDom.ts`, `src/hooks/useEditorState.ts`
- Create: `next.config.mjs`, `next-env.d.ts`, `app/layout.tsx`, `app/page.tsx`

- [ ] Install Next/Supabase/database/test packages.
- [ ] Replace scripts with `next dev -H 127.0.0.1 -p 5999`, `next build`, and `next start -H 127.0.0.1 -p 5999`.
- [ ] Add App Router layout and page entry.
- [ ] Import global CSS in `app/layout.tsx`.
- [ ] Patch Vite-only env usage.
- [ ] Run `npm run build`.
- [ ] Commit: `build: convert presenter to next app router`

## Task 3: Supabase Auth And Dashboard

**Files:**
- Create: `src/lib/env.ts`, `src/lib/supabaseClient.ts`, `src/components/auth/AuthScreen.tsx`, `src/components/dashboard/ProjectDashboard.tsx`, `src/components/dashboard/projectData.ts`
- Modify: `src/App.tsx`, `src/styles/app.css`, `.env.example`
- Test: `tests/dashboardData.test.ts`

- [ ] Write failing dashboard seed/filter test.
- [ ] Implement project seed/filter helpers.
- [ ] Add Supabase email/password auth screen with login/register toggle.
- [ ] Show missing-config demo mode instead of crashing when Supabase public env is absent.
- [ ] Add Canva-like project dashboard after auth/demo session.
- [ ] Opening a project loads the existing editor.
- [ ] Run `npm test -- tests/dashboardData.test.ts`.
- [ ] Run `npm run build`.
- [ ] Commit: `feat: add auth gate and project dashboard`

## Task 4: Round-Robin Supabase Database Providers

**Files:**
- Create: `src/server/providerRotation.ts`, `src/server/database.ts`, `src/server/auth.ts`, `src/server/projectsRepository.ts`
- Create: `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`
- Create: `supabase/migrations/20260608000000_initial_flex_ppt_ecosystem.sql`
- Test: `tests/providerRotation.test.ts`

- [ ] Write failing provider parsing and round-robin tests.
- [ ] Implement comma-separated URL parsing with provider names.
- [ ] Randomize initial cursor and advance for each write.
- [ ] Create SQL schema with provider column on every table.
- [ ] Add RLS policies scoped by `user_id`.
- [ ] Add project API routes with token validation.
- [ ] Dashboard tries API persistence and falls back to local demo state when DB/auth env is missing.
- [ ] Run `npm test -- tests/providerRotation.test.ts`.
- [ ] Run `npm run build`.
- [ ] Commit: `feat: add provider-aware project persistence`

## Task 5: Dynamic Slide Containers And AI

**Files:**
- Modify: `src/types.ts`, `src/hooks/useEditorState.ts`, `src/components/SlideCanvas.tsx`, `src/components/LayerPanel.tsx`, `src/components/Inspector.tsx`, `src/styles/app.css`
- Create: `src/utils/containers.ts`, `src/components/containers/ContainerPanel.tsx`, `app/api/ai/containers/route.ts`
- Test: `tests/containers.test.ts`

- [ ] Write failing container sanitization and creation tests.
- [ ] Add container type and persisted editor state.
- [ ] Add blank HTML, SVG, and image containers.
- [ ] Render containers on slide canvas with move/resize/select controls.
- [ ] Add container rows to Layers.
- [ ] Add container panel for editing raw HTML/SVG/image URL.
- [ ] Add AI route using `llm_endpoint`, `llm_api_key`, and `llm_model`.
- [ ] Add deterministic fallback when LLM env is absent.
- [ ] Run `npm test -- tests/containers.test.ts`.
- [ ] Run `npm run build`.
- [ ] Commit: `feat: add dynamic slide containers`

## Task 6: Audit, Validate, Iterate

**Files:**
- Generate: `qa/next-ecosystem-audit.json`
- Generate: `qa/screenshots/next-dashboard-5999.png`
- Generate: `qa/screenshots/next-editor-containers-5999.png`

- [ ] Start dev server at `http://127.0.0.1:5999`.
- [ ] Use Browser plugin first; use Playwright only if Browser is unavailable.
- [ ] Validate auth/demo screen, dashboard, project open, slide render, search, existing layers, and new containers.
- [ ] Capture dashboard and editor screenshots.
- [ ] Audit for clipping, blank render, console errors, broken assets, auth crashes, and overlapping text.
- [ ] Patch discovered issues.
- [ ] Re-run tests and build.
- [ ] Commit: `test: validate next ecosystem workflow`

## Task 7: Push Main

**Files:**
- Git remote and branch only.

- [ ] Confirm `.env` is not tracked.
- [ ] Confirm all task commits exist.
- [ ] Run final `npm test` and `npm run build`.
- [ ] Configure remote:

```powershell
git remote add origin git@github.com:yotadaa/flex-ppt.git
git branch -M main
git push -u origin main
```

- [ ] If `origin` already exists, set it to `git@github.com:yotadaa/flex-ppt.git`.
- [ ] Emit final git push directive after successful push.

## Acceptance Criteria

- App runs as Next.js on port `5999`.
- Existing slide editor loads 45 slides and preserves current search/layer/export behavior.
- Email login/register exists and uses Supabase only.
- The no-confirmation path is supported when Supabase email confirmation is disabled.
- Authenticated or demo-mode users land on a Canva-like macOS-inspired dashboard.
- Project dashboard can open the editor.
- Comma-separated database URLs are parsed into providers and writes choose providers round-robin after a randomized start.
- Every SQL table contains `provider`.
- Dynamic containers can be created, edited, moved, resized, layered, hidden, duplicated, and rendered.
- AI container generation uses the OpenAI-compatible endpoint server-side.
- Missing env values do not crash local development.
- `npm test` passes.
- `npm run build` passes.
- Browser/Playwright validation confirms dashboard and editor render at `http://127.0.0.1:5999`.
- Work is committed per completed task and pushed to `origin/main`.

