# Validation And QA Playbook

This app must be validated visually and behaviorally. Passing TypeScript is necessary but not enough.

## Verification culture

The working rule from the previous session:

1. Map the user prompt into the tasklist.
2. Implement one task item.
3. Validate immediately.
4. Commit the task item after validation.
5. At the end, run audit -> validate -> solve found problem -> re-audit -> revalidate.

Do not claim a task is done without fresh evidence.

## Minimal build verification

From `C:\skripsi\flex-ppt`:

```powershell
npm ci
npm run build
```

The original source build passed before migration from `C:\skripsi\presentation\code-snapshot`.

## Render validation target

Run dev server:

```powershell
npm run dev
```

Default URL:

```text
http://127.0.0.1:5173/presentation/
```

## Browser validation checklist

For wrapper:

- App title is `Skripsi Presenter React Editor`.
- App shell renders, not blank.
- No Vite or React error overlay.
- Console has no relevant errors/warnings.
- Toolbar is thin, readable, and not crowded.
- Left slide sidebar is readable and grouped.
- Right inspector tabs work: Draft, Assets, Layers, Refs.
- Command palette is not broken: input aligned, results do not wrap awkwardly, footer hints visible.
- Settings modal opens with traffic-light chrome and dropdowns not clipped.
- Fullscreen mode locks editing.
- Search highlights text and navigates results.

For slides:

- All 45 slides render.
- No severe clipping outside 16:9 frame.
- No unexpected edit tooltip or alignment overlay visible when idle.
- No tiny body text below reasonable readability threshold.
- Important slides 2, 11, 20, 23, 27, 30, 34, 36, 39, 41 should get targeted screenshots.
- Flowchart arrows on slides 23, 27, and 30 must be visually obvious.
- GUI screenshots on slides 36, 39, 41 must be readable enough and framed.

For layer editing:

- Drag image: visual object and metadata both move.
- Resize image: visual object, metadata, and container/frame move together.
- Drag card: card visual and metadata both move.
- Resize card: card visual and metadata both resize.
- Tooltip follows moved layer.
- Tooltip does not block resize handle.
- Tooltip becomes semi-transparent during drag/resize.
- Alignment guide line appears near matched edge/center.
- Distance hint appears between nearby objects.
- Guide overlay clears after pointer up.
- Undo/redo restores move and resize.
- Fullscreen prevents edit interactions.

## Important QA artifacts from the source repo

Original artifacts are in `C:\skripsi\presentation\qa`.

H8 final:

- `h8-final-slide-audit.json` - full 45-slide render audit with zero issue slides and zero console logs.
- `h8-alignment-guides-validation.json` - guide line and distance hint validation.
- `h8-card-history-lock-validation.json` - card undo/redo and fullscreen lock validation.
- `h8-slide39-collision-repair-validation.json` - slide 39 collision repair validation.
- `h8-tooltip-resize-clearance-validation.json` - tooltip no longer blocks resize handle.
- `h8-tooltip-transparency-validation.json` - tooltip opacity changes while dragging.

H6/H5 useful artifacts:

- `h6-container-frame-validation.json` - slide 39/41 GUI frame follows image movement/resize.
- `h6-fullscreen-lock-validation-final.json` - fullscreen edit lock.
- `h6-target-validation.json` - font size, reusable components, card hierarchy.
- `h5-target-validation-current.json` - slide 2, 11, 23, 27, 36, 39, 41 target checks.

Targeted final screenshots from the pushed repo:

- `qa/screenshots/qa-h8-final-slide-02.png`
- `qa/screenshots/qa-h8-final-slide-11.png`
- `qa/screenshots/qa-h8-final-slide-20.png`
- `qa/screenshots/qa-h8-final-slide-23.png`
- `qa/screenshots/qa-h8-final-slide-27.png`
- `qa/screenshots/qa-h8-final-slide-30.png`
- `qa/screenshots/qa-h8-final-slide-34.png`
- `qa/screenshots/qa-h8-final-slide-36.png`
- `qa/screenshots/qa-h8-final-slide-39.png`
- `qa/screenshots/qa-h8-final-slide-41.png`

## Direct PDF export requirements

The PDF export must:

- be direct download, not browser print dialog,
- have 45 pages,
- keep 16:9 ratio,
- use page size 1152 x 648 or equivalent 1.777778 ratio,
- apply active theme,
- apply active accent color,
- apply selected font family.

Regression risk:

- `html2canvas` can be sensitive to unsupported CSS color functions or filters. Keep export rendering simple in the hidden print deck.

## Suggested audit script approach

In the new workspace, after `npm ci`, use `playwright-core` and installed Chrome. A minimal approach:

1. Launch Chrome with `playwright-core`.
2. Open `http://127.0.0.1:5173/presentation/?qa=...#slide-N`.
3. Wait for animations to settle.
4. For each slide 1 to 45:
   - verify `.react-slide-frame`,
   - check no console errors,
   - check no severe clipping,
   - check no idle `.alignment-overlay` or `.image-layer-tooltip`.
5. Save JSON and targeted screenshots.

## Known false positives

- Some slide text is intentionally small in footer/footer label. Do not flag footer text alone as a readability failure.
- Reference PDF screenshots are dark or dense by nature; inspect whether they are in a modal/reference context, not slide content.
- Presentation swipe in fullscreen can be mistaken for a drag mutation if the pointer movement is too large. Use a small non-swipe drag for lock validation.

## What to do when audit finds a problem

Do not only report it. Patch, build, validate again, and commit. The previous session explicitly required:

```text
audit -> validate -> solve found problem -> re-audit -> revalidate
```
