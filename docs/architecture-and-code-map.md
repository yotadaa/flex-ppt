# Architecture And Code Map

This document maps the React presenter/editor architecture as of the Flex-PPT migration.

## Technology stack

- Framework: React 18 with Vite.
- Language: TypeScript for source files, with Vite config also available as JS/TS.
- Styling: CSS modules are not used; global CSS lives in `src/styles`.
- Icons: Heroicons are used for semantic icons.
- PDF export: `html2canvas` plus `jspdf`.
- Local rendering validation: `playwright-core` can drive installed Chrome.
- Fonts: local Google font files are bundled under `src/assets/fonts/google`.

## Important npm scripts

```powershell
npm run dev
npm run build
npm run preview
npm run extract:thesis
npm run extract:presenter
```

The app normally runs at:

```text
http://127.0.0.1:5173/presentation/
```

## High-level app concept

The app has three layers:

1. Slide data and assets.
2. Slide rendering and editing canvas.
3. Wrapper UI for navigation, inspector, settings, command palette, search, import/export, and fullscreen.

The slide is not a static image. Many visible objects are managed by editor state:

- placed/generated images,
- base images embedded in slide HTML,
- cards/callouts with `data-edit-id`,
- text style overrides for selected paragraphs,
- layer position, size, visibility, lock, and z depth.

## Source structure

Key directories:

- `src/components` - React UI components.
- `src/data` - slide data, asset registry, references, draft excerpts, and initial state data.
- `src/styles` - app wrapper styling, slide compatibility styling, local fonts, and print/PDF styling.
- `src/assets/fonts/google` - local font files, no CDN dependency.
- `public/assets` - slide images, generated images, GUI screenshots, reference screenshots, reference PDFs, logo, and support assets.
- `scripts` - extraction scripts for thesis and presenter data.

## Core components

The exact file names may evolve, but the following conceptual components exist and matter:

### SlideCanvas

Responsibilities:

- Render the active slide inside a 16:9 canvas.
- Apply scale transforms for wrapper layout.
- Render managed base image layers and overlay image layers.
- Render managed base element/card layers.
- Handle pointer drag, resize, lock, hide, duplicate, front/back, behind-text behavior.
- Show image/card tooltip controls in-slide.
- Clamp tooltip placement so it stays inside the canvas panel.
- Make tooltip semi-transparent during drag/resize.
- Show alignment guides and distance hints while dragging.
- Clear guide overlays after pointer up.
- Disable edit interactions during fullscreen/presentation mode.

Important behavior from H8:

- Alignment guide lines compare the moving layer's left, center, right, top, middle, and bottom against other image/card layers.
- Distance hints appear between nearby cards/images to help unify spacing, similar to Canva/Figma.
- Card layers are extracted from DOM nodes with `data-edit-id`.
- Image base layers and card base layers are both visible in the Layers panel.

### LayerPanel

Responsibilities:

- Show managed image layers and managed card/base-element layers.
- Provide numeric X, Y, W, H, and Z controls.
- Provide hide, lock, front, back, duplicate, and delete/hide actions.
- Use shared UI primitives. Do not add raw visible `button`, `input`, or `select` controls here.

### Toolbar and settings modal

Responsibilities:

- Slide navigation.
- Search text inside slide deck.
- Command palette opening.
- Undo/redo.
- Fullscreen.
- Settings modal.
- Direct PDF export.

Important behavior:

- Settings modal uses custom select/dropdown components.
- Dropdowns should escape parent clipping and stay above modal/panel bounds.
- Number controls should not show native browser spinner arrows.
- PDF export must be direct download, not browser print dialog.
- Exported PDF must keep 16:9 ratio and apply active theme, accent, and font.

### Command palette

Responsibilities:

- Spotlight-like quick command access.
- Search slide, draft, asset, or command.
- Avoid broken wrapping. Use ellipsis and clear grouping.
- Footer keyboard hints should remain readable.

### Inspector panel

Tabs or segmented controls:

- Draft.
- Assets.
- Layers.
- Refs.

Important behavior:

- Reference PDF page screenshots must be excluded from the asset insertion panel.
- Assets panel should focus on insertable visual assets.
- Drag-and-drop from assets into the slide canvas is supported.

### Reference modal

Responsibilities:

- Clicking paragraph/item opens context modal.
- Modal can show:
  - slide paragraph/item text,
  - context from draft,
  - relevant APA citations,
  - page screenshots from referenced PDF,
  - related table/image if available.
- Button `Lihat di draft` should reveal the relevant draft page/paragraph, not dump the whole document.
- Clicking a reference screenshot should open the reference article/source in a new tab.

Important citation/content constraints:

- Maximum two citations per paragraph on the slide.
- APA style in slide text.
- Citation chips are highlighted.
- Do not cite `Data penelitian FST, 2025` or `Hasil pengujian sistem, 2025`.

## Data model concepts

Expected editor state includes:

- `currentSlide`
- `theme`
- `accent`
- `fontFamily`
- slide overrides:
  - image layers,
  - base image overrides,
  - base element/card overrides,
  - text style overrides,
  - hidden layer state,
  - z/depth values.
- undo/redo history stack.

Layer IDs:

- Base images use IDs derived from slide number and original image.
- Base element/card layers use IDs like `base-element-39-s39-e7`.
- Overlay images use generated layer IDs.

Coordinate system:

- Layer x/y/w/h values are percentage-based relative to the slide frame.
- Rendering converts percentages to pixel positions inside the scaled slide.
- Alignment guides compute in pixel space from the rendered frame, then display overlay lines in the same canvas context.

## Styling map

Important CSS files:

- `src/styles/app.css` - wrapper UI, toolbar, sidebars, settings, command palette, layer tooltip, alignment guides.
- `src/styles/slide-compat.css` - compatibility and typography rules for slide HTML.
- `src/styles/fonts.css` or equivalent - local font face declarations.

Important style requirements:

- Content font inside slides is slightly larger than the original HTML deck.
- Card title/subtitle should be beside icon, not below, for agenda/process/controller cards.
- Generated/isometric images should remain transparent with no colored backplate.
- Wrapper top bar should be thin and formal.
- mac-like wrapper design should use hierarchy and grouped surfaces, not only blur.
- Fullscreen mode should preserve transition language but lock editing.

## Asset map

Important assets in `public/assets`:

- `logo-unja.png`
- `chromosome_generation_flowchart.png`
- `gui-data-crop.jpg`
- `gui-fitness-crop.jpg`
- `gui-schedule-crop.jpg`
- `isometric-chromosome.png`
- `isometric-dashboard.png`
- `isometric-fuzzy-controller.png`
- `isometric-scheduling.png`
- `generated-concept/conflict-theory-practicum.png`
- `generated-concept/fitness-penalty-evaluator.png`
- `generated-concept/fuzzy-diversity-stagnation-controller.png`
- `generated-concept/greedy-repair-postprocessing.png`
- `generated-concept/integrated-scheduling-pipeline.png`
- `reference-pdf-pages/*`
- `reference-pdfs/*`

Reference screenshots and PDFs are important for citation modal, but screenshots from `reference-pdf-pages` should not be listed as user-insertable slide assets.

## Slides requiring special care

- Slide 2: agenda cards. Card subtitle must be next to icon and larger than body.
- Slide 11: GA cards. Same card hierarchy rule as slide 2.
- Slide 20: fuzzy logic membership chart/card layout.
- Slide 23: kerangka pemikiran flowchart. Arrows must be clear.
- Slide 27: pipeline system flowchart. Two-row direction must be obvious.
- Slide 28: repair/post-processing. Cards follow icon-title hierarchy.
- Slide 30: initial population flowchart. Arrows and flow labels need high readability.
- Slide 34: fuzzy controller card hierarchy and generated image movement.
- Slide 36, 39, 41: GUI screenshots and callout cards. Fonts must remain readable, screenshot frame/container must sync with layer metadata.
- Slide 39 and 41: GUI image container/frame must move and resize with the image layer.

## Known validation commands

```powershell
npm run build
```

Optional local browser validation with `playwright-core`:

```javascript
const { chromium } = require("playwright-core");
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe"
});
```

Use this only after `npm ci` has installed dependencies in the new workspace.
