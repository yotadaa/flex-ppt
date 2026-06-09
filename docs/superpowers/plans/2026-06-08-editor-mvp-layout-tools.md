# Editor MVP Layout and Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the current Flex-PPT editor MVP into a Canva-layout-inspired, Figma-tool-inspired slide editor without copying Canva's color scheme, then audit it against a mac-oriented design checklist.

**Architecture:** Keep the existing Next.js/React app and slide renderer. Add a project-aware editor state key, a small design object model for shapes/comments/components, and reorganize the shell CSS into top toolbar, central canvas, right sidebar, and bottom slide strip. The mac-ish design system uses SF/system typography, neutral translucent surfaces, grouped toolbars, dense inspectors, and a teal/graphite accent direction rather than Canva purple.

**Tech Stack:** Next.js App Router, React, TypeScript, Heroicons, Vitest, localStorage persistence.

---

### Task 0: Mac-Oriented Research and Design Gate

**Files:**
- Modify: `docs/design/macos-canva-reference-research.md`
- Modify: `src/styles/app.css`

- [x] Confirm typography direction from Apple HIG: use SF/system font stack through `system-ui`, `-apple-system`, and `BlinkMacSystemFont`.
- [x] Confirm toolbar direction from Apple HIG/Figma references: group common actions horizontally, keep icons compact, and avoid overcrowding.
- [x] Confirm sidebar/properties direction: right inspector uses dense sections for position, layout, appearance, fill, stroke, and export/component actions.
- [ ] Apply neutral translucent macOS-like surfaces, restrained shadows, subtle borders, and non-Canva accent colors.
- [ ] Audit final screenshots for mac-oriented feel before commit.

### Task 1: Project Isolation

**Files:**
- Create: `src/utils/projectSlides.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/hooks/useEditorState.ts`
- Test: `tests/projectSlides.test.ts`

- [x] Create blank slide data for newly created local projects.
- [ ] Pass `projectId`, `projectTitle`, `userEmail`, and dashboard return callback into `AppShell`.
- [x] Scope editor localStorage by `projectId`.
- [ ] Verify new project opens an untitled blank slide instead of the seeded thesis deck.

### Task 2: Editor Tool Model

**Files:**
- Create: `src/utils/editorTools.ts`
- Modify: `src/types.ts`
- Modify: `src/hooks/useEditorState.ts`
- Test: `tests/editorTools.test.ts`

- [x] Add tool ids for Move, Hand, Scale, Rectangle, Line, Arrow, Ellipse, Polygon, Star, Image/Video, Element, Pen, Pencil, Text, Comment, Component.
- [x] Add factories for design shapes and comments.
- [x] Add state actions to add/update/delete/duplicate shapes and comments.
- [x] Add component creation state for selected shape/container.

### Task 3: Editor Layout

**Files:**
- Create: `src/components/EditorToolbelt.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/SlideRail.tsx`
- Modify: `src/components/Inspector.tsx`
- Modify: `src/styles/app.css`

- [x] Add Figma-like editorial toolbar at the top using Heroicons.
- [ ] Move slide list to the bottom strip.
- [ ] Remove duplicated slide numbering in the bottom strip and keep the strip visually thin.
- [ ] Put Assets, Draft, Layers, Containers, References into a right sidebar tab rail on the left edge of the right sidebar.
- [ ] Render References as a compact list view rather than wide preview cards.
- [ ] Fix click handling so selecting a slide card/image does not refresh, jump, or reload the slide.
- [ ] Preserve current editor functionality while changing layout.

### Task 4: Canvas Objects

**Files:**
- Modify: `src/components/SlideCanvas.tsx`
- Create: `src/components/ElementPropertiesPanel.tsx`
- Modify: `src/components/ContainerPanel.tsx`
- Modify: `src/utils/containers.ts`

- [ ] Render shapes, text, pen/pencil marks, and comments as selectable layers.
- [ ] Add right sidebar properties for position, dimensions, rotation, fill, stroke, opacity, corner radius, and component creation.
- [x] Extend HTML elements with HTML/CSS/JS data fields.
- [ ] Render HTML elements in a sandboxed iframe.

### Task 5: Validate, Audit, Iterate

**Files:**
- Modify docs only if validation observations need recording.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run browser smoke test on `localhost:5999`.
- [ ] Inspect screenshots for layout, overlap, toolbar/sidebar/slide-strip placement, new project behavior, and mac-oriented design feel.
- [ ] Iterate on any visual drift: font, spacing, color temperature, toolbar density, right sidebar density, and dashboard color scheme.
- [ ] Commit and push.

### Task 6: Slide Creation And Empty Starts

**Files:**
- Modify: `src/utils/projectSlides.ts`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/SlideRail.tsx`
- Modify: `src/hooks/useEditorState.ts`
- Test: `tests/projectSlides.test.ts`

- [ ] New blank projects must open with an empty slide canvas: no seeded heading, no body copy, and no editable HTML text nodes.
- [ ] Add a reusable `createBlankSlide(index, title, chapter)` helper that returns empty slide HTML and zero images/citations.
- [ ] Persist the editable slide list per project so user-added slides survive refresh in local auth mode.
- [ ] Wire the bottom slide rail plus button to append a new empty slide and immediately navigate to it.
- [ ] Keep slide count, top toolbar count, search, printable deck, command palette, and inspector references in sync with the local slide list.
- [ ] Add tests proving blank slides contain no seeded `data-edit-id` text elements.

### Task 7: Edge Resize And Text-As-Layer Controls

**Files:**
- Modify: `src/types.ts`
- Modify: `src/utils/editorTools.ts`
- Modify: `src/hooks/useEditorState.ts`
- Modify: `src/components/SlideCanvas.tsx`
- Modify: `src/components/LayerPanel.tsx`
- Modify: `src/components/ElementPropertiesPanel.tsx`
- Modify: `src/styles/app.css`
- Test: `tests/editorTools.test.ts`

- [ ] Add height support for imported image layers and managed base images, while keeping old saved local state compatible.
- [ ] Replace the single oversized resize button with eight edge/corner handles on selected images, HTML containers, managed cards, and editorial shapes.
- [ ] Remove the large floating scale button from selected image/card layers because edge handles now control width, height, and corner scaling.
- [ ] Dragging side handles adjusts width or height independently; dragging corner handles adjusts both dimensions.
- [ ] Keep undo history clean by recording one transaction per resize drag, not one history entry per pointer move.
- [ ] Add layer-style text controls for added text objects: role preset (`body`, `heading`, `subheading`), font size, font weight, text color, dimensions, position, visibility, lock, duplicate, and delete.
- [ ] Right-clicking an editorial text layer should select it for the same inspector/layer controls instead of opening the browser context menu.

### Task 8: Feature Screenshot Audit

**Files:**
- No committed QA/screenshots. Save temporary screenshots outside the repo.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Start/confirm dev server on `localhost:5999`.
- [ ] Screenshot the empty new-slide state and verify there are no default heading/body elements.
- [ ] Screenshot an added slide in the bottom rail and verify the slide count increments without duplicated redundant numbering.
- [ ] Screenshot selected text/image/shape resize handles and verify mac-oriented spacing, neutral colors, and no overlaps.
- [ ] Analyze screenshots for anomalies: clipped controls, duplicated labels, stale selected states, layout overflow, unreadable text, right sidebar drift, and Canva-purple color drift.
- [ ] Iterate on any found anomaly, rerun the affected checks, then commit and push.

### Task 9: Dashboard Database And Navigation

**Files:**
- Modify: `src/server/auth.ts`
- Modify: `app/api/projects/route.ts`
- Modify: `app/api/projects/[id]/route.ts`
- Modify: `src/components/dashboard/ProjectDashboard.tsx`
- Modify: `src/components/dashboard/projectData.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`

- [ ] Check `.env.example` and local env presence for `DATABASE_URL`, `DIRECT_URL`, and public Supabase keys without exposing secret values.
- [ ] Support local-auth project API writes through `DATABASE_URL` by deriving a stable local UUID from the signed-in email when no Supabase Auth bearer token is available.
- [ ] Keep the Supabase/RLS plan aligned with official guidance: RLS remains in migrations, while server-side direct database routes use database credentials and do not expose service credentials to the browser.
- [ ] When creating a new project, POST it to `/api/projects`; if DB is unavailable, keep local fallback and surface DB status in the dashboard.
- [ ] Treat database-created draft projects as blank editor projects, even when their persisted UUID no longer starts with `local-project-`.
- [ ] Remove the Templates menu item.
- [ ] Make Projects, AI, and Trash dashboard nav items clickable and stateful.
- [ ] Add dashboard Settings with account, behavior, design, and data configuration controls.
- [ ] Add Trash actions for move-to-trash, restore, and permanent delete in local UI state.
- [ ] Validate dashboard navigation and project creation with browser screenshots.
