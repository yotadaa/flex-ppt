# Analisis Desain Montage — 45 Slide Presentasi

Berikut hasil analisis menyeluruh dari montage yang sudah dicek:

---

## 🔴 Masalah Kritis (High Priority)

### 1. Clash Visual — Dark Screenshot di Tema Light
**Slide 36, 39, 41** menampilkan screenshot GUI/dashboard bertema gelap (dark UI) yang sangat kontras dengan keseluruhan tema presentasi yang light blue/white. Ini menciptakan "visual shock" yang mengganggu.
> **Fix:** Tambahkan frame/border card putih + drop shadow, atau beri overlay/mockup laptop/monitor sebagai container.

### 2. Text Overload (Content Density Terlalu Tinggi)
**Slide 4, 5, 6, 7, 10, 18, 22, 26, 30** — terlalu banyak teks paragraf. Audiens tidak akan sempat membaca saat presentasi berlangsung.
> **Fix:** Gunakan prinsip **1 slide = 1 ide utama**. Pecah menjadi beberapa slide, ubah paragraf menjadi bullet point pendek (max 6 kata per poin).

---

## 🟠 Masalah Desain Signifikan

### 3. Hierarki Visual Lemah
Banyak slide tidak memiliki pemisah jelas antara **heading → subheading → body text**. Ukuran font terlihat terlalu seragam sehingga mata tidak tahu harus fokus ke mana.
> **Fix:** Terapkan skala tipografi yang tegas: judul ≥ 28pt, subheading 18–20pt, body 14–16pt. Gunakan weight bold/semibold untuk heading.

### 4. Inkonsistensi Elemen Dekoratif
- Slide tertentu (1, 3, 9, 25, 37) menggunakan **ilustrasi 3D** (DNA helix, chart 3D, buku)
- Slide konten menggunakan **ikon flat 2D**
- Beberapa slide tidak ada ilustrasi sama sekali

> **Fix:** Pilih satu gaya ilustrasi (flat atau 3D isometric) dan konsisten di seluruh deck. Jika ingin mempertahankan 3D, buat versi mini untuk slide konten biasa.

### 5. Slide Divider BAB Tidak Konsisten Satu Sama Lain
- **BAB I (Slide 3)** & **BAB V (Slide 42)** — layout hampir sama ✅
- **BAB II (Slide 9)** — posisi elemen berbeda
- **BAB III (Slide 25)** — ukuran teks dan proporsi berbeda
- **BAB IV (Slide 37)** — ada elemen tambahan yang tidak ada di BAB lain

> **Fix:** Buat satu template master untuk semua slide divider BAB, hanya ubah nomor dan judul babnya.

---

## 🟡 Perbaikan Desain (Medium Priority)

### 6. Padding & White Space Tidak Konsisten
Beberapa slide terlihat kontennya terlalu mepet ke tepi (slide 19, 20, 31), sementara slide lain punya ruang napas yang baik.
> **Fix:** Set margin konten yang konsisten: minimal 40–50px dari semua sisi untuk layout 16:9.

### 7. Tabel Terlalu Dense (Slide 40, 14, 30)
Tabel-tabel ini punya border dan cell yang terlalu ramai, sulit dibaca dari jarak jauh.
> **Fix:** Gunakan zebra striping (warna selang-seling baris), hapus gridlines yang tidak perlu, perbesar padding cell, dan highlight baris penting dengan warna aksen.

### 8. Slide Agenda (Slide 2) Terlalu Plain
Slide agenda terlihat sangat sederhana dan tidak proporsional dibanding slide lain yang lebih kaya visual.
> **Fix:** Gunakan card/box untuk setiap poin agenda + ikon yang relevan + nomor urut yang menonjol.

### 9. Chromosome Visualization (Slide 12, 13, 15, 16, 33) — Ukuran Kurang Proporsional
Visualisasi kromosom dengan warna-warni sudah bagus secara konsep, namun tampak terlalu kecil dan tenggelam di slide.
> **Fix:** Perbesar elemen visualisasi, beri label yang lebih besar, dan kurangi teks di sekitarnya agar fokus ke visual.

### 10. Slide Cover (Slide 1) Kurang Impactful
Cover sebagai kesan pertama terlihat cukup sederhana — judul ada, nama ada, tapi belum ada elemen visual yang kuat.
> **Fix:** Perbesar tipografi judul, tambahkan ilustrasi hero yang lebih besar/dominan, pertimbangkan gradient background atau geometric accent.

---

## 🟢 Yang Sudah Bagus (Pertahankan)

| Elemen | Keterangan |
|--------|------------|
| **Color palette** | Biru-teal konsisten dan profesional ✅ |
| **Header bar** | Navigasi atas seragam di semua slide ✅ |
| **Chromosome color coding** | Penggunaan warna untuk representasi gen sudah komunikatif ✅ |
| **Jumlah slide divider** | 5 BAB divider membantu navigasi audiens ✅ |
| **Footer info** | Nama + institusi konsisten ✅ |

---

## 📋 Prioritas Perbaikan

```
1. [URGENT] Fix dark GUI screenshots → frame dengan mockup
2. [URGENT] Kurangi text density di slide konten
3. [HIGH]   Seragamkan template slide BAB divider
4. [HIGH]   Perkuat hierarki tipografi
5. [MEDIUM] Konsistenkan gaya ilustrasi (pilih flat atau 3D)
6. [MEDIUM] Redesign tabel agar lebih readable
7. [LOW]    Perkuat slide cover & agenda
```

Mau langsung perbaiki slide-slide spesifik yang bermasalah? Upload file `.pptx`-nya dan saya bisa langsung kerjakan.

Iya, ada beberapa lagi yang terlewat setelah dilihat lebih cermat:

---

## 🔴 Tambahan — Kritis

### 11. Tidak Ada Progress Indicator untuk Audiens
Audiens tidak tahu sedang di mana dalam presentasi. Header bar ada, tapi tidak ada indikator visual "kita sekarang di BAB berapa / slide ke berapa".
> **Fix:** Tambahkan **breadcrumb mini** di header (misal: `BAB II > Tinjauan Pustaka`) atau **progress bar tipis** di bagian bawah setiap slide.

### 12. Aksesibilitas Warna — Kontras Teks Rendah
Beberapa slide punya teks berwarna terang di atas background putih/sangat muda. Dari jarak proyektor, ini akan hilang.
> **Fix:** Pastikan semua teks body memenuhi **WCAG AA minimum** (rasio kontras ≥ 4.5:1). Khususnya teks abu-abu muda dan teal muda.

---

## 🟠 Tambahan — Signifikan

### 13. Bullet Point Style Tidak Konsisten
Di seluruh deck terlihat minimal 3–4 gaya bullet berbeda — lingkaran solid, kotak berwarna, dash, dan dot kecil — kadang dalam satu slide yang sama.
> **Fix:** Pilih **satu sistem bullet** dan terapkan globally lewat slide master.

### 14. Border Radius Tidak Seragam
Card/box di berbagai slide ada yang sharp corner, ada yang rounded kecil, ada yang rounded besar. Ini terlihat jelas saat dibandingkan antar slide.
> **Fix:** Tetapkan satu nilai radius (misal: 8px atau 12px) untuk semua card/box di seluruh presentasi.

### 15. Slide 20 — Grafik Fuzzy Terlalu Kecil
Grafik membership function di slide Fuzzy Logic (slide 20) tampak sangat kecil dan tidak terbaca. Padahal ini adalah konsep inti yang perlu dipahami audiens.
> **Fix:** Grafik harus mengambil minimal 50–60% area slide. Kurangi teks sekitarnya, biarkan visual yang berbicara.

### 16. Slide 23 (Kerangka Pemikiran) — Diagram Tidak Proporsional
Kerangka pikir adalah salah satu slide terpenting dalam skripsi/penelitian, tapi visualnya tampak padat dan kecil-kecil.
> **Fix:** Gunakan full-width flowchart, minimalkan teks dalam box, perbesar panah/konektor, dan gunakan warna bertingkat untuk menunjukkan alur logika.

### 17. Slide 27 (Pipeline Sistem) — Flowchart Terlalu Horizontal Sempit
Pipeline yang seharusnya menunjukkan alur sistem justru terlihat terhimpit dan sulit dibaca arah flownya.
> **Fix:** Pertimbangkan layout vertikal atau zig-zag, perbesar node, gunakan ikon per tahap.

### 18. Slide 38 (Statistik Hasil) — Angka Besar Tidak Dimanfaatkan
Slide ini punya data numerik besar (53, 129, 218, dst.) yang seharusnya jadi **hero visual**, tapi tampak biasa saja.
> **Fix:** Buat angka-angka itu besar dan dominan seperti **big number infographic** — ukuran font 60–80pt, tambah label kecil di bawahnya, tambah ikon pendukung.

---

## 🟡 Tambahan — Medium

### 19. Line Spacing Terlalu Rapat
Paragraf-paragraf di slide konten terlihat sangat padat dengan line height yang sempit, membuat mata lelah dan sulit memindai.
> **Fix:** Tingkatkan line spacing ke minimal **1.4–1.6× ukuran font** untuk semua body text.

### 20. Gaya Icon dari Library Berbeda
Beberapa icon terlihat memiliki stroke weight berbeda — ada yang outline tipis, ada yang filled bold. Ini menunjukkan ikon dari lebih dari satu sumber/library.
> **Fix:** Gunakan satu icon pack secara konsisten (misal: Phosphor Icons, Remix Icons, atau Flaticon satu seri).

### 21. Elemen 3D Dekoratif Tumpang Tindih dengan Teks
Di beberapa slide, ilustrasi 3D (buku, chart, dsb.) posisinya terlalu dekat atau bahkan overlay dengan area teks konten.
> **Fix:** Tempatkan ilustrasi 3D hanya di **zona dekoratif** (pojok kanan/kiri) dan pastikan ada clear zone antara ilustrasi dan teks.

### 22. Slide 35 (Tabel Fuzzy Cr & Mr) — Tabel Tidak Terbaca
Tabel rule fuzzy di slide ini adalah informasi teknis penting, tapi formatnya terlalu kecil dan padat.
> **Fix:** Gunakan heatmap-style coloring di cell nilai, perbesar header kolom/baris, atau pertimbangkan split jadi 2 slide.

### 23. Tidak Ada "Transisi Konteks" antar BAB
Setelah slide divider BAB, langsung masuk ke konten tanpa pengantar singkat apa yang akan dibahas di bab itu.
> **Fix:** Tambahkan **mini agenda per BAB** (1 slide) setelah setiap slide divider — cukup 3–5 poin topik yang akan dibahas.

---

## 🟢 Tambahan — Low Priority

### 24. Slide Terima Kasih (Slide 45) Terlalu Sederhana
Slide penutup adalah kesan terakhir audiens. Saat ini tampak minimal.
> **Fix:** Tambahkan elemen visual yang lebih kuat, kutipan inspiratif singkat, atau ringkasan micro (3 takeaway utama) sebelum "Terima Kasih".

### 25. Tidak Ada Visual Konsistensi untuk "Highlight/Callout"
Ketika ada info penting yang perlu di-highlight, setiap slide melakukannya dengan cara berbeda — ada yang bold, ada yang berwarna, ada yang di-box.
> **Fix:** Buat satu komponen **callout box** standar (misal: left-border accent + background tint) yang dipakai di semua slide.

---

## Summary Lengkap

| # | Issue | Priority |
|---|-------|----------|
| 1–2 | Dark GUI clash + Text overload | 🔴 Kritis |
| 3–10 | Inkonsistensi elemen, hierarki, tabel | 🟠 Tinggi |
| 11–12 | No progress indicator + kontras warna | 🔴 Kritis |
| 13–18 | Bullet/radius/grafik/diagram issues | 🟠 Tinggi |
| 19–23 | Line spacing, ikon, tabel teknis | 🟡 Medium |
| 24–25 | Slide penutup + callout system | 🟢 Low |

Total ada **25 poin** yang perlu diperbaiki. Mau mulai dari mana? Upload `.pptx`-nya dan kita eksekusi.