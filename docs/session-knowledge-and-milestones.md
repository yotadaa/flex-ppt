# Session Knowledge And Milestones

Tanggal handoff: 2026-06-08.

Workspace baru: `C:\skripsi\flex-ppt`.

Sumber app: salinan bersih dari `C:\skripsi\presentation\code-snapshot`.

Repo asal yang sudah dipush: `C:\skripsi\presentation`, remote `https://github.com/yotadaa/presentation.git`, branch `main`, commit terakhir `3646ef4`.

## Tujuan besar proyek

Proyek ini adalah React presenter/editor untuk presentasi skripsi berjudul optimasi penjadwalan praktikum menggunakan Algoritma Genetika dan Fuzzy Logic. Aplikasi ini bukan hanya slide viewer, tetapi juga editor interaktif yang menghubungkan slide, draft skripsi, referensi, asset gambar, layer, dan export PDF.

Target utama yang sudah dikerjakan:

1. Membuat presentasi skripsi berbasis React/Vite dengan 45 slide.
2. Memuat konteks draft skripsi dan daftar referensi untuk modal penjelasan paragraf.
3. Membuat slide bisa dinavigasi, dicari, diklik, dan diekspor ke PDF 16:9.
4. Membuat image dan card di slide menjadi layer yang bisa dipindah, diresize, disembunyikan, diganti depth, dan diedit.
5. Menerapkan desain wrapper yang lebih formal, mac-like, dan glassy tanpa mengorbankan keterbacaan.
6. Menambahkan audit visual dan QA loop sebagai budaya kerja utama: audit, validate, solve, re-audit, revalidate.

## Konteks skripsi penting

Konten slide harus tetap menjaga beberapa poin akademik berikut:

- Penjadwalan praktikum FST berbeda dari kuliah reguler karena melibatkan ruang laboratorium, slot waktu, kelas, peserta, durasi, dan asisten.
- Konflik mata kuliah tatap muka atau teori harus terekam sebagai penalti menengah hingga tinggi ketika bentrok dengan jadwal praktikum.
- Fitness function menjadikan penalty conflict sebagai dasar kualitas jadwal. Rumus utama yang dipakai: `fitness = 1 / (1.0 + penalty_score)`.
- Fuzzy Logic tidak boleh diklaim sebagai pengganti GA atau pemenang absolut. Posisinya adalah adaptive controller untuk mengatur parameter GA.
- Fuzzy crossover membaca diversity dan stagnansi hasil crossover. Rujukan spesifik: Subburaj & Miruna Joe Amali (2025) menggunakan keberagaman populasi sebagai parameter untuk scaling factor terhadap crossover rate.
- Fuzzy mutation berbeda dari crossover karena memakai pergerakan skor fitness dari iterasi sebelumnya, terutama untuk iterasi lebih dari satu. Rujukan: Pytel (2025).
- Classic GA lebih kuat pada mayoritas metrik akhir, sedangkan Fuzzy GA berguna untuk membaca stagnansi dan menyesuaikan parameter selama evolusi.
- Greedy atau repair post-processing perlu diposisikan sebagai tahap perbaikan konflik residual setelah operator evolusi menghasilkan kandidat jadwal.

## Timeline milestone utama

### H4 - Final audit, research, commit, and next feature loop

Status: selesai di repo asal.

Fokus:

- Audit wrapper dan semua slide.
- Validasi direct PDF 16:9.
- Riset ulang orientasi macOS.
- Menentukan fitur lanjutan seperti Slide Health panel, Reference Confidence badge, Clean Preview mode, dan keyboard help sheet.

Bukti penting:

- Direct PDF export menghasilkan 45 halaman dengan rasio 16:9.
- Audit full deck mencatat 45 slide dan zero issue slides.
- macOS design direction difokuskan pada hierarchy, materials, toolbar grouping, sidebar sectioning, dan motion yang orienting.

### H5 - Layer resize, delete, undo/redo, flowchart, GUI readability

Status: selesai di repo asal.

Fokus:

- Gambar bisa diresize dengan corner handle.
- Gambar bisa dihapus atau disembunyikan.
- Undo dan redo diperbaiki.
- Depth level diperbaiki agar layer bisa berada di belakang teks tetapi tetap di atas slide.
- Slide 23 dan 27 flowchart diperjelas.
- Slide 36, 39, 41 diperbesar font konten pendukungnya.
- Slide 2 dan 11 diperbaiki hierarchy card: subtitle sejajar icon dan lebih besar dari subcontent.
- Right-click paragraph tooltip ditambahkan untuk konfigurasi font size, font family, font color, dan padding.

Catatan:

- Right-click paragraph style tidak boleh dibatasi font-size 10 sampai 48 lagi.
- Mode fullscreen harus lock semua edit interaction.

### H6 - Presentation lock, layer sync, reusable layout polish

Status: selesai di repo asal.

Fokus:

- Menghapus limit font-size.
- Fix slide 39 dan 41 agar gambar GUI bergerak secara visual ketika metadata berubah.
- Fix container/frame sync untuk slide 39 dan 41.
- Audit reusable components agar tidak banyak hardcoded visible controls.
- Fix hierarchy card pada slide 34, 28, 21, dan 26.
- Lock editing di fullscreen/presentation mode.

Bukti penting:

- `qa/h6-container-frame-validation.json` membuktikan frameMoved, frameResized, originalContainerHidden, noDuplicateVisibleFrame, metadataUpdated, dan frameMetadataPreserved.
- `qa/h6-fullscreen-lock-validation-final.json` membuktikan edit locked di fullscreen.

### H7 - Post-H6 macOS research

Status: selesai di repo asal.

Keputusan desain:

- mac-like bukan hanya glass blur. Kuncinya adalah hierarchy, grouping, opacity yang menjaga keterbacaan, sectioned sidebars, toolbar yang rapi, dan motion sebagai orientasi.
- Audit `claude-audit-2.md` dipakai sebagai referensi untuk traffic lights, grouped sidebars, Spotlight-style command palette, segmented inspector, thin progress, settings sidebar, dan clean panel language.

### H8 - Card layout editing, tooltip refinement, alignment guides

Status: selesai dan dipush di commit `3646ef4`.

Fokus:

- Kartu atau callout yang sudah ada di slide, terutama yang punya `data-edit-id`, dikonversi menjadi managed layout layers.
- Card bisa dipindah dan diresize seperti image layer.
- Card punya controls di dalam slide: Lock, Hide, Front, Back, Belakang teks, Duplicate, Hide card.
- Right sidebar Layers menampilkan managed cards dengan X, Y, W, H, Z.
- Undo/redo bekerja untuk move dan resize card.
- Fullscreen mode mengunci edit card dan image.
- Tooltip card/image dibuat semi-transparan saat drag atau resize agar area di belakangnya tetap terlihat.
- Tooltip yang semula bisa menutup resize handle diperbaiki dengan anchor di atas selected layer.
- Alignment guidance seperti Canva/Figma ditambahkan saat drag:
  - guide line muncul saat edge atau center align dengan object lain.
  - distance hints muncul untuk jarak antar card/image.
  - overlay hilang setelah pointer up.

Bukti penting:

- `qa/h8-alignment-guides-validation.json` melaporkan `guideCount: 1`, `distanceCount: 2`, `verticalGuideVisible: true`, `distanceLabelVisible: true`, `snapXWithinTwoPixels: true`, `overlayClearsAfterPointerUp: true`, dan zero logs.
- `qa/h8-slide39-collision-repair-validation.json` membuktikan overlap awal `[3651, 4436, 3651]` menjadi `[0, 0, 0]` setelah card stack dipindah.
- `qa/h8-tooltip-resize-clearance-validation.json` membuktikan tooltip dan resize handle tidak overlap.
- `qa/h8-final-slide-audit.json` memindai 45 slide dengan zero issue slides dan zero console logs.

### H9 - Publish and Flex-PPT migration handoff

Status saat dokumen ini dibuat:

- Repo asal sudah commit dan push sampai `3646ef4`.
- Folder `C:\skripsi\flex-ppt` sudah dibuat dari `code-snapshot`.
- `node_modules`, `dist`, dan `.git` lama tidak ikut disalin.
- `docs\claude-audit.md`, `docs\claude-audit-2.md`, dan salinan planning asli sudah disalin.
- Docs handoff ini dibuat agar pengembangan berikutnya bisa dimulai dari workspace baru.

## Peringatan penting

- Jangan menganggap semua referensi eksternal selalu valid. Aplikasi menyimpan screenshot halaman PDF lokal untuk referensi tertentu; klik screenshot referensi harus membuka artikel atau sumber di tab baru.
- Jangan mengembalikan wording yang memakai POV pihak ketiga seperti "Pendahuluan menjelaskan bahwa...". Slide harus langsung menyatakan substansi.
- Jangan memakai `Data penelitian FST, 2025` atau `Hasil pengujian sistem, 2025` sebagai rujukan formal.
- Jangan memakai karakter ASCII sebagai icon. Gunakan Heroicons atau custom SVG component.
- Jangan hardcode visible controls. Gunakan reusable UI components.
- Jangan membiarkan screenshot referensi masuk ke asset insertion panel.
- Jangan mengizinkan edit layer saat fullscreen/presentation mode.

## Git history penting dari repo asal

- `3646ef4` - Record H8 final audit and migration plan.
- `2d3b9a3` - Mark slide 39 collision repair validated.
- `408feee` - Keep layer tooltips clear of resize handles.
- `a4ee469` - Add alignment guides for layer dragging.
- `70512d1` - Dim layer tooltips during drag.
- `cd12a8f` - Add managed card layout layers.
- `f49ee64` - Polish presenter layer editing and final audits.
- `847e7a8` - Refine presenter image layers and audits.
- `ed4c97d` - Checkpoint presenter editor polish.

## Practical latest-known-good validation

From `C:\skripsi\presentation\code-snapshot`:

```powershell
npm run build
```

Fresh result before handoff: build passed.

Final audit from repo asal:

- `qa/h8-final-slide-audit.json`
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

The final H8 audit result: 45 slides, zero issue slides, zero console logs.
