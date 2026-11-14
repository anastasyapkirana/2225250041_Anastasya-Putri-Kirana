# 04 — Design System

Gaya visual mengikuti referensi (kartu putih membulat, cincin progres, kartu folder berwarna pastel, flashcard dengan tombol ✕/✓, navigasi bawah dengan tombol tengah melayang) dan memakai palet **Ice & Butter**. Warna utama: **soft cobalt** dan **butter yellow**.

## 1. Palet Warna

### 1.1 Koreksi kode hex dari gambar palet

Pada gambar palet, label hex **bergeser satu kolom**. Contohnya, kolom "deep navy" berlabel #FFF7CC padahal warnanya navy gelap. Pasangan nama dan warna yang benar adalah:

| Nama | Hex benar | Hex tertulis di gambar |
|---|---|---|
| deep navy | `#2F4860` | #FFF7CC |
| clean white | `#FFFFFF` | #DCEEFF |
| soft cobalt | `#7DA7D9` | #7DA7D9 ✓ |
| butter yellow | `#FFF7CC` | #FFFFFF |
| ice blue | `#DCEEFF` | #2F4860 |

Jadi **butter yellow = `#FFF7CC`**. `#FFFFFF` adalah putih (clean white).

### 1.2 Token

```css
:root {
  /* Utama */
  --cobalt-500: #7DA7D9;   /* soft cobalt: warna merek, tombol utama, cincin progres */
  --butter-300: #FFF7CC;   /* butter yellow: latar hangat, kartu hint, sorotan b */

  /* Pendukung dari palet */
  --navy-900:  #2F4860;    /* teks utama, ikon */
  --white:     #FFFFFF;    /* permukaan kartu */
  --ice-100:   #DCEEFF;    /* latar aplikasi, kartu sekunder */

  /* Turunan (untuk kontras dan state) */
  --cobalt-700: #3F6FA8;   /* link/teks cobalt di atas putih (5.2:1) */
  --cobalt-800: #345E91;   /* teks cobalt di atas ice-100 (5.6:1) */
  --cobalt-100: #EAF2FB;   /* latar chip a, hover */
  --butter-500: #F5D96B;   /* aksen bintang, garis sorotan */
  --navy-600:  #5A6F85;    /* teks sekunder (≥ 4.5:1 di putih) */
  --line:      #D5E2F0;    /* garis/border */

  /* Semantik (tetap selaras pastel) */
  --success-600: #2F7D5B;  --success-100: #E3F4EA;
  --error-600:   #B5483E;  --error-100:   #FBE7E4;

  /* Peran */
  --bg:            var(--ice-100);
  --surface:       var(--white);
  --surface-warm:  var(--butter-300);
  --text:          var(--navy-900);
  --text-muted:    var(--navy-600);
  --primary:       var(--cobalt-500);
  --on-primary:    var(--navy-900);
  --link:          var(--cobalt-700);
}
```

### 1.3 Proporsi pemakaian (60–30–10)

- **60%** latar `ice-100` dan permukaan putih
- **30%** soft cobalt: tombol utama, progres, header modul, kartu folder
- **10%** butter yellow: hint, sorotan, bintang, kartu "Lanjutkan"

### 1.4 Kontras (WCAG 2.1)

| Kombinasi | Rasio | Boleh untuk |
|---|---|---|
| Navy di atas putih | 9.5 : 1 | Semua teks |
| Navy di atas butter | 8.8 : 1 | Semua teks |
| Navy di atas ice | 8.0 : 1 | Semua teks |
| Navy di atas cobalt-500 | 3.8 : 1 | **Hanya teks besar** (≥ 18,66 px tebal) dan ikon. Label tombol utama memakai 18 px tebal |
| Cobalt-500 di atas putih | 2.5 : 1 | **Bukan untuk teks.** Hanya isian, garis, dan ilustrasi |
| Cobalt-700 di atas putih | 5.2 : 1 | Link, teks aksen |
| Putih di atas cobalt-700 | 5.2 : 1 | Badge, tombol sekunder gelap |

### 1.5 Mode gelap (P2)

Opsional. Jika dibuat: latar `#1C2B3A`, permukaan `#2F4860`, teks `#EAF2FB`, primer tetap `#7DA7D9`, butter dipakai sebagai aksen teks.

## 2. Tipografi

- **Font:** *Nunito* (bulat, ramah, mudah dibaca anak; mirip referensi). Di-host sendiri (`woff2`, bobot 400/600/700/800) agar bisa offline.
- **Judul aplikasi/branding:** boleh *Fraunces* atau *DM Serif Display* (mengikuti judul serif di gambar palet). Hanya di splash/logo.
- Angka memakai `font-variant-numeric: tabular-nums` agar hitungan rapi.

| Token | Ukuran / tinggi baris | Bobot | Pemakaian |
|---|---|---|---|
| `--fs-display` | 32 / 38 | 800 | Angka besar di cincin progres, jawaban |
| `--fs-h1` | 24 / 30 | 800 | Judul layar |
| `--fs-h2` | 20 / 26 | 700 | Judul kartu |
| `--fs-body` | 17 / 26 | 400 | Teks materi (sedikit besar untuk HP) |
| `--fs-small` | 14 / 20 | 600 | Label, keterangan |
| `--fs-button` | 18 / 24 | 700 | Tombol |

Mode "Huruf besar" di pengaturan mengalikan semua ukuran ×1,15.

## 3. Spasi, Radius, Bayangan

```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-5: 24px; --space-6: 32px; --space-7: 48px;

--radius-sm: 10px;  --radius-md: 16px;  --radius-lg: 24px;  --radius-pill: 999px;

--shadow-card: 0 4px 16px rgba(47, 72, 96, 0.08);
--shadow-fab:  0 8px 24px rgba(47, 72, 96, 0.18);
```

- Gutter samping layar: **16 px**. Lebar konten maksimal **480 px** di tengah layar (desktop tetap tampil seperti HP + kartu lebih lebar).
- Target sentuh minimal **44 × 44 px**, tombol utama tinggi **52 px**.

## 4. Komponen

| Komponen | Spesifikasi singkat |
|---|---|
| **Tombol utama** | Latar cobalt-500, teks navy 18 px/700, radius pill, tinggi 52 px, lebar penuh |
| **Tombol sekunder** | Latar putih, border `--line`, teks navy |
| **Tombol bulat aksi** (seperti referensi) | Lingkaran 64 px: ✕ (error-600 di atas putih), ✓ (latar cobalt-500, ikon navy), 🔊/hint (putih) |
| **Kartu** | Putih, radius-lg, shadow-card, padding 16–20 px |
| **Kartu folder (Ulas Lagi)** | Bentuk folder dengan tab di pojok kanan atas. Variasi warna: cobalt-100, butter-300, ice-100, putih + border. Berisi judul, jumlah "12/30", dan "Terakhir dibuka" |
| **Cincin progres** | SVG, garis cobalt-500 di atas trek `--line`, angka tengah `--fs-display` |
| **Bilah progres modul** | Segmen per layar di atas halaman (seperti referensi tengah) |
| **Chip simbol** | `a` (latar cobalt-100), `b` (latar butter-300), `n` (garis bawah putus-putus), radius pill |
| **Kartu hint** | Latar butter-300, ikon 💡, teks navy, tombol "Petunjuk berikutnya" |
| **Lembar umpan balik** | Bottom sheet. Benar: latar success-100, ikon ✓, teks "Tepat!". Salah: latar error-100, ikon ✕ + pesan miskonsepsi |
| **Kartu Rumus** | Bottom sheet 70% tinggi. Rumus besar, chip simbol + arti, 1 contoh substitusi |
| **Input angka** | Tinggi 56 px, teks 24 px, `inputmode="numeric"`, tombol ± untuk negatif |
| **Navigasi bawah** | 5 slot: Beranda · Materi · **[FAB Latihan]** · Rumus · Profil. FAB lingkaran 64 px cobalt-500, terangkat di atas bar |
| **Visual pola** | SVG: titik/ubin/korek api, garis bilangan dengan busur lompatan "+b" berwarna butter-500 |

Ikon: set garis (stroke 2 px), mis. *Lucide*, disalin sebagai SVG lokal (bukan dari CDN).

## 5. Layar Utama (wireframe)

### 5.1 Beranda
```
┌──────────────────────────────┐
│ Halo! 👋            [⚙]      │
│ Metika                  │
│ ┌──────────────────────────┐ │
│ │      ╭──────────╮        │ │
│ │      │  Modul   │        │ │  cincin progres cobalt
│ │      │   3/6    │        │ │
│ │      ╰──────────╯        │ │
│ │  ★ 7 bintang   ✓ 42 benar│ │
│ └──────────────────────────┘ │
│ ┌ Lanjutkan ───────────────┐ │  kartu butter
│ │ Modul 3 · Menemukan Rumus│ │
│ └──────────────────── ▶ ───┘ │
│ Ulas lagi                    │
│ ┌──────────┐ ┌──────────┐    │  kartu folder
│ │Sering    │ │Soal sulit│    │
│ │tertukar  │ │ 4        │    │
│ └──────────┘ └──────────┘    │
├──────────────────────────────┤
│ 🏠   📚    (✏️)    📘   👤  │
└──────────────────────────────┘
```

### 5.2 Halaman Latihan (mengikuti flashcard referensi)
```
┌──────────────────────────────┐
│ ✕  ▓▓▓▓▓░░░░░   3/8          │
│ ┌──────────────────────────┐ │
│ │ Barisan 5, 8, 11, 14, …  │ │
│ │ Tentukan U₁₀.            │ │
│ │                          │ │
│ │  [a ▢] [b ▢] [n ▢]       │ │  opsional di T-identify
│ │  U₁₀ = [ ______ ]        │ │
│ │                          │ │
│ │ 💡 Petunjuk   🔁 Cek     │ │
│ └──────────────────────────┘ │
│   (📘)      ( ✓ Periksa )    │
└──────────────────────────────┘
```

### 5.3 Ruang Kerja Soal Cerita
```
┌──────────────────────────────┐
│ ← Soal Cerita     Langkah 2/5│
│ ┌ Cerita ──────────────────┐ │  bisa diciutkan
│ │ Baris pertama 12 kursi…  │ │  kata kunci ter-highlight
│ └──────────────────────────┘ │
│ ① Diketahui     ✓            │
│ ② Ditanya       ● sekarang   │
│   "Apa yang ditanyakan?"     │
│   ( ) Jumlah semua kursi     │
│   (•) Kursi di baris ke-15   │
│ ③ Ubah ke barisan  ○         │
│ ④ Hitung           ○         │
│ ⑤ Periksa & tafsir ○         │
│         [ Lanjut ]           │
└──────────────────────────────┘
```

### 5.4 Daftar layar lengkap

| # | Layar | Rute |
|---|---|---|
| 1 | Splash + onboarding (3 kartu, bisa dilewati) | `#/welcome` |
| 2 | Isi kode kelas + no. absen | `#/join` |
| 3 | Beranda | `#/` |
| 4 | Peta Belajar (6 modul) | `#/modules` |
| 5 | Halaman materi / contoh / latihan modul | `#/m/:id/:step` |
| 6 | Ruang Kerja Soal Cerita | `#/story/:qid` |
| 7 | Latihan bebas (FAB) | `#/practice` |
| 8 | Kuis modul + hasil | `#/quiz/:id` |
| 9 | Tantangan kartu ✕/✓ | `#/challenge` |
| 10 | Ulas Lagi (folder) | `#/review/:folder` |
| 11 | Kartu Rumus (sheet, bisa juga halaman) | `#/formula` |
| 12 | Profil & Pengaturan | `#/profile` |
| 13 | Survei beban (sheet) | — |

## 6. Gerak dan Suara

- Transisi halaman 200 ms *ease-out*. Animasi visual pola maksimal 1,2 detik dan bisa diulang.
- `@media (prefers-reduced-motion: reduce)`: matikan semua animasi non-esensial.
- Suara efek benar/salah pendek (< 0,5 detik), **mati secara default** (bisa dinyalakan).

## 7. Ikon Aplikasi dan Manifest

- Ikon: lingkaran cobalt-500 dengan bintang empat sudut butter-300 (motif dari gambar palet) dan tanda "+b" kecil. Ukuran 192, 512, dan *maskable* 512.
- `theme_color`: `#7DA7D9` · `background_color`: `#DCEEFF`.
