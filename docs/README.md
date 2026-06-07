# Flex-PPT Handoff Index

Folder ini adalah ekstraksi pengetahuan dari sesi migrasi dan penyempurnaan React presenter skripsi. Tujuannya adalah agar agent berikutnya bisa langsung bekerja di workspace baru `C:\skripsi\flex-ppt` tanpa perlu membaca ulang seluruh chat.

## Dokumen utama

- `session-knowledge-and-milestones.md` - ringkasan lengkap tujuan, keputusan, milestone H4 sampai H9, dan status terakhir.
- `architecture-and-code-map.md` - peta struktur React/Vite, komponen penting, state editor, asset, layer, dan export PDF.
- `validation-and-qa-playbook.md` - cara validasi yang dipakai, artefak QA penting, dan standar audit sebelum mengklaim selesai.
- `next-agent-playbook.md` - instruksi praktis untuk agent berikutnya, termasuk cara menjalankan app, aturan edit, dan jebakan yang sudah ditemukan.
- `feature-backlog-and-design-decisions.md` - backlog fitur, keputusan desain mac-like, dan prioritas lanjutan.
- `source-planning-2026-06-05-react-presenter-editor.md` - salinan planning asli yang berisi tasklist historis paling lengkap.
- `claude-audit.md` dan `claude-audit-2.md` - audit desain eksternal yang dipakai sebagai referensi.

## Status repo asal

Repo asal `C:\skripsi\presentation` sudah dipush ke `origin/main` pada commit `3646ef4` dengan pesan `Record H8 final audit and migration plan`.

## Status workspace ini

Workspace ini dibuat dari `presentation\code-snapshot` tanpa membawa `node_modules`, `dist`, atau `.git` lama. Setelah semua docs dibuat, repo baru lokal di folder ini perlu dianggap sebagai baseline baru untuk pengembangan Flex-PPT.
