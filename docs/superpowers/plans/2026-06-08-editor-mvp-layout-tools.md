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
