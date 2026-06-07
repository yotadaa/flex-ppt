Ini redesign mockup-nya. Berikut breakdown apa saja yang perlu diubah di app kamu:

---

## 🍎 Perubahan untuk macOS Glass Look

### Window Chrome
Traffic light buttons (merah/kuning/hijau) harus ada di setiap modal dan panel utama. Saat ini app kamu tidak punya ini, jadi terasa seperti web biasa.

### Toolbar — Unified Bar
Pisahkan toolbar menjadi dua layer: titlebar dengan traffic lights + centered title, lalu toolbar kedua untuk breadcrumb + progress + navigasi. Persis seperti macOS Finder atau Final Cut Pro.

### Progress Bar Tipis
Tambahkan thin progress bar di bawah toolbar (seperti di mockup) — `62% = slide 28/45`. Simple tapi sangat komunikatif.

### Sidebar — Section Headers
Ganti flat list menjadi grouped sections dengan header uppercase kecil seperti `PENDAHULUAN · TINJAUAN · METODOLOGI`. Ini adalah pola sidebar macOS klasik (Finder, Music, Safari).

### Command Palette — Spotlight Style
Tiga perubahan kritis:
- Fix word wrap dengan `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
- Tambah ikon berbeda per tipe (action vs slide vs asset)
- Tambah footer keyboard hints: `↑↓ navigasi · ↵ pilih · Esc tutup`

### Settings — System Preferences Layout
Tambahkan sidebar kiri untuk navigasi kategori (Tampilan, Pintasan, Presenter, Export, Reset). Ini jauh lebih scalable dan terasa seperti macOS Settings asli.

### Inspector Panel — Segmented Control
Ganti tab `Draft / Assets / Layers / Refs` dengan segmented control pill kecil di atas panel, lalu tampilkan layer tree di bawahnya.

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 
             'SF Pro Text', 'SF Pro Display', sans-serif;
```
Satu line ini langsung ubah feel seluruh app menjadi native macOS.

### "Gaya Gelas" — Glassmorphism
```css
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border: 0.5px solid rgba(255, 255, 255, 0.4);
```
Terapkan ke sidebar, modals, dan panel. Butuh background yang ada texture/gradient di belakangnya agar efeknya kelihatan.

---

# macOS Glass Design Guide
## Presenter React App — UI Redesign Reference

---

## 1. Font Stack

Satu perubahan ini langsung ubah feel seluruh app jadi native macOS.

```css
font-family: -apple-system, BlinkMacSystemFont,
             'SF Pro Text', 'SF Pro Display',
             'Helvetica Neue', sans-serif;
```

Terapkan ke `body` atau root className di `globals.css` / `index.css`.

---

## 2. Glassmorphism — "Gaya Gelas"

Butuh background yang ada warna/gradient di belakangnya agar efek kaca kelihatan. Tanpa itu, blur tidak akan terlihat.

### Base Glass Panel
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
}
```

### Dark Mode Glass
```css
@media (prefers-color-scheme: dark) {
  .glass-panel {
    background: rgba(30, 30, 32, 0.75);
    border: 0.5px solid rgba(255, 255, 255, 0.1);
  }
}
```

### Sidebar Glass (lebih opaque)
```css
.glass-sidebar {
  background: rgba(246, 246, 248, 0.85);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border-right: 0.5px solid rgba(0, 0, 0, 0.08);
}
```

### Modal / Command Palette Glass
```css
.glass-modal {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border: 0.5px solid rgba(255, 255, 255, 0.5);
  border-radius: 14px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 1px 0 rgba(255, 255, 255, 0.6) inset;
}
```

> **Tip:** Beri background gradient / mesh color pada `<body>` atau wrapper utama agar efek blur kelihatan jelas. Contoh:
> ```css
> body {
>   background: linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 50%, #fef9c3 100%);
> }
> ```

---

## 3. Window Chrome — Traffic Light Buttons

Tambahkan ke setiap modal dan panel utama.

```jsx
// TrafficLights.jsx
export function TrafficLights({ onClose, onMinimize, onMaximize }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button
        onClick={onClose}
        style={{
          width: 12, height: 12, borderRadius: '50%',
          background: '#FF5F57', border: 'none', cursor: 'pointer',
          transition: 'opacity 0.15s'
        }}
        aria-label="Close"
      />
      <button
        onClick={onMinimize}
        style={{
          width: 12, height: 12, borderRadius: '50%',
          background: '#FEBC2E', border: 'none', cursor: 'pointer'
        }}
        aria-label="Minimize"
      />
      <button
        onClick={onMaximize}
        style={{
          width: 12, height: 12, borderRadius: '50%',
          background: '#28C840', border: 'none', cursor: 'pointer'
        }}
        aria-label="Maximize"
      />
    </div>
  )
}
```

---

## 4. Toolbar — Dua Layer

Pisah toolbar jadi dua bar yang berbeda.

```
┌─────────────────────────────────────────────────────────┐
│  🔴 🟡 🟢   [    Judul Presentasi — Slide 28/45    ]  ⚙ │  ← Titlebar
├─────────────────────────────────────────────────────────┤
│  Pendahuluan › Metodologi › Repair dan Post-Processing   │  ← Breadcrumb bar
│  ‹  28 / 45  ›   ━━━━━━━━━━━━━░░░░░░░░   62%           │
└─────────────────────────────────────────────────────────┘
```

### Titlebar CSS
```css
.titlebar {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  background: rgba(246, 246, 248, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  -webkit-app-region: drag; /* opsional, kalau pakai Electron */
}

.titlebar-center {
  flex: 1;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #1c1c1e;
}
```

### Progress Bar Tipis
```jsx
<div style={{
  height: 2,
  background: 'rgba(0,0,0,0.08)',
  borderRadius: 2,
  width: 120,
  overflow: 'hidden'
}}>
  <div style={{
    height: '100%',
    width: `${(currentSlide / totalSlides) * 100}%`,
    background: '#14B8A6',
    borderRadius: 2,
    transition: 'width 0.3s ease'
  }} />
</div>
```

---

## 5. Sidebar — Grouped Sections

Ganti flat list menjadi grouped dengan section header.

```
PENDAHULUAN
  01  Cover
  02  Agenda Presentasi
  03  BAB I - Pendahuluan

TINJAUAN
  09  BAB II - Tinjauan Pustaka
  10  Tinjauan Pustaka dan Algoritma
  ...

METODOLOGI         ← section aktif
  28  Repair dan Post-Processing   ← item aktif
  29  Representasi Jadwal
  ...
```

### CSS untuk Item Aktif
```css
.slide-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 6px;
  margin: 1px 6px;
  transition: background 0.15s;
}

.slide-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.slide-item.active {
  background: rgba(20, 184, 166, 0.12); /* teal accent */
  color: #14B8A6;
}

.section-header {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #9d9d9f;
  padding: 12px 12px 4px;
}
```

---

## 6. Command Palette — Spotlight Style

### Fix Word Wrap (bug utama)
```css
.command-item-title {
  font-size: 13px;
  white-space: nowrap;        /* ← ini yang fix word wrap */
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
```

### Struktur Layout yang Benar
```
┌─────────────────────────────────────────────────────┐
│  🔍  Cari slide, draft, asset, atau command...      │
├─────────────────────────────────────────────────────┤
│  ACTIONS                                            │
│  ⚡  Toggle Fullscreen               F / Shift+F   │
│                                                     │
│  SLIDES                                             │
│  □  28 — Repair dan Post-Processing Konflik    ↵   │  ← aktif
│  □  29 — Representasi Jadwal sebagai Kromosom       │
│  □  33 — Menjaga Keragaman Populasi                 │
├─────────────────────────────────────────────────────┤
│  ↑↓ navigasi   ↵ pilih   Esc tutup                 │  ← footer hint
└─────────────────────────────────────────────────────┘
```

### Gunakan Ikon Berbeda per Tipe
```jsx
const iconMap = {
  action: <Zap size={14} />,     // action/command
  slide:  <Layout size={14} />,  // slide navigation
  asset:  <Image size={14} />,   // asset/gambar
  draft:  <FileText size={14} /> // draft/catatan
}
```

### Footer Keyboard Hint
```jsx
<div className="command-footer">
  <span><kbd>↑↓</kbd> navigasi</span>
  <span><kbd>↵</kbd> pilih</span>
  <span><kbd>Esc</kbd> tutup</span>
</div>
```

```css
.command-footer {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  background: rgba(246, 246, 248, 0.6);
}

kbd {
  font-size: 10px;
  background: rgba(0, 0, 0, 0.06);
  border: 0.5px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  padding: 1px 5px;
  font-family: monospace;
}
```

---

## 7. Settings — System Preferences Layout

Tambahkan sidebar navigasi di kiri, konten di kanan.

```
┌────────────┬──────────────────────────────────────┐
│ 🎨 Tampilan│  TEMA & FONT                         │
│ ⌨ Pintasan │  ┌─────────────────────────────────┐ │
│ 📽 Presenter│  │ Tema          Light Academic  ▾ │ │
│ ↓ Export   │  │ Font          Rounded         ▾ │ │
│ ↺ Reset    │  │ Warna Aksen   ● #14B8A6         │ │
│            │  └─────────────────────────────────┘ │
│            │  PRESENTER                           │
│            │  ┌─────────────────────────────────┐ │
│            │  │ Dual Screen Mode          ●○    │ │
│            │  │ Tampilkan Timer           ●○    │ │
│            │  └─────────────────────────────────┘ │
└────────────┴──────────────────────────────────────┘
```

### macOS-style Form Row
```css
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px;
  background: rgba(0, 0, 0, 0.03);
  border: 0.5px solid rgba(0, 0, 0, 0.08);
}

/* Kelompokan rows dengan border-radius atas dan bawah */
.settings-group .settings-row:first-child { border-radius: 8px 8px 0 0; }
.settings-group .settings-row:last-child  { border-radius: 0 0 8px 8px; }
.settings-group .settings-row:only-child  { border-radius: 8px; }
```

### Toggle Switch (macOS style)
```css
.mac-toggle {
  width: 34px;
  height: 20px;
  border-radius: 10px;
  background: #e5e5ea;
  position: relative;
  transition: background 0.2s;
  cursor: pointer;
}

.mac-toggle.on {
  background: #14B8A6;
}

.mac-toggle::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.mac-toggle.on::after {
  transform: translateX(14px);
}
```

---

## 8. Inspector Panel — Segmented Control

Ganti tabs biasa dengan segmented control pill.

```jsx
<div className="segmented-control">
  {['Layers', 'Assets', 'Draft', 'Refs'].map(tab => (
    <button
      key={tab}
      className={`seg-btn ${activeTab === tab ? 'active' : ''}`}
      onClick={() => setActiveTab(tab)}
    >
      {tab}
    </button>
  ))}
</div>
```

```css
.segmented-control {
  display: flex;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 2px;
  gap: 1px;
  margin: 10px;
}

.seg-btn {
  flex: 1;
  font-size: 11px;
  padding: 4px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #6e6e73;
  cursor: pointer;
  transition: all 0.15s;
}

.seg-btn.active {
  background: white;
  color: #1c1c1e;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
```

---

## 9. Warna & Tokens Keseluruhan

```css
:root {
  /* macOS System Colors */
  --color-traffic-red:    #FF5F57;
  --color-traffic-yellow: #FEBC2E;
  --color-traffic-green:  #28C840;
  --color-accent:         #14B8A6; /* teal, pertahankan */
  --color-macos-blue:     #007AFF;

  /* Text */
  --color-label-primary:   #1C1C1E;
  --color-label-secondary: #6E6E73;
  --color-label-tertiary:  #9D9D9F;

  /* Surfaces */
  --color-surface-primary:   rgba(255, 255, 255, 0.72);
  --color-surface-secondary: rgba(246, 246, 248, 0.85);
  --color-surface-tertiary:  rgba(242, 242, 247, 0.9);

  /* Borders */
  --color-separator:   rgba(0, 0, 0, 0.08);
  --color-border-dark: rgba(0, 0, 0, 0.15);

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
}
```

---

## 10. Animasi & Micro-interactions

### Modal Masuk (spring feel)
```css
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-enter {
  animation: modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Command Palette Masuk
```css
@keyframes spotlight-in {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Hover pada Slide Item
```css
.slide-item {
  transition: background 0.1s ease, transform 0.1s ease;
}

.slide-item:active {
  transform: scale(0.98);
}
```

---

## Checklist Implementasi

- [ ] Tambah font stack `-apple-system` ke `body`
- [ ] Buat CSS variable `--color-surface-*` untuk glass layers
- [ ] Terapkan `backdrop-filter: blur()` ke sidebar, modal, toolbar
- [ ] Tambah `TrafficLights` component di titlebar dan modals
- [ ] Pisah toolbar jadi dua layer (titlebar + breadcrumb bar)
- [ ] Tambah progress bar tipis di breadcrumb bar
- [ ] Ubah sidebar list jadi grouped dengan section headers
- [ ] Fix word wrap di command palette (`white-space: nowrap`)
- [ ] Tambah ikon berbeda per tipe di command palette
- [ ] Tambah keyboard hint footer di command palette
- [ ] Redesign settings dengan sidebar navigasi kiri
- [ ] Ubah inspector tabs jadi segmented control
- [ ] Implementasi macOS toggle switch
- [ ] Tambah animasi masuk untuk modal & command palette