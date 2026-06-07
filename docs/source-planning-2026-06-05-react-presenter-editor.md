# React Presenter Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun ulang presenter web skripsi sebagai aplikasi React + Vite yang lebih ringan, interaktif, dan dapat mengedit teks/gambar slide dari data draft skripsi.

**Architecture:** Aplikasi baru dibuat di workspace terpisah dan tidak mengganti presenter HTML lama. Data slide, referensi, aset, dan draft DOCX diekstrak menjadi JSON statis agar React dapat melakukan rendering cepat, pencarian, preview draft, replace text, asset insertion, layer editing, dan theme switching secara client-side. State editor disimpan di localStorage agar revisi sementara tidak hilang.

**Tech Stack:** React 18, Vite, TypeScript, CSS custom properties, Python DOCX/OOXML extraction, local JSON data, Playwright/Chrome validation.

---

## File Structure

- `package.json`  
  Script Vite (`dev`, `build`, `preview`) dan dependency React.
- `index.html`  
  Entry HTML ringan dengan favicon data URI.
- `vite.config.ts`  
  Konfigurasi Vite dan alias `@` ke `src`.
- `tsconfig.json`, `tsconfig.node.json`  
  Konfigurasi TypeScript untuk app dan tooling.
- `scripts/extract_thesis.py`  
  Membaca `Draft Skripsi F1E122037 Fix.docx`, mengekstrak paragraf, heading, tabel, section hint, dan searchable text.
- `scripts/extract_presenter_data.js`  
  Membaca presenter web lama, mengekstrak slide HTML, metadata slide, reference map, dan asset manifest.
- `src/data/thesis.json`  
  Hasil ekstraksi lengkap draft skripsi.
- `src/data/slides.json`  
  Hasil migrasi slide dan referensi dari presenter lama.
- `src/data/assets.json`  
  Manifest semua aset gambar yang dapat dipakai ulang di slide.
- `src/types.ts`  
  Tipe data slide, block draft, asset, layer, modal, editor state.
- `src/main.tsx`  
  Bootstrap React.
- `src/App.tsx`  
  Komposisi shell utama.
- `src/components/AppShell.tsx`  
  Layout toolbar, slide rail, canvas, dan inspector.
- `src/components/Toolbar.tsx`  
  Navigasi slide, theme switcher, undo/redo, save/export.
- `src/components/SlideRail.tsx`  
  Thumbnail daftar slide dengan virtual-friendly rendering sederhana.
- `src/components/SlideCanvas.tsx`  
  Render slide aktif dari HTML, menangkap klik paragraph/card/image, dan overlay layer editor.
- `src/components/DetailModal.tsx`  
  Modal clicked paragraph: konteks, referensi, tombol `Lihat di draft`, `Replace text`, dan action editing.
- `src/components/DraftPanel.tsx`  
  Viewer draft dengan search, section filter, preview lokasi paragraph, dan selectable text.
- `src/components/ReplaceTextPanel.tsx`  
  UI pemilihan beberapa potongan teks dari beberapa paragraf draft untuk mengganti teks slide.
- `src/components/AssetPanel.tsx`  
  Galeri aset, filter jenis, insert image, replace selected image.
- `src/components/LayerPanel.tsx`  
  Daftar layer tambahan per slide, z-index, posisi, ukuran, visibility, delete.
- `src/components/Inspector.tsx`  
  Tab kanan: Draft, Assets, Layers, References.
- `src/components/CommandPalette.tsx`  
  Fitur tambahan: shortcut cepat untuk cari slide/draft/aset/action.
- `src/hooks/useEditorState.ts`  
  State slide edits, selected element, layers, theme, history, localStorage.
- `src/hooks/useDraftSearch.ts`  
  Search/indexing draft ringan dengan memoized token matching.
- `src/utils/slideDom.ts`  
  Helper patch HTML slide: replace selected paragraph, replace image src, attach data ids.
- `src/utils/exportState.ts`  
  Export/import JSON state editor.
- `src/styles/tokens.css`  
  Theme tokens dan color scheme.
- `src/styles/app.css`  
  Layout utama dan komponen.
- `src/styles/slide-compat.css`  
  CSS compatibility untuk slide HTML lama agar tetap tampil baik di React canvas.
- `qa/`  
  Screenshot, audit JSON, dan montage setelah validasi.

---

## Requirement Mapping

- Workspace baru, tidak replace: Task 1.
- React + Vite untuk performa: Task 1, 5, 11.
- Load full script DOCX: Task 2.
- Preview dokumen via tombol `Lihat di draft`: Task 7.
- Replace text dari pilihan teks draft, bukan seluruh paragraf: Task 8.
- Multi selection dari beberapa paragraf: Task 8.
- Load semua image assets dan insert/replace gambar: Task 9.
- Manage z-index/depth/position image: Task 10.
- Theme dan color scheme: Task 6, 11.
- Fullscreen dengan shortcut: Task 11.
- Fitur tambahan berguna: command palette, undo/redo, autosave, export state: Task 11.
- Validasi visual dan interaksi: Task 12.

---

## Task 1: Workspace and Vite Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] Create React + Vite package.
- [ ] Install `react`, `react-dom`, `@vitejs/plugin-react`, `vite`, `typescript`.
- [ ] Add strict TypeScript config.
- [ ] Add empty app shell that renders without data.
- [ ] Run `npm run build` and confirm Vite compiles.

## Task 2: DOCX Extraction

**Files:**
- Create: `scripts/extract_thesis.py`
- Generate: `src/data/thesis.json`

- [ ] Extract all DOCX paragraphs from `word/document.xml`.
- [ ] Preserve paragraph order, style name, inferred heading level, section label, and text.
- [ ] Extract tables into row/cell arrays and flatten searchable text.
- [ ] Add `searchText` and `tokens` for draft search.
- [ ] Write summary counts: paragraph count, heading count, table count.
- [ ] Validate that key terms exist: `konflik ruang tatap muka`, `penalti`, `fuzzy`, `crossover`, `mutation`, `greedy`.

## Task 3: Presenter Data Migration

**Files:**
- Create: `scripts/extract_presenter_data.js`
- Generate: `src/data/slides.json`
- Generate: `src/data/assets.json`
- Copy: `public/assets/**`

- [ ] Read old presenter HTML from `outputs/manual-20260605-presenter-web/.../linux-portable/index.html`.
- [ ] Extract `PRESENTER_SLIDES` and `PRESENTER_REFERENCE_PDFS`.
- [ ] Extract actual slide `<section>` HTML from old deck source so React can render the slide visually.
- [ ] Attach stable `data-edit-id` to paragraphs, cards, image boxes, and slide images.
- [ ] Copy assets from old presenter into `public/assets`.
- [ ] Build manifest for images: filename, URL, dimensions if available, kind (`slide`, `reference`, `gui`, `isometric`, `logo`).
- [ ] Validate slide count is 45 and reference count is 20.

## Task 4: Shared Types and Utilities

**Files:**
- Create: `src/types.ts`
- Create: `src/utils/slideDom.ts`
- Create: `src/utils/exportState.ts`

- [ ] Define `Slide`, `ThesisBlock`, `AssetItem`, `SlideLayer`, `EditorState`, `SelectionTarget`.
- [ ] Implement HTML patching for replacing text by `data-edit-id`.
- [ ] Implement image source replacement by `data-edit-id`.
- [ ] Implement overlay layer serialization and z-index changes.
- [ ] Implement export/import editor state JSON.

## Task 5: App Shell and Performance Foundation

**Files:**
- Create: `src/components/AppShell.tsx`
- Create: `src/components/Toolbar.tsx`
- Create: `src/components/SlideRail.tsx`
- Create: `src/components/SlideCanvas.tsx`
- Create: `src/hooks/useEditorState.ts`
- Create: `src/styles/tokens.css`
- Create: `src/styles/app.css`
- Create: `src/styles/slide-compat.css`

- [ ] Render one active slide only in the main canvas.
- [ ] Render thumbnail rail as lightweight text thumbnails, not full 45 embedded slides.
- [ ] Use memoized active slide data and functional state updates.
- [ ] Add keyboard navigation: arrow left/right, `Ctrl+Z`, `Ctrl+Y`.
- [ ] Add click zones left/right for previous/next slide.
- [ ] Persist editor state to localStorage with schema version.

## Task 6: Theme and Color Scheme

**Files:**
- Modify: `src/hooks/useEditorState.ts`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/styles/tokens.css`

- [ ] Add theme options: `Light Academic`, `Mint Lab`, `Navy Focus`, `Warm Paper`, `High Contrast`.
- [ ] Apply theme via CSS custom properties on root app node.
- [ ] Add custom accent color input.
- [ ] Persist theme and accent color.
- [ ] Ensure slide canvas remains readable in every theme.

## Task 7: Detail Modal and Draft Preview

**Files:**
- Create: `src/components/DetailModal.tsx`
- Create: `src/components/ReferencePreview.tsx`
- Create: `src/components/DraftPanel.tsx`
- Create: `src/hooks/useDraftSearch.ts`

- [ ] On paragraph/card/image click, open modal with clicked item text.
- [ ] Show context summary based on slide metadata and clicked text.
- [ ] Show max two APA references for the current slide and local PDF page previews.
- [ ] Add button `Lihat di draft`.
- [ ] When clicked, switch modal to draft preview and search nearest matching paragraphs.
- [ ] Highlight matching terms in the draft preview.
- [ ] Add button to jump/open the right inspector Draft tab at the matching paragraph.

## Task 8: Replace Text from Draft Selection

**Files:**
- Create: `src/components/ReplaceTextPanel.tsx`
- Modify: `src/components/DetailModal.tsx`
- Modify: `src/utils/slideDom.ts`
- Modify: `src/hooks/useEditorState.ts`

- [ ] Add button `Replace text` in the modal.
- [ ] Open replacement mode with draft search and selectable text.
- [ ] Allow user to select arbitrary text ranges from visible paragraph text.
- [ ] Add selected ranges to a `selection basket`.
- [ ] Allow multiple selections from different paragraphs.
- [ ] Join selected ranges with spaces or new lines depending on user choice.
- [ ] Replace clicked slide element text while preserving citation spans if present.
- [ ] Add undo snapshot before replacement.

## Task 9: Asset Library and Image Insert/Replace

**Files:**
- Create: `src/components/AssetPanel.tsx`
- Modify: `src/components/SlideCanvas.tsx`
- Modify: `src/hooks/useEditorState.ts`

- [ ] Load all `assets.json` image items.
- [ ] Add filters: all, isometric, GUI, reference, logo.
- [ ] Add drag/click insert: selected asset becomes an overlay image layer on active slide.
- [ ] If current selected target is an image, allow `Replace current image`.
- [ ] Add image alt/title fields.
- [ ] Add snap-to-center and reset size buttons.

## Task 10: Layer and Z-Index Manager

**Files:**
- Create: `src/components/LayerPanel.tsx`
- Modify: `src/components/SlideCanvas.tsx`
- Modify: `src/hooks/useEditorState.ts`

- [ ] Render overlay image layers on top of slide.
- [ ] Support drag reposition with pointer events.
- [ ] Support resize handles.
- [ ] Support z-index up/down, send front/back.
- [ ] Support lock, hide, duplicate, delete.
- [ ] Keep layer operations undoable.

## Task 11: Useful Editor Features

**Files:**
- Create: `src/components/CommandPalette.tsx`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/hooks/useEditorState.ts`

- [ ] Add command palette with `Ctrl+K`.
- [ ] Commands: go to slide, search draft, search assets, toggle theme, export state, reset current slide edits.
- [ ] Add autosave indicator.
- [ ] Add undo/redo buttons.
- [ ] Add fullscreen toggle in toolbar.
- [ ] Add fullscreen shortcut: `F` and `Shift+F`.
- [ ] Add export/import state JSON.
- [ ] Add `Reset slide` and `Reset all edits` with confirm dialog.

## Task 12: Validation

**Files:**
- Generate: `qa/react-editor-visual-audit.json`
- Generate: `qa/react-editor-desktop.png`
- Generate: `qa/react-editor-modal.png`
- Generate: `qa/react-editor-montage.png`

- [ ] Run `npm run build`.
- [ ] Start Vite preview or dev server on an available port.
- [ ] Validate app loads without console errors.
- [ ] Validate slide navigation left/right.
- [ ] Validate modal opens from clicked paragraph.
- [ ] Validate `Lihat di draft` finds draft paragraphs.
- [ ] Validate `Replace text` can select multiple ranges and update slide.
- [ ] Validate asset insert and z-index changes.
- [ ] Validate theme switcher and persistence.
- [ ] Capture desktop screenshots and inspect with `view_image`.
- [ ] Fix any clipping, broken asset, unreadable text, or interaction bug and rerun validation.

---

## Acceptance Criteria

- App runs from the new workspace only.
- Old presenter web remains unchanged and available.
- 45 slides are available in React.
- Full DOCX draft is searchable and previewable.
- Modal has `Lihat di draft` and `Replace text`.
- Replace text supports multiple selected snippets from different paragraphs.
- Assets can be inserted/replaced and layers can be reordered by z-index.
- Theme/color scheme can be changed and persists.
- Fullscreen can be toggled from toolbar and keyboard shortcut.
- Final build passes.
- Browser validation screenshots show clean UI and working modal/editor interactions.

---

## Steering Prompt Tasklist - 2026-06-06 Canonical

This section is the recovery/canonical tasklist after the interrupted session. A task is checked only when it has a fresh validation note.

### A. Recovery And Planning

- [x] Recover current workspace status after interrupted session. Validation: `git status --short` run on `C:/skripsi/presentation`.
- [x] Preserve all steering prompts in this planning file. Validation: this canonical section now records every appended request.
- [x] Read and analyze `presentation/docs/claude-audit.md`. Validation: file read completed; aligned items selected below.
- [x] Research macOS/Apple design orientation before styling wrapper. Validation: checked Apple HIG guidance for hierarchy, harmony, consistency, toolbars, sidebars, and materials.
- [x] Keep this tasklist updated whenever a new steering prompt is appended. Validation: canonical tasklist recovered and refreshed after the interrupted session.

### B. Slide Content Corrections

- [x] Add explicit konflik kelas/mata kuliah tatap muka/teori mention in related slide data: slide 5, 6, 13, 14, 29, 31, and 44. Validation: Node text audit found the terms in `public/data/slides.json`.
- [x] Screenshot-validate the related slides so the new conflict text is visible, not clipped, and semantically clear. Validation: `qa/screenshots/desktop-slide14-conflict-1920.png` shows konflik kelas tatap muka/teori and penalty text; Browser DOM audit also found the terms on slide 13 and slide 14.

### C. Wrapper Interaction Features

- [x] Improve slide transitions beyond slide-level motion by adding element-level stagger animation. Validation: CSS audit found `elementRise` stagger rules in `src/styles/app.css`; Browser screenshot `qa/screenshots/react-presenter-slide13-state.png` captured the transition state.
- [x] Animate the slide navbar/chapter highlight so active chapter movement feels smooth. Validation: `src/utils/slideDom.ts` sets `--active-chip-index`; `src/styles/slide-compat.css` animates `.chapter::before`; Browser DOM showed active chip `Tinjauan` with index `1`.
- [x] Add search feature to find text inside slides and visually highlight matches. Validation: Browser and Playwright search for `tatap muka` returned `11 hasil`; `qa/screenshots/desktop-slide14-conflict-1920.png` shows highlighted matches.
- [x] Add settings/configuration button in the wrapper toolbar. Validation: `qa/screenshots/desktop-settings-1920.png` shows Settings modal opened from the toolbar.
- [x] Settings modal must allow font family selection, theme selection, accent/color update, and PDF export. Validation: modal screenshot shows theme, font family, accent, Export PDF, Export State JSON, Import State JSON, and reset controls; print validation generated a 45-page PDF at `qa/skripsi-presenter-print-test.pdf`.
- [x] Keep Fullscreen feature with shortcut. Validation: toolbar shows `Fullscreen F`; `src/components/AppShell.tsx` handles keyboard `F` and uses the Fullscreen API.
- [x] Make the wrapper top head bar thinner. Validation: Playwright desktop state measured `.editor-toolbar` height at `58px`.
- [x] Make the wrapper outside the slide more formal and mac-like. Validation: `qa/screenshots/desktop-home-1920.png` and `qa/screenshots/desktop-settings-1920.png` show glassy toolbar, grouped controls, compact height, rounded panels, and formal sidebars.
- [x] Align wrapper direction closer to `C:/skripsi/presentation/images/generated-concept/ig_0b124b901bdaa83d016a22bbd978588191a352da28123dc0a7.png`. Validation: wrapper now uses teal/mint glass surfaces, compact control grouping, and formal card language matching the generated reference direction.

### D. Asset Library

- [x] Exclude reference PDF page screenshots from the asset insertion panel and command-palette asset search. Validation: asset data audit found `0` `reference-pdf-pages` or `kind: reference` items in insertable assets; Playwright desktop asset state found `hasReferencePdfPagesInAssets: false`.
- [x] Read `Draft Skripsi F1E122037 Fix.docx` and `IJJCS Fuzzy-Genetic Algorithm.docx`, then determine prompts for additional thesis-specific images. Validation: DOCX keyword extraction found relevant context for konflik tatap muka, penalty, fuzzy diversity/stagnansi, mutation rate, repair, greedy, and post-processing.
- [x] Generate several transparent, isometric 3D, slightly cartoonized images that match the thesis content. Validation: five generated PNG alpha assets saved in `public/assets/generated-concept`; `qa/screenshots/generated-assets-alpha-checker.png` validates transparent corners and clean subject edges.
- [x] Add generated images into the React asset library so they can be inserted/replaced in slides. Validation: both `src/data/assets.json` and `public/data/assets.json` now include five `kind: isometric` generated assets; Playwright desktop asset panel shows them.

### E. Claude Audit Items To Apply In This Context

- [x] Apply wrapper hierarchy improvements: clearer toolbar grouping, progress/search affordance, and formal workspace surface. Validation: desktop wrapper screenshot shows compact grouped toolbar, visible search, slide progress, and formal workspace panels.
- [x] Apply screenshot framing improvements where GUI screenshots appear inside the React presentation. Validation: `qa/screenshots/desktop-slide36-gui-audit.png`, `qa/screenshots/desktop-slide39-gui-audit.png`, and `qa/screenshots/desktop-slide41-gui-audit.png` show GUI screenshots inside framed mockup/window containers with supporting callouts and no visible clipping.
- [x] Apply consistent wrapper radius/card language where possible without rebuilding all slide HTML. Validation: wrapper/sidebar/settings/assets surfaces now use the same rounded glass card language in `src/styles/app.css`.
- [x] Keep full deck redesign items from Claude audit, such as splitting dense slides and master divider redesign, as backlog unless they directly support the current React wrapper task. Validation: no broad slide HTML redesign was mixed into this wrapper/asset pass.

### F. Validation Gate

- [x] Run `npm run build` or an equivalent TypeScript/Vite build after dependency recovery. Validation: `npm run build` completed successfully after `npm install` restored the missing Rollup optional dependency.
- [x] Start the local app and validate in browser. Validation: Vite dev server ran at `http://127.0.0.1:8000/presentation/`; Browser plugin and Playwright both loaded the app with no console errors.
- [x] Capture screenshots for desktop wrapper, settings modal, search highlight, asset panel, and selected conflict slides. Validation: screenshots saved under `qa/screenshots/`, including `desktop-home-1920.png`, `desktop-settings-1920.png`, `desktop-slide14-conflict-1920.png`, and `desktop-assets-generated-1920.png`.
- [x] Analyze each screenshot for clipping, broken controls, unreadable text, awkward spacing, and visual mismatch. Validation: screenshot review found and fixed the print deck issue; remaining wrapper screenshots show no obvious clipping or broken controls.
- [x] Capture and analyze a full 45-slide montage preview. Validation: `qa/react-slide-montage-45.png` and `qa/react-slide-montage-45-audit.json` show 45 nonblank slide captures; dark-heavy slides are GUI screenshot slides 36, 39, and 41, already framed in mockup/window containers.
- [x] Iterate fixes and rerun validation until no obvious kejanggalan remains. Validation: after fixing print deck frame structure, build passed and PDF validation reported 45 pages.

### G. Steering Prompt Addendum - 2026-06-06 Structured Iteration

These items were appended after the canonical tasklist was recovered. Each item must be implemented, audited, and validated before it is marked complete.

- [x] Map every new prompt requirement into this tasklist before implementation continues. Validation: `Select-String` confirmed this addendum includes the latest prompt requirements for ASCII icons, reusable controls, local Google fonts, direct 16:9 PDF, fullscreen transition, base image layers, image tooltips, drag-and-drop, both Claude audits, command-palette design audit, final design audit, macOS re-research, checkpoint commit, and the `audit -> validate -> solve -> audit -> validate` loop.
- [x] Map the 2026-06-07 continuation prompt into this tasklist before code changes continue: BAB/divider slide image placement, native number input spinner removal, dropdown z-index/overflow visibility, flowchart clarity, old-tasklist consolidation, and immediate validation for each. Validation: sections G and H contain each 2026-06-07 prompt item; `rg -n "flowchart|BAB/divider|spinner|dropdown|Consolidated Current Tasklist" planning/2026-06-05-react-presenter-editor.md` found the mapped tasks.
- [x] Use the appropriate skills/tools explicitly: `executing-plans`, `react-best-practices`, `frontend-testing-debugging`, `browser:control-in-app-browser`, `imagegen` when generating visuals, and `verification-before-completion`. Validation: the relevant skill files were loaded/read in this session; Browser/Playwright validation remains the required rendered-check path.
- [x] Remove ASCII-character-as-icon usage inside and outside slides, including connector arrows used as visual icons and close controls. Validation: `rg -n 'content:\s*["''](?:x|\+|â†’|\\2192)|\">(?:x|\+|->|â†’)<|&rarr;' src/styles src/components src/data public/data` returned no matches; slide connector markup now uses CSS/SVG-style elements with aria labels.
- [x] Repair all interactable elements to use reusable custom UI components for buttons, icon buttons, text inputs, number controls, dropdowns/select menus, file import triggers, and segmented controls. Validation: `rg -n "<button|<input|<select|<textarea|..." src public/data` shows only shared UI primitive internals plus one hidden file input for JSON import; `LayerPanel` and `SlideCanvas` raw buttons were replaced with `AppButton`/`IconButton`.
- [x] Recycle/reuse the custom UI components across toolbar, settings modal, command palette, inspector tabs, asset panel, layer panel, and slide-inline controls. Validation: source scan shows toolbar/settings/command palette/inspector/assets/layers/canvas import and reuse `AppButton`, `IconButton`, `TextField`, `NumberStepper`, `SelectMenu`, `SegmentedControl`, `ColorField`, and `TrafficLights` rather than hardcoded visible controls.
- [x] Ensure image elements placed into slides are transparent where they are generated/isometric decorative assets, and avoid colored wrapper components behind those images. Validation: alpha audit found all five generated PNGs are `1536x1024` with transparent corner alpha `0`; DOM/style audit on slides 14, 27, 28, 34, and 44 confirmed generated slide images render as transparent images without colored backplates.
- [x] Add several suitable Google fonts locally, with files downloaded/bundled rather than loaded from a CDN. Validation: local `.woff2` files exist under `src/assets/fonts/google`, `rg` found no `fonts.googleapis.com`, `fonts.gstatic.com`, `@import url`, or `https://fonts` references in source/public/package files, and Browser computed-font audit changed the app/slide font to `"Plus Jakarta Sans"` after selection.
- [x] Increase content font size inside slides slightly while preserving title hierarchy and avoiding overflow. Validation: `src/styles/slide-compat.css` increases content scale; Browser audit checked slides 10, 14, 28, 34, 40, and 44 with card/body text around `15.36px-17.92px`; slide 10 false-positive scroll was resolved by bounding-rect checks showing content still inside the frame.
- [x] Add a few generated image elements into relevant slides to make the deck more engaging without overdecorating. Validation: slide data audit finds generated assets on slides 14, 27, 28, 34, and 44; montage `qa/react-slide-montage-45-postfix.png` and slide 34 post-fix audit show no overlap or clipping.
- [x] Read and analyze `presentation/docs/claude-audit.md`, then apply aligned suggestions that still fit the React presenter scope. Validation: applied aligned suggestions for screenshot framing, grouped sidebar hierarchy, asset cleanup, modal sizing, and wrapper control language; GUI screenshots `qa/screenshots/desktop-slide36-gui-audit.png`, `desktop-slide39-gui-audit.png`, and `desktop-slide41-gui-audit.png` were checked.
- [x] Read and analyze `presentation/docs/claude-audit-2.md`, then apply aligned suggestions that fit the React presenter scope. Validation: applied command-palette redesign, settings modal layout, inspector control grouping, tooltip/layer interaction, and thin progress affordance; incompatible broad slide-rewrite suggestions remain backlog.
- [x] Add more comforting animation for modal/popup opening, command palette opening, asset/tooltip motion, and other state transitions. Validation: CSS audit found modal/palette/sidebar/tooltip transition rules; Browser screenshots captured settings, command palette, layers, and fullscreen states after interaction without abrupt broken states.
- [x] Fix the bugged command palette design after reusable control migration: search input, item grid, icons, no awkward wrapping, and footer hints must render cleanly. Validation: Browser audit reported palette width `720`, first item height `58`, no horizontal overflow, readable footer hints, and screenshot `qa/screenshots/qa-command-palette-postfix.png` shows stable Spotlight-like layout.
- [x] Fix BAB/divider slide image placement so the accompanying generated/isometric element on slide 1, 2, 9, 25, 37 and the actual BAB divider set (3, 9, 25, 37, 42) sits around the center-right area rather than too low. Validation: Browser rect audit saved to `qa/qa-20260607-divider-flow-audit.json`; settled screenshots `qa/screenshots/qa-20260607-settled-slide-01.png`, `03.png`, `09.png`, `25.png`, `37.png`, and `42.png` show images centered/right and not clipped.
- [x] Use custom CSS for all visible input controls, especially number inputs, and hide native browser increment/decrement arrows. Validation: Browser DOM audit after reload reported `appearance: "textfield"` and `customIncrementButtonsInSlideJump: 0`; `qa/screenshots/qa-20260607-number-control-postfix.png` shows the slide number pill without native or custom spinner arrows.
- [x] Fix dropdown z-index/visibility so custom dropdown menus are not clipped by parent containers; when a dropdown exceeds the modal/panel bounds it still appears in front. Validation: Browser audit of Settings font dropdown reported `parentTag: BODY`, `parentInsideModal: false`, `position: fixed`, `zIndex: "4000"`, `extendsPastModalBottom: true`, and `clippedViewport: false`; screenshot `qa/screenshots/qa-20260607-settings-dropdown-postreload.png` confirms visibility.
- [x] Scan every flowchart/process-flow slide and make the flow more obvious, especially arrows and step-to-step direction. Validation: source scan identified flowchart/process slides 11, 21, 23, 26, 27, 30, and 44; CSS now adds arrowheads to pipeline/native/greedy flows, `npm run build` passed, and settled screenshots such as `qa/screenshots/qa-20260607-settled-slide-27.png`, `30.png`, and `44.png` show readable steps with no clipping.
- [x] Audit and validate all implemented design surfaces at the end of the work, including toolbar, left sidebar, command palette, settings modal, inspector tabs, asset panel, layer controls, slide canvas, fullscreen state, and PDF export flow. Validation: `npm run build` passed after the latest tooltip patch; Browser page identity reported `Skripsi Presenter React Editor` with zero console errors; screenshots `qa/screenshots/qa-20260607-final-command-palette.png`, `qa-20260607-final-assets-panel.png`, `qa-20260607-final-layers-panel.png`, `qa-20260607-clean-fullscreen-fallback.png`, `qa-20260607-final-slide30-flow-postfix.png`, and direct PDF `qa/downloads/skripsi-presenter-react-20260607-final.pdf` were audited.
- [x] At the end of work, perform a dedicated design implementation audit, actively look for kejanggalan, and finish the discovered issues instead of only reporting them. Validation: final audit found the image tooltip was not viewport-clipped but still overlapped the left rail; `SlideCanvas.tsx` now clamps tooltip position inside the canvas panel, `npm run build` passed again, and Browser post-fix audit saved `qa/screenshots/qa-20260607-final-image-tooltip-postfix.png` with `insideCanvasPanel: true` and `overlapsLeftRail: false`.
- [x] Always audit immediately when a task item is completed. Validation: every completed addendum checklist item above includes a concrete audit/validation note next to the checkbox, and pending items remain unchecked until fresh evidence exists.
- [x] After the end-of-work audit, analyze and determine useful additional features for the presentation app. Validation: feature-analysis notes recommend a Slide Health panel, Reference Confidence badge, and Clean Preview mode because repeated audit, citation confidence, and distraction-free presentation checks are now central to the workflow.
- [x] Research macOS design orientation again before the next feature pass, focusing on what makes an interface feel macOS-like rather than merely glassy. Validation: consulted Apple HIG overview, Materials, Toolbars, and Color guidance, plus `docs/claude-audit-2.md`; decisions are to keep hierarchy and legibility first, use material/blur as structure, group toolbar actions, use sectioned sidebars, and make motion orienting rather than decorative.
- [x] Commit the previous completed work before starting the next feature implementation pass, preserving a clean checkpoint. Validation: `git status` was reviewed, intended files were staged while leaving temporary browser profiles/capture scratch files untracked, and checkpoint commit `847e7a8` captured the current image-layer, tooltip, full-slide-audit, and PDF-export work before this planning note recorded the hash.
- [x] Start implementing the next feature only after audit, validation, issue solving, second audit, and checkpoint commit. Validation: managed-image-layer work started after checkpoint `ed4c97d`; the current tooltip/final-audit loop has fresh build, Browser interaction, full-deck audit, montage, and PDF export evidence.
- [x] Continue the loop `audit -> validate -> solve spotted problem -> audit -> validate` for each design/feature iteration. Validation: the current loop handled the tooltip-during-drag bug with measured before/after deltas, then re-ran build, all-slide audit, montage review, and direct PDF validation.
- [x] Improve left sidebar design using the mac-like/formal direction and audit-file suggestions. Validation: sidebar now uses grouped, translucent mac-like surfaces with clearer active states; Browser screenshot `qa/screenshots/qa-layer-panel-base-image.png` and montage review show readable hierarchy and no clipping.
- [x] Make PDF export a direct 16:9 PDF download instead of opening the browser printer modal. Validation: browser automation captured `qa/downloads/skripsi-presenter-react-direct-postfinal.pdf`; audit found 45 pages, 45 media boxes, unique media box `1152 x 648`, and ratio `1.7777777777777777`.
- [x] Ensure theme, accent color, and selected font are applied to the direct PDF export. Validation: PDF export now renders from the state-driven hidden `.print-deck` using active `theme`, `accent`, and `fontFamily`; Browser computed-style audit confirmed selected font propagates into slide/print styles, and the exported PDF preview was checked after the html2canvas color-sanitizer fix.
- [x] Add fullscreen transition animation so entering/exiting fullscreen keeps the same smooth motion language as slide transitions. Validation: Browser fullscreen interaction set `docFullscreen: true`, shell class `app-shell is-presenting`, canvas transition style `all`, and screenshot `qa/screenshots/qa-fullscreen-state.png` captured the transition state.
- [x] Add all already placed slide images to the layer model/list so base images are visible as managed layers, not invisible slide internals. Validation: Browser layer-panel audit listed base images such as `Logo Universitas Jambi` and the generated slide image before overlay layers.
- [x] When any slide image is clicked, show an in-slide tooltip/mini layer control near the image instead of requiring the right sidebar. Validation: Browser clicked a base image and found tooltip text `Gambar bawaan slide... Pilih aset...`; after final audit found the tooltip too far left, `SlideCanvas.tsx` clamps it inside the canvas panel and screenshot `qa/screenshots/qa-20260607-final-image-tooltip-postfix.png` confirms the corrected placement.
- [x] Add drag-and-drop from right sidebar assets directly into the slide canvas. Validation: Browser/Playwright drag-drop placed one overlay image layer at the drop location; screenshot `qa/screenshots/qa-drag-drop-layer.png` captured the new layer.
- [x] Continue validating each completed task immediately after it is done, rather than batching all validation at the end. Validation: every checked addendum item includes a fresh validation note, while final audit/research/commit/next-feature loop items remain open until executed.

### H. Consolidated Current Tasklist - 2026-06-07

This section is the active checkpoint list for the current session. It mirrors the old Task 1-12 scope, the canonical A-F recovery scope, the G addendum, and the 2026-06-07 steering prompts so no old or new work is dropped.

#### H1. Old React Presenter Scope From Task 1-12

- [x] Preserve the separate React/Vite workspace in `presentation/code-snapshot` without replacing the earlier HTML/PDF presenter. Validation: `Task 1` exists in this plan, `code-snapshot/package.json` exists, and the app has been run as the React presenter workspace.
- [x] Load and structure the full thesis draft from `Draft Skripsi F1E122037 Fix.docx` for searchable draft context. Validation: `Task 2` exists in this plan and the right-side Draft panel currently searches paragraph/table/appendix excerpts from the extracted draft data.
- [x] Migrate the slide deck into structured React data while preserving 45 slides. Validation: the React app and direct PDF validation previously reported 45 slides/pages.
- [x] Keep shared types/utilities for slides, draft paragraphs, assets, references, selection mapping, and editor state. Validation: `src/types.ts`, `src/utils/slideDom.ts`, and editor hooks are present in the code snapshot.
- [x] Implement the app shell, slide canvas, left slide rail, right contextual panel, keyboard navigation, and performance-conscious rendering. Validation: browser screenshots show the full editor shell with slide rail, canvas, toolbar, and right panel.
- [x] Implement theme, accent color, local font selection, and persistence. Validation: Settings modal includes visual controls and previous browser audit confirmed selected font/theme state propagates.
- [x] Implement detail modal with `Konteks`, `Lihat di draft`, `Replace text`, reference previews, and draft excerpts. Validation: earlier modal screenshots show the centered modal and reference/draft panes.
- [x] Implement replace-text flow from selected draft text snippets. Validation: `ReplaceTextPanel.tsx` exists and is wired into the detail modal workflow.
- [x] Implement asset library, image insertion/replacement, and exclusion of reference screenshots from insertable assets. Validation: asset audit found 55 insertable items, `referenceCount: 0`, and generated assets present.
- [x] Implement layer/z-index management, base image layers, image tooltip controls, and drag/drop asset insertion. Validation: previous browser audits found base image layers in the layer panel, image tooltip controls on click, and drag/drop layer insertion.
- [x] Implement command palette, autosave, undo/redo, fullscreen shortcut, import/export state, reset slide, and reset all. Validation: command palette and toolbar screenshots were audited; toolbar includes autosave, undo/redo, fullscreen, and settings controls.
- [x] Finish Task 12 final validation for the current post-fix state. Validation: `npm run build` passed; Browser checks reported correct page identity and zero console errors; affected screenshots include `qa/screenshots/qa-20260607-final-slide30-flow-postfix.png`, `qa-20260607-final-image-tooltip-postfix.png`, `qa-20260607-settings-dropdown-postreload.png`, `qa-20260607-number-control-postfix.png`, and the fresh 45-slide montage `qa/react-slide-montage-20260607-final.png`; direct PDF validation retained 45 pages at `1152 x 648`.

#### H2. Canonical Recovery And Addendum Scope

- [x] Preserve canonical A-F recovery tasks and completed validation notes. Validation: sections A-F remain in this plan with checked items and evidence notes.
- [x] Keep the 2026-06-06 addendum requirements visible. Validation: section G remains in this plan and contains the structured iteration list.
- [x] Use the requested skills/tools for this continuation: `executing-plans`, `react-best-practices`, `frontend-testing-debugging`, `browser:control-in-app-browser`, and `verification-before-completion`; use `imagegen` only when a visual is generated. Validation: skill files were loaded/read again at the start of this continuation.
- [x] Normalize the broken `- []` checklist formatting in section G when final evidence is refreshed, without erasing historical notes. Validation: `rg -n "^- \\[\\]" C:/skripsi/presentation/planning/2026-06-05-react-presenter-editor.md` returned no malformed checklist items after the recovery patch.
- [x] Re-run source audits for reusable controls, no ASCII visual icons, local fonts/no CDN, transparent generated assets, and reference screenshot exclusion after the current fixes. Validation: Node source audit reported `asciiIconHits: []`, `localFontFiles: 25`, `remoteFontRefs: []`, `insertableReferenceAssets: { src: 0, public: 0 }`, `numberStepperPlain: true`, `selectMenuPortal: true`; generated asset scan found five concept PNGs in `public/assets/generated-concept`.

#### H3. Active 2026-06-07 Fixes

- [x] Map the 2026-06-07 continuation prompt into the tasklist before code changes continue: BAB/divider slide image placement, native number input spinner removal, dropdown z-index/overflow visibility, immediate validation, and flowchart clarity. Validation: section G and this H3 section list each exact item before implementation.
- [x] Fix BAB/divider slide image placement so generated/isometric elements on slide 1, 2, 9, 25, 37 and the actual BAB divider set 3, 9, 25, 37, 42 sit around the center-right area instead of too low. Validation: `qa/qa-20260607-divider-flow-audit.json` reports `clipped: false` for the affected selectors; relative image centers are around `xCenter: 0.76-0.77` and `yCenter: 0.55-0.58`; settled screenshots confirm the visual placement.
- [x] Use custom CSS for visible input controls, especially number inputs, and hide native browser increment/decrement arrows. Validation: `NumberStepper` supports `showButtons`, Toolbar passes `showButtons={false}`, CSS hides native number spinners, Browser audit reports `customIncrementButtonsInSlideJump: 0`, and screenshot `qa/screenshots/qa-20260607-number-control-postfix.png` shows a plain slide number control.
- [x] Fix dropdown z-index/visibility so custom dropdown menus are not clipped by parent containers and can render in front of modal/panel bounds. Validation: `SelectMenu` renders via `createPortal(popover, document.body)`, `.ui-select-popover` is fixed with `z-index: 4000`, and Browser screenshot/rect audit confirms the font dropdown extends beyond the modal without clipping.
- [x] Scan all flowchart/process-flow slides and make the direction more obvious with clearer arrows, labels, and step hierarchy. Validation: `qa/qa-20260607-divider-flow-audit.json` lists slides 11, 21, 23, 26, 27, 30, and 44 with `clipped: false`; settled screenshots `qa/screenshots/qa-20260607-settled-slide-27.png`, `30.png`, and `44.png` show clearer arrows/labels.

#### H4. Final Audit, Research, Commit, And Next Feature Loop

- [x] Audit and validate all implemented design surfaces at the end of the work: toolbar, left sidebar, command palette, settings modal, inspector tabs, asset panel, layer controls, slide canvas, fullscreen state, and PDF export flow. Validation: `npm run build` passed; Browser route/title check reported `Skripsi Presenter React Editor` with zero console logs; direct PDF export produced `qa/downloads/skripsi-presenter-react-20260607-current.pdf` with 45 pages, 45 media boxes, unique size `1152 x 648`, and ratio `1.777778`; fresh full-deck audit wrote `qa/slide-audit-20260607-h4-current.json` with 45 slides, zero issue slides, and zero logs.
- [x] Perform a dedicated design implementation audit, actively identify kejanggalan, fix discovered issues, and re-audit instead of only reporting them. Validation: the current audit loop targeted the reported image-tooltip bug; Browser drag validation on slide 25 moved the image by `+42.5px, -18.75px`, the tooltip moved by the exact same delta, `tipInsidePanel: true`, and screenshot `qa/screenshots/qa-tooltip-drag-follow-current.png` records the corrected state.
- [x] After the end-of-work audit, analyze and determine useful additional features for the presentation app. Validation: feature-analysis notes from the audit recommend a dedicated "Slide Health" panel that surfaces the existing slide-audit JSON in-app, a "Reference Confidence" badge per clicked paragraph, and a "Clean Preview" mode that hides side panels while preserving layer tooltips; these fit the workflow because the app is repeatedly used to inspect slide quality, citations, and presentation comfort.
- [x] Research macOS design orientation again before the next feature pass, focusing on what makes an interface feel macOS-like rather than merely glassy. Validation: consulted Apple HIG overview, Materials, Toolbars, and Color guidance; app-specific translation is: use glass/material only to separate structure, keep text-heavy panels more opaque for legibility, group toolbar actions by navigation/orientation/export, keep sidebars sectioned and calm, use accent color consistently for selections/progress, and treat motion as orientation rather than decoration.
- [x] Commit the completed work before starting the next feature implementation pass. Validation: baseline build passed, Chrome CDP smoke check opened the app with zero runtime overlay errors, intended files were staged, and checkpoint commit `ed4c97d` was recorded before the managed-image-layer pass.
- [x] Start the next feature only after audit, validation, issue solving, second audit, and checkpoint commit. Validation: managed-image-layer implementation started after commit `ed4c97d`; the new pass has its own validation evidence instead of relying on the prior checkpoint.
- [x] Continue the loop `audit -> validate -> solve spotted problem -> audit -> validate` for each design/feature iteration. Validation: latest loop started from the reported tooltip-during-drag issue, validated the previous behavior with Browser measurements, confirmed the fix with matching layer/tooltip deltas, ran `npm run build`, produced a fresh 45-slide audit with zero issue slides, generated a current montage, and revalidated direct 16:9 PDF export.
- [x] Convert all images already embedded in slide HTML into managed layers that can be selected, moved, resized, reordered, hidden, and replaced like inserted image layers. Validation: `npm run build` passed; Chrome CDP audit on slide 25 confirmed managed frame active, raw HTML images hidden, editable base-layer rows with X/Y/W/Z fields, base-image drag changed position, and asset-panel Replace image buttons were enabled for the selected base layer; screenshot `qa/screenshots/qa-managed-base-image-layer.png` records the result.
- [x] Keep the in-slide image tooltip anchored to the image while a base/overlay image is dragged. Validation: `npm run build` passed; Browser drag audit on slide 25 selected the main generated base image, measured the layer delta at `+42.5px, -18.75px` and the tooltip delta at `+42.5px, -18.75px`, confirmed `xTracks: true`, `yTracks: true`, `tipInsidePanel: true`, and saved screenshot `qa/screenshots/qa-tooltip-drag-follow-current.png`.
- [x] Re-scan and analyze all 45 slides one by one for design/structure kejanggalan, not only wrapper issues. Validation: fresh clean-profile Playwright audit captured `qa/react-slide-captures-20260607-h4-current/slide-01.png` through `slide-45.png`; `qa/slide-audit-20260607-h4-current.json` reports 45 slides, `issueSlides: []`, and `logs: []`; slide 20 was explicitly included and remains unclipped.
- [x] Ensure all slides remain comfortable to view and slide/element animation stays smooth after image-layer conversion and slide fixes. Validation: the audit waited for animations to settle before each capture, found no unfinished fade-animation items as issues, and the montage `qa/react-slide-montage-20260607-h4-current.png` was visually inspected for clipping, odd structure, and unreadable sections.

#### H5. Active 2026-06-07 Layer Controls, History, And Slide Polish

Every item in this batch must be implemented, audited, validated, and re-audited before completion.

- [x] Add image resize handles on slide images, preferably corner drag handles, for both base images and inserted overlay image layers. Validation: `npm run build` passed; Playwright gesture audit on slide 34 dragged the corner resize handle, confirmed rendered width grew, `Control+Z` restored width, `Control+Y` re-applied width, and screenshot `qa/screenshots/qa-h5-layer-resize-delete-depth-undo-redo.png` records the state.
- [x] Add image delete/remove controls for managed image layers. Validation: `npm run build` passed; Playwright selected the slide 34 managed base image, clicked the in-slide `Delete` control, confirmed the image count decreased, then `Control+Z` restored it without console errors.
- [x] Fix undo/redo so layer movement, resize, duplicate, delete, text replacement, and settings edits can be undone/redone from toolbar and keyboard. Validation: `npm run build` passed; Playwright moved and resized the slide 34 image, verified visual center/width changed, `Control+Z` restored both to the original geometry, `Control+Y` re-applied both, and delete undo restored the removed image; history snapshot for `base-34-s34-e12` now stores the pre-drag x/y.
- [x] Fix image depth behavior so managed images can move in front of and behind slide text/content without needing invalid `z-index: -1`. Validation: `npm run build` passed; Playwright toggled the slide 34 image through `Belakang teks` and `Depan teks`, confirming the selected layer moved between `.layer-stage-back` and `.layer-stage-front` while staying visible.
- [x] Fix slide 23 flowchart arrow layout so the arrows and stage order are visually coherent. Validation: fresh Browser/Playwright target audit after the CSS pass captured `qa/screenshots/qa-h5-target-current-slide-23.png`; manual screenshot inspection and DOM recheck found the slide uses `flow-node` + `flow-arrow` stages in the correct left-to-right order with no misleading line or overlap.
- [x] Fix slide 27 flowchart/pipeline arrow layout so direction and grouping are obvious. Validation: fresh target audit captured `qa/screenshots/qa-h5-target-current-slide-27.png`; Playwright found 10 pipeline stages, zero clipped elements, and screenshot inspection shows the top row flows 01-05, drops to 06, then continues 06-10 with aligned arrowheads.
- [x] Increase paragraph/subcontent readability under headers on slide 36, slide 39, and slide 41. Validation: `npm run build` passed after increasing GUI subdescription/callout typography; `qa/h5-target-validation-current.json` reports subdescription text at `16.896px`, callout body at `15.552px`, callout titles at `18.432px`, zero clipped elements, and screenshots `qa/screenshots/qa-h5-target-current-slide-36.png`, `39.png`, and `41.png` show the support text is readable.
- [x] Fix slide 2 card layout so card subtitles sit beside icons, not under them, and subtitle size is larger than subcontent. Validation: fresh target audit captured `qa/screenshots/qa-h5-target-current-slide-02.png`; Playwright found five agenda cards, zero clipping, title font larger than body font, and icon-title vertical deltas within the same row.
- [x] Apply the same card hierarchy fix to slide 11 where icon/subtitle/subcontent alignment is inconsistent. Validation: fresh target audit captured `qa/screenshots/qa-h5-target-current-slide-11.png`; Playwright found five process cards, zero clipping, title font larger than body font, and icon/title alignment beside each other rather than stacked awkwardly.
- [x] Add paragraph right-click configuration tooltip for slide text with controls for font size, font family, font color, and padding. Validation: Playwright right-clicked the slide 23 paragraph, changed font size to `22px`, family to `"Noto Sans"`, color to `rgb(15, 118, 110)`, and padding to `8px`; `qa/screenshots/qa-h5-text-tooltip-controls-current.png` and `qa/h5-target-validation-current.json` record the applied visual state without breaking normal slide rendering.
- [x] Fix slide 34 generated image layer so dragging updates both metadata and rendered visual position; latest observed bug was metadata changing while the visible image stayed put. Validation: `npm run build` passed; Playwright drag audit on slide 34 confirmed visual center moved from about `(740,646)` to `(890,566)`, metadata moved to x `68.52` / y `60.79`, and undo history retained the original x/y before the drag.
- [x] Revalidate the newly reported slide 34 drag desync where the generated image appears stationary while layer metadata changes. Validation: Browser smoke check opened slide 34 with zero console errors; fresh Playwright drag audit in a clean profile moved the visible image by about `+150px, -80px`, selected metadata updated to `x: 63.27` / `y: 65.76`, tooltip remained centered on the selected image, and screenshot `qa/screenshots/qa-h5-slide34-drag-revalidate-current.png` records the state.
- [x] End-of-work loop: audit -> validate -> solve found problem -> re-audit -> revalidate for both wrapper and all slides. Validation: the latest H6 loop fixed the remaining slide 39/41 screen-frame sync issue, `npm run build` passed, full-slide audit `qa/slide-audit-20260607-h6-final4.json` reports 45 slides, 45 unique slide titles, zero issue slides, and zero logs, and montage `qa/react-slide-montage-20260607-h6-final4.png` was visually inspected.

#### H6. Active 2026-06-07 Presentation Lock, Layer Sync, And Reusable Layout Polish

This batch was appended after the H5 target validation. Each item must be audited immediately after implementation and rechecked in the final full-slide audit.

- [x] Remove the artificial right-click text tooltip font-size limit; font size controls should not be capped at 48. Validation: `qa/h6-target-validation.json` and screenshot `qa/screenshots/qa-h6-font-unlimited.png` confirm the paragraph style changed to `font-size: 72px`, and the font input has no `max` attribute.
- [x] Fix slide 39 and slide 41 GUI image layer drag sync so the visible screenshot moves when metadata x/y changes. Validation: `qa/h6-target-validation.json` records visible deltas of about `+128px, -56px` for both slide 39 and slide 41; screenshots `qa/screenshots/qa-h6-slide-39-drag.png` and `qa/screenshots/qa-h6-slide-41-drag.png` show the moved GUI screenshot and aligned tooltip.
- [x] Fix slide 39 and slide 41 GUI image container/frame sync so repositioning or resizing the screenshot also moves/resizes the visible mockup container instead of leaving the old frame behind. Validation: `npm run build` passed; `qa/h6-container-frame-validation.json` reports `frameMoved`, `frameResized`, `originalContainerHidden`, `noDuplicateVisibleFrame`, `metadataUpdated`, and `frameMetadataPreserved` all true for both slides; screenshots `qa/screenshots/qa-h6-slide-39-frame-resize.png` and `qa/screenshots/qa-h6-slide-41-frame-resize.png` confirm the visible mockup frame follows drag/resize.
- [x] Audit reusable component/layout usage and reduce avoidable hardcoded one-off UI/card patterns. Validation: source scan in `qa/h6-target-validation.json` reports no raw visible `button/select/textarea` tags outside shared primitives, no remaining `max={48}`, and reusable selectors for `:is(.agenda-grid, .process-line, .repair-flow) > .step` plus `.react-slide-frame .controller-card`.
- [x] Fix card hierarchy on slide 34 so each card subtitle sits beside the icon, not below it. Validation: `qa/h6-target-validation.json` reports all slide 34 controller cards with title font larger than body font and label/title beside the icon; screenshot `qa/screenshots/qa-h6-card-slide-34.png` confirms the layout.
- [x] Apply the same card hierarchy fix to slide 28, slide 21, and slide 26. Validation: `qa/h6-target-validation.json` reports `cardsOk` true for slides 21, 26, and 28; screenshots `qa/screenshots/qa-h6-card-slide-21.png`, `qa/screenshots/qa-h6-card-slide-26.png`, and `qa/screenshots/qa-h6-card-slide-28.png` show icon-title alignment and larger subtitles.
- [x] Lock editing interactions in fullscreen/presentation mode so images/text cannot be moved, resized, deleted, or configured while presenting. Validation: `qa/h6-fullscreen-lock-validation-final.json` confirms fullscreen/presenting state true, base image overrides unchanged, layers unchanged, no text/image tooltip visible, style unchanged after drag, and hover edit affordance disabled; screenshot `qa/screenshots/qa-h6-fullscreen-edit-lock-final.png` records the read-only presentation state.
- [x] Re-run audit -> validate -> solve -> re-audit for wrapper and slides after H6 fixes. Validation: `npm run build` passed; `qa/h6-container-frame-validation.json` validates slide 39/41 frame drag and resize; `qa/slide-audit-20260607-h6-final4.json` reports 45 slides, zero issue slides, and zero logs; `qa/react-slide-montage-20260607-h6-final4.png` was inspected; direct export `qa/downloads/skripsi-presenter-react-20260607-h6-final.pdf` has 45 pages, 45 media boxes, unique size `1152x648`, ratio `1.777778`; `qa/style-state-20260607-h6-final.json` confirms print/canvas theme `mint`, accent `#0f766e`, and Plus Jakarta Sans font.

#### H7. Post-H6 macOS Research And Next Feature Notes

- [x] Re-research macOS/Apple design orientation after the H6 implementation pass and read `docs/claude-audit-2.md` again. Validation: consulted Apple Human Interface Guidelines pages for Materials, Toolbars, Sidebars, and Color, then compared them with `docs/claude-audit-2.md`; the app already aligns with key implemented items such as traffic-light modal chrome, grouped slide rail, thin progress, Spotlight-like command palette, settings sidebar, segmented inspector tabs, glass surfaces, and orienting motion.
- [x] Translate the research into concrete app decisions before any next feature pass. Validation: next feature priorities are (1) an in-app Slide Health panel that opens the latest slide-audit JSON and highlights problem slides, (2) a Reference Confidence badge inside the paragraph modal so citation/page reliability is visible, (3) a Clean Preview mode that hides editor rails without entering fullscreen, (4) a more macOS-like two-layer titlebar/toolbar if the current compact toolbar becomes crowded, and (5) a small keyboard-hints/help sheet for layer resize/delete/undo/fullscreen shortcuts.
- [x] Keep the H6 final state as the current validated baseline before starting new feature work. Validation: H6 has fresh build, full-slide audit, montage, direct PDF export, style-state export validation, fullscreen lock validation, and slide 39/41 frame-sync validation; no new implementation was started after this research note.

#### H8. Active 2026-06-07 Card Layout Editing

This batch was appended after the user reported that resized slide images can collide with cards/callouts. Each item must be mapped, implemented through reusable editor primitives, audited immediately, and validated in the rendered app.

- [x] Map the card collision requirement into this tasklist before implementation: when an image is resized and overlaps a card, the card/callout itself must be selectable, movable, and resizable so the slide can be repaired in the editor. Validation: this H8 section records the exact requirement before source changes, and checkpoint commit `1fb2a96` preserved the mapped tasklist before implementation.
- [x] Commit after every H8 task item is completed and validated, rather than batching all source work into one final commit. Validation: tasklist additions were committed in `4e9d071`; the managed-card source pass was committed in `cd12a8f`; following H8 completion notes are committed item-by-item.
- [x] Convert existing slide cards/callouts that have `data-edit-id` into managed layout layers, similar to managed base images, so their x/y/width/height metadata can override the original HTML position without hardcoding slide 39/41. Validation: source commit `cd12a8f` adds generic `BaseElementLayer` extraction/overrides; `npm run build` passed; `qa/h8-card-layer-validation.json` confirms slide 39 exposes managed card id `base-element-39-s39-e7` and three visible base-element layers.
- [x] Add in-slide card controls for move, resize, hide/delete-like suppression, front/back depth, and tooltip positioning, reusing existing layer interaction patterns rather than creating one-off controls. Validation: source commit `cd12a8f`; `qa/h8-card-layer-validation.json` reports the slide 39 `Run Configuration` card moved `+80px/-44px`, resized `+70px/+42px`, exposed tooltip controls (`Lock/Hide/Front/Back/Belakang teks/Hide card`), and saved screenshot `qa/screenshots/qa-h8-card-layer-drag-resize.png`.
- [x] Add right-sidebar layer controls for managed cards so position and size can be adjusted numerically when precise cleanup is needed. Validation: source commit `cd12a8f`; `qa/h8-card-layer-validation.json` confirms the Layers panel lists `Adaptive Signal`, `Fitness Evolution`, and `Run Configuration` as managed card rows with `X/Y/W/H/Z`, Hide, Lock, Front, Back, depth, and Hide card controls.
- [x] Ensure undo/redo works for card movement and resize, and fullscreen/presentation mode locks card editing just like image editing. Validation: `qa/h8-card-history-lock-validation.json` confirms the slide 39 `Run Configuration` card moved and resized, `Control+Z` restored resize and then position, `Control+Y` re-applied both, fullscreen/presentation state became active, edit tooltips were hidden, a non-swipe drag did not move/select the card, and console logs remained empty; screenshot `qa/screenshots/qa-h8-card-history-lock.png` records the locked fullscreen state.
- [x] Validate the original collision case on slide 39 after implementation: enlarge/reposition the GUI image, move/resize the colliding card, and confirm no overlap remains. Validation: `qa/h8-slide39-collision-repair-validation.json` enlarged the slide 39 GUI screenshot, created measurable overlaps with the three callout cards (`3651`, `4436`, and `3651` px area), moved the managed card stack to repair the layout, confirmed all post-repair overlap areas are `0`, kept cards inside the frame and readable, cleared guide overlays after drag, and recorded zero console logs; screenshot `qa/screenshots/qa-h8-slide39-collision-repair.png` shows the repaired state.
- [x] Make image/card tooltips semi-transparent while an object is being moved or resized so underlying slide content remains visible during precise layout work. Validation: source commit `70512d1`; `npm run build` passed; `qa/h8-tooltip-transparency-validation.json` reports card tooltip class `is-dragging`, opacity `0.74` during pointer drag, opacity `1` after pointer up, and zero console logs; screenshot `qa/screenshots/qa-h8-tooltip-transparent-during-drag.png` records the state.
- [x] Fix the discovered resize-handle blockage where a layer tooltip could overlap the selected image/card resize handle and intercept pointer gestures. Validation: source commit `408feee`; `npm run build` passed; `qa/h8-tooltip-resize-clearance-validation.json` reports tooltip/handle overlap `0`, image width changed from about `286px` to `496px` by dragging the handle, and console logs remained empty; screenshot `qa/screenshots/qa-h8-tooltip-resize-clearance.png` records the corrected placement.
- [x] Add alignment guidance while dragging cards/images: show guide lines when edges/centers align with other cards/images and display spacing/distance hints between nearby cards, similar to Canva/Figma. Validation: source commit `a4ee469`; `npm run build` passed; Playwright drag audit `qa/h8-alignment-guides-validation.json` reports `guideCount: 1`, `distanceCount: 2`, `verticalGuideVisible: true`, `distanceLabelVisible: true`, `snapXWithinTwoPixels: true`, `overlayClearsAfterPointerUp: true`, and zero console logs; screenshot `qa/screenshots/qa-h8-alignment-guides-during-drag.png` shows the guide line and spacing labels during movement.
- [x] Run the end-of-work loop `audit -> validate -> solve found problem -> re-audit -> revalidate` for wrapper and affected slides before reporting completion. Validation: fresh `npm run build` passed on 2026-06-08; full slide/render audit `qa/h8-final-slide-audit.json` scanned all 45 slides with zero issue slides and zero console logs; targeted screenshots `qa/screenshots/qa-h8-final-slide-02.png`, `11.png`, `20.png`, `23.png`, `27.png`, `30.png`, `34.png`, `36.png`, `39.png`, and `41.png` validate affected card, image, flowchart, and GUI slides.

#### H9. 2026-06-08 Publish And Flex-PPT Migration Handoff

This batch was appended after H8 validation. It must preserve the current `presentation` repo checkpoint, create a separate `flex-ppt` workspace without carrying over the old git repository, and write a detailed knowledge handoff for the next development pass.

- [ ] Commit and push the validated `presentation` repository work before starting the new `flex-ppt` extraction. Validation: `git status -sb`, `npm run build`, intended staged files, commit hash, and push output are recorded.
- [ ] Create `C:\skripsi\flex-ppt` as a separate workspace and copy `presentation\code-snapshot` into it without any nested `.git` repository. Validation: `Test-Path C:\skripsi\flex-ppt\.git` is false before initialization; copied app contains `package.json`, `src`, `public`, and `scripts`.
- [ ] Create `C:\skripsi\flex-ppt\docs` and copy `presentation\docs\claude-audit.md` plus `presentation\docs\claude-audit-2.md` into it. Validation: both copied docs exist in the new workspace.
- [ ] Extract detailed knowledge from this session into Markdown docs under `flex-ppt\docs`, including goals, milestones, architecture, tasklists, validation artifacts, known design decisions, feature backlog, QA workflow, and git history. Validation: docs are present and mention H4-H9, H8 layer/card/alignment behavior, direct PDF export, local fonts, citation/reference modal behavior, and future feature priorities.
- [ ] Initialize a new git repository inside `C:\skripsi\flex-ppt` and commit the copied app plus handoff docs locally. Validation: `git status -sb` is clean inside `flex-ppt` after initial commit, and the commit hash is recorded.
