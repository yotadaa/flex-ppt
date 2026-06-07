# Feature Backlog And Design Decisions

This document captures the design direction and future feature backlog from the previous session.

## Design direction

The app should feel formal, academic, and mac-like. The phrase "mac-like" means:

- clear hierarchy,
- calm grouped sidebars,
- toolbar controls grouped by task,
- material/glass surfaces used for structure,
- readable panels with enough opacity,
- traffic-light modal chrome when appropriate,
- thin progress feedback,
- Spotlight-like command palette,
- settings modal inspired by System Settings,
- motion that orients the user instead of distracting.

It does not mean:

- overusing blur,
- making everything translucent,
- sacrificing contrast,
- adding decorative noise,
- turning academic slides into a flashy app demo.

## Implemented design decisions

- Wrapper top bar is thinner.
- Sidebar is grouped and glass-like.
- Command palette was redesigned to avoid broken wrapping.
- Settings modal uses a mac-like sidebar.
- Inspector tabs use segmented/pill controls.
- Progress bar is thin.
- Modals and popups have smoother opening animation.
- Fullscreen has transition animation.
- Slide content typography was increased.
- Slide card hierarchy was repaired across several slides.
- Isometric generated images were added sparingly.

## Implemented editing decisions

- All already placed images are represented in layer controls.
- Cards/callouts with `data-edit-id` are also represented as managed layers.
- Images and cards can be moved and resized.
- Tooltips are in-slide controls, not only in the right sidebar.
- Drag from asset panel into slide creates a layer.
- Tooltip opacity decreases while moving/resizing so the user can see behind it.
- Alignment guide lines and distance labels appear during drag.
- Fullscreen locks all edit interactions.

## Feature backlog

### 1. Slide Health panel

Purpose:

- Bring QA artifacts into the app.
- Let the user see problem slides and jump to them.
- Show status like clipped elements, tiny text, console errors, missing reference preview.

Suggested UI:

- Right inspector tab `Health`.
- Summary cards: total slides, issue slides, console logs, export ratio.
- List grouped by severity.
- Click an issue to jump to slide and optionally highlight element.

### 2. Reference Confidence badge

Purpose:

- The user repeatedly asked whether cited references match the right page and paragraph.
- The app should show confidence per reference screenshot.

Suggested UI:

- In paragraph modal, each reference card shows:
  - PDF valid,
  - page selected,
  - keyword matches,
  - article URL available,
  - local PDF available.
- Use labels like `High`, `Medium`, `Needs review`.

### 3. Clean Preview mode

Purpose:

- Fullscreen is for presentation and locks editing.
- Clean Preview should hide sidebars and toolbar but remain in browser window.

Suggested behavior:

- Toggle from toolbar or shortcut.
- Hide left/right rails.
- Keep slide centered.
- Preserve click navigation.
- Do not show edit controls unless explicitly toggled back to edit mode.

### 4. Keyboard hints/help sheet

Purpose:

- Layer editing now has many operations.
- The user needs discoverability.

Suggested content:

- `Ctrl+K` command palette.
- `F` or `Shift+F` fullscreen.
- `Ctrl+Z` undo.
- `Ctrl+Y` redo.
- Drag object to move.
- Drag corner to resize.
- Right-click paragraph to configure text.
- Delete/Hide selected layer.

### 5. Multi-select layer editing

Purpose:

- When image collides with several callout cards, moving cards one-by-one is slow.

Suggested behavior:

- Shift-click selects multiple layers.
- Group movement with alignment guides.
- Optional distribute spacing command.

### 6. Snap-to-grid and distribute controls

Purpose:

- Alignment guides help while dragging, but sometimes precise consistent spacing is easier with commands.

Suggested controls:

- Align left, center, right.
- Align top, middle, bottom.
- Distribute horizontal spacing.
- Distribute vertical spacing.
- Toggle grid or snap strength.

### 7. Theme preset export/import

Purpose:

- Theme, accent, and font now affect slide and PDF export.
- It would be useful to save presets for academic, mint, dark, warm, or high contrast modes.

## Content backlog

- Revisit all reference modal page screenshots and confidence labels.
- Improve slides that still rely heavily on dark GUI screenshots if future assets are available.
- Consider adding one slide health summary after export.
- Keep deck at 45 slides unless user explicitly requests more.
- Maintain no more than two citations per slide paragraph where possible.

## Design audit lessons from Claude docs

From `claude-audit.md`:

- Avoid text overload.
- Strengthen visual hierarchy.
- Keep divider slides consistent.
- Make screenshot GUI larger and framed.
- Make results slides more data-driven.

From `claude-audit-2.md`:

- Use macOS-like grouped sections.
- Use Spotlight-like command palette.
- Use System Settings-like modal.
- Use segmented inspector control.
- Use progress bar and calm sidebar.
- Use glass material carefully.

## Non-goals for now

- Rewriting the entire slide deck from scratch.
- Moving to a different framework.
- Adding a backend.
- Re-downloading all PDFs.
- Using CDN fonts.
- Reintroducing static screenshot-only slides.
