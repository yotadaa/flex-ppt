# Next Agent Playbook

This is the practical guide for the next agent working in `C:\skripsi\flex-ppt`.

## Start here

1. Work from:

```powershell
cd C:\skripsi\flex-ppt
```

2. Install dependencies:

```powershell
npm ci
```

3. Run build:

```powershell
npm run build
```

4. Run dev:

```powershell
npm run dev
```

5. Open:

```text
http://127.0.0.1:5173/presentation/
```

## Required working style

- Keep tasklist updated before implementation.
- Work one task at a time.
- Validate each completed task immediately.
- Commit after each validated task item if the user repeats the per-task commit rule.
- Do not revert user changes.
- Do not hardcode one-off visible controls.
- Use reusable UI primitives.
- Use Browser plugin first when available; if unavailable, record fallback and use `playwright-core`.
- Use `npm run build` before completion claims.

## Editing rules from prior session

- Use `apply_patch` for manual edits.
- Do not create/edit files with shell write tricks when a patch is enough.
- Do not use ASCII characters as icons. Use Heroicons or SVG components.
- Hide native number input spinner arrows.
- Custom dropdown menus must not be clipped by parent containers.
- Generated image assets should be transparent, not placed on colored wrappers.
- Reference screenshots should not appear in the insertable assets panel.
- Fullscreen is presentation mode, not editing mode.

## Most important UX features already implemented

- Smooth slide transitions and element-level animation.
- Navbar/chapter highlight animation.
- Slide text search.
- Settings modal for theme, color, font, and direct PDF export.
- Local Google fonts.
- Direct PDF export using active theme/font/accent.
- Fullscreen shortcut and fullscreen transition.
- Managed image layers.
- Managed card/callout layers.
- Drag-and-drop from assets into slide.
- Image/card tooltips inside slide.
- Resize handle for images and cards.
- Delete/hide for images and cards.
- Undo/redo for image and card movement/resize.
- Depth controls including behind text.
- Alignment guides and spacing hints while dragging.
- Paragraph right-click style configuration.

## High-risk areas

### Slide layer coordinate sync

Slides 34, 39, and 41 previously had bugs where metadata changed but visual object did not move. This has been fixed. When touching layer code, revalidate:

- slide 34 generated image,
- slide 39 GUI screenshot and mockup frame,
- slide 41 GUI screenshot and mockup frame.

### Tooltip placement

Tooltip used to:

- stay behind after dragging,
- cross into left rail,
- block resize handle.

It should now:

- follow moved layer,
- stay in canvas panel,
- anchor above selected layer,
- be semi-transparent while dragging/resizing,
- never block resize handle.

### Fullscreen lock

Fullscreen mode should:

- show presentation UI,
- keep smooth transitions,
- prevent editing,
- hide edit tooltips,
- prevent drag/resize/delete/style tooltips.

### Flowcharts

Slides 23, 27, and 30 are sensitive. Arrows must clearly show direction. The user repeatedly disliked ambiguous flowcharts.

### Card hierarchy

For card layouts, icon and subtitle/title must be in the same row. Subtitle/title must be larger than subcontent. Known affected slides:

- 2,
- 11,
- 21,
- 26,
- 28,
- 34.

### GUI screenshots

Slides 36, 39, and 41 must have readable supporting text and a polished screenshot frame. Screenshot and its container must resize/move together.

## User preference notes

- The user strongly prefers iterative validation with screenshots.
- The user wants all problems mapped to tasklist so nothing is forgotten.
- The user expects detailed audit, not vibes.
- The user wants mac-like wrapper design, but not at the cost of academic readability.
- The user dislikes repeated generic icons and prefers semantically meaningful visuals.
- The user wants generated isometric transparent images used sparingly.
- The user wants paragraph citations and modal references to be contextually correct.

## When creating a new feature

Use this checklist:

1. Add task item to planning or docs.
2. Identify reusable component or create one if needed.
3. Implement smallest useful slice.
4. Run `npm run build`.
5. Validate in browser.
6. Save QA artifact if visual or interaction-sensitive.
7. Commit.
8. Run final audit loop if the feature affects slide layout or wrapper UI.

## Useful future features suggested by previous audit

- Slide Health panel: show latest slide audit JSON inside app and jump to problem slides.
- Reference Confidence badge: show confidence level for citation/page screenshot match in paragraph modal.
- Clean Preview mode: hide editor rails without entering fullscreen.
- Keyboard hints/help sheet: shortcuts for resize, delete, undo, redo, fullscreen, search, command palette.
- More robust multi-select layer movement.
- Snap-to-grid toggle in addition to alignment guides.
- Export/import theme presets.

## Do not lose these content decisions

- Fuzzy is adaptive controller, not absolute winner.
- Classic GA wins most final metrics.
- Fuzzy helps reduce stagnation and adapt Cr/Mr.
- Crossover fuzzy uses diversity and stagnation.
- Mutation fuzzy uses fitness score movement from previous iteration.
- Conflict with theory/face-to-face class schedule is penalty medium to high.
- Greedy repair/post-processing fixes residual conflicts after evolution.
