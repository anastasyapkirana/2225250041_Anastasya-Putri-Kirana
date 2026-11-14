# 05 — Arsitektur Teknis

## 1. Gambaran Umum

```
                    ┌────────────────── HP / Browser siswa ──────────────────┐
                    │  PWA (HTML + CSS + JS ES Modules)                       │
                    │   ├─ views/  (layar)                                    │
                    │   ├─ engine/ (generator soal, checker, hint, miskonsepsi)│
                    │   ├─ store.js  → IndexedDB/localStorage (progres, antrean)│
                    │   └─ sw.js  (Service Worker: cache app shell + konten)  │
                    └───────────────┬─────────────────────────────────────────┘
                                    │ HTTPS (hanya saat online)
                    ┌───────────────▼─────────────────────────────────────────┐
                    │  Backend Python — FastAPI                               │
                    │   ├─ GET  /            → file statis frontend           │
                    │   ├─ GET  /api/content → modul & template soal (JSON)   │
                    │   ├─ POST /api/events  → log aktivitas anonim (batch)   │
                    │   ├─ POST /api/surveys → skor survei beban              │
                    │   └─ GET  /api/admin/export.csv (token)                 │
                    │  SQLite (data penelitian)    content/*.json (materi)    │
                    └─────────────────────────────────────────────────────────┘
```

**Prinsip:** *offline-first*. Semua fitur belajar berjalan di klien. Server hanya (1) mengirim file dan konten pertama kali, dan (2) menerima data penelitian saat online. Jika server mati, siswa tetap bisa belajar.

### Pembagian peran Python dan JavaScript

| Bahasa | Tanggung jawab |
|---|---|
| **Python** | Server web dan API (FastAPI), validasi skema konten (Pydantic), **solver referensi** dan validator semua soal (`scripts/validate_content.py`), penyimpanan dan ekspor data penelitian (SQLite → CSV), skrip analisis hasil uji (mis. N-gain, rata-rata skor beban) |
| **JavaScript** | Seluruh antarmuka, router, generator soal acak, pengecekan jawaban dan deteksi miskonsepsi, hint, visualisasi SVG, service worker (offline), sinkronisasi antrean event |

## 2. Struktur Folder

```
metika/
├─ CLAUDE.md  PRD.md  README.md
├─ requirements.txt            # fastapi, uvicorn[standard], pydantic, pytest, httpx, ruff
├─ .env.example                # ADMIN_TOKEN=, DATABASE_URL=sqlite:///data/app.db
├─ docs/
├─ content/
│  ├─ schema/                  # JSON Schema (diekspor dari model Pydantic)
│  ├─ modules/m1.json … m6.json
│  ├─ questions/m1.json … m6.json, challenge.json, pretest.json
│  └─ misconceptions.json
├─ backend/
│  ├─ app/
│  │  ├─ main.py               # buat app, mount static, include routers
│  │  ├─ config.py             # baca env
│  │  ├─ db.py                 # koneksi SQLite + init tabel
│  │  ├─ schemas.py            # Pydantic: Module, Page, QuestionTemplate, Event, Survey
│  │  ├─ routers/
│  │  │  ├─ content.py
│  │  │  ├─ events.py
│  │  │  └─ admin.py
│  │  └─ services/
│  │     ├─ content_loader.py  # muat + cache + validasi JSON
│  │     └─ solver.py          # evaluator ekspresi aman (ast), hitung jawaban
│  └─ tests/
│     ├─ test_solver.py
│     ├─ test_content.py       # semua template menghasilkan jawaban valid
│     └─ test_api.py
├─ frontend/
│  ├─ index.html
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  ├─ assets/{icons,fonts,img,sfx}/
│  ├─ css/
│  │  ├─ tokens.css            # semua variabel desain
│  │  ├─ base.css              # reset, tipografi, layout
│  │  └─ components.css
│  ├─ js/
│  │  ├─ app.js                # bootstrap, registrasi SW, prompt install
│  │  ├─ router.js             # hash router
│  │  ├─ store.js              # wrapper storage (try/catch), skema progres
│  │  ├─ api.js                # fetch konten, sinkron antrean event
│  │  ├─ format.js             # Intl id-ID, subskrip
│  │  ├─ engine/
│  │  │  ├─ expr.js            # parser ekspresi aman (pasangan solver.py)
│  │  │  ├─ generator.js       # template + RNG ber-seed → soal
│  │  │  ├─ checker.js         # cek jawaban + cocokkan miskonsepsi
│  │  │  ├─ hints.js
│  │  │  └─ mastery.js         # bintang, kriteria lewati contoh
│  │  ├─ components/           # button, card, sheet, numpad, progress-ring, pattern-viz, folder-card
│  │  └─ views/                # home, modules, lesson, practice, story, quiz, challenge, review, formula, profile, join
│  └─ tests/                   # node --test untuk engine/
└─ scripts/
   ├─ validate_content.py
   ├─ export_schema.py
   └─ analyze_results.py       # olah CSV hasil uji coba
```

## 3. Model Data

### 3.1 Konten (JSON, sumber kebenaran)

```jsonc
// content/modules/m4.json
{
  "id": "m4",
  "order": 4,
  "title": "Memakai Rumus",
  "goal": "Menentukan a, b, n lalu menghitung Uₙ",
  "steps": [
    { "kind": "hook",     "text": "…", "visual": null },
    { "kind": "concept",  "text": "…(≤60 kata)", "visual": "number-line:5,3,4" },
    { "kind": "example",  "problem": "…", "steps": ["…", "…", "…"] },
    { "kind": "faded",    "problem": "…", "steps": ["…", {"blank": "42"}, {"blank": "46"}] },
    { "kind": "practice", "templates": ["T-identify", "T-un"], "count": 6 },
    { "kind": "literacy", "questions": ["L3"] },
    { "kind": "quiz",     "questions": ["Q4-1", "Q4-2", "Q4-3", "Q4-4", "Q4-5"] }
  ]
}
```

Pydantic memvalidasi: panjang teks (≤ 60 kata untuk `concept`, ≤ 12 kata untuk instruksi), ID soal ada, ekspresi `answer` aman, dan setiap `blank` sesuai hasil solver.

### 3.2 Data lokal di klien (IndexedDB, *object store*)

| Store | Kunci | Isi |
|---|---|---|
| `profile` | `"me"` | `{ anonId, classCode, joinedAt, settings: { fontScale, sound } }` |
| `progress` | `moduleId` | `{ stepIndex, completed, stars, quizScore, lastOpened }` |
| `attempts` | auto | `{ qid, templateId, params, answer, correct, misconception, hintLevel, ms, ts }` |
| `review` | `qid` | `{ folder: "confused" \| "hard" \| "flagged", addedAt, params }` |
| `outbox` | auto | event yang belum terkirim ke server |

`anonId` = SHA-256(`classCode` + `studentNo` + salt aplikasi), dipotong 16 karakter. Nama tidak pernah diminta.

### 3.3 Database server (SQLite)

```sql
CREATE TABLE participants (
  anon_id     TEXT PRIMARY KEY,
  class_code  TEXT NOT NULL,
  first_seen  TEXT NOT NULL,
  app_version TEXT
);

CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   TEXT UNIQUE,          -- UUID dari klien, mencegah duplikat saat kirim ulang
  anon_id     TEXT NOT NULL REFERENCES participants(anon_id),
  type        TEXT NOT NULL,        -- step_view | answer | hint | quiz_done | module_done | install
  module_id   TEXT,
  item_id     TEXT,
  payload     TEXT,                 -- JSON
  client_ts   TEXT NOT NULL,
  server_ts   TEXT NOT NULL
);

CREATE TABLE surveys (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   TEXT UNIQUE,
  anon_id     TEXT NOT NULL,
  kind        TEXT NOT NULL,        -- mental_effort | cl_questionnaire | practicality
  module_id   TEXT,
  answers     TEXT NOT NULL,        -- JSON
  client_ts   TEXT NOT NULL
);
```

## 4. API

| Metode | Path | Deskripsi | Body / Respons |
|---|---|---|---|
| GET | `/api/health` | Cek server | `{ "status": "ok", "version": "…" }` |
| GET | `/api/content/manifest` | Versi konten + daftar file | `{ "version": "2026.11.1", "modules": [...] }` |
| GET | `/api/content/modules/{id}` | Satu modul | Module |
| GET | `/api/content/questions/{module}` | Template soal modul | `QuestionTemplate[]` |
| POST | `/api/participants` | Daftar `anon_id` | `{ anon_id, class_code, app_version }` |
| POST | `/api/events` | Kirim batch event (≤ 200) | `{ events: Event[] }` → `{ accepted, duplicates }` |
| POST | `/api/surveys` | Kirim survei | Survey |
| GET | `/api/admin/export.csv?table=events` | Ekspor data | Header `Authorization: Bearer <ADMIN_TOKEN>` |

- CORS: hanya origin aplikasi sendiri.
- Rate limit sederhana per IP di endpoint POST.
- Semua input divalidasi Pydantic. Payload ≤ 64 KB.

## 5. PWA dan Offline

### Manifest (inti)
```json
{
  "name": "Metika — Barisan Aritmetika",
  "short_name": "Metika",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#DCEEFF",
  "theme_color": "#7DA7D9",
  "lang": "id",
  "icons": [
    { "src": "/assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/assets/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Strategi cache di `sw.js`

| Jenis | Strategi |
|---|---|
| App shell (HTML, CSS, JS, font, ikon) | **Precache** saat `install`, kunci `CACHE_VERSION` |
| Konten (`/api/content/*`) | **Stale-while-revalidate**: tampilkan cache, perbarui diam-diam |
| `POST /api/events`, `/api/surveys` | Tidak di-cache. Jika gagal, tetap di `outbox` dan dikirim ulang saat event `online` atau saat app dibuka |
| Lainnya | Network-first, fallback ke cache |

### Pemasangan di Android
1. Siswa membuka URL di Chrome.
2. App menangkap `beforeinstallprompt` lalu menampilkan tombol **"Pasang aplikasi"** di Beranda/Profil.
3. Di iOS Safari: tampilkan petunjuk 1 baris "Bagikan → Tambah ke Layar Utama".

### (Opsional) APK tanpa Play Store
Jika guru/sekolah butuh file `.apk`: bungkus PWA dengan **Trusted Web Activity** memakai PWABuilder atau Bubblewrap, lalu bagikan APK untuk di-*sideload*. Ini tidak wajib karena PWA sudah bisa di-install.

## 6. Keamanan dan Privasi

- Tidak ada data pribadi (lihat CLAUDE.md).
- Evaluasi ekspresi soal **tanpa `eval`**: JS memakai parser sendiri (`expr.js`), Python memakai `ast` dengan daftar node yang diizinkan.
- `ADMIN_TOKEN` hanya di environment server.
- Header keamanan: `Content-Security-Policy: default-src 'self'`, `X-Content-Type-Options: nosniff`.
- Aplikasi tetap berfungsi bila storage diblokir (mode tamu/privat), hanya progres tidak tersimpan.

## 7. Deployment

| Opsi | Kelebihan | Catatan |
|---|---|---|
| **Render (web service gratis)** | Mudah, HTTPS otomatis, mendukung Python | Server "tidur" saat idle. Aman karena app offline-first. Disk tidak permanen, jadi pakai *persistent disk* atau ekspor data rutin |
| Railway | Mudah, ada volume | Kuota gratis terbatas |
| PythonAnywhere | Gratis, SQLite permanen | Perlu adaptor ASGI atau ganti ke Flask jika ASGI tidak didukung paket gratis |

Rekomendasi: Render + ekspor CSV harian selama masa uji coba. Alternatif: frontend statis di GitHub Pages/Netlify dan backend terpisah (perlu CORS).

Langkah:
1. Push ke GitHub.
2. Build command: `pip install -r requirements.txt` · Start: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
3. Set env `ADMIN_TOKEN`.
4. Uji Lighthouse (PWA installable, Performance ≥ 90) di URL HTTPS.

## 8. Strategi Pengujian

| Lapisan | Alat | Cakupan minimal |
|---|---|---|
| Solver dan validasi konten | pytest | Semua template × 200 seed acak menghasilkan jawaban bilangan bulat/desimal valid sesuai batasan |
| Engine JS | `node --test` | `expr.js` = hasil `solver.py` untuk kasus yang sama (fixture JSON bersama). Checker mendeteksi M1–M8 |
| API | pytest + httpx `TestClient` | Validasi input, deduplikasi `client_id`, proteksi admin |
| Manual di perangkat | HP Android murah (360 px) + Chrome DevTools | Install, offline (mode pesawat), font besar, rotasi |
| Lighthouse | Chrome | Performance ≥ 90, Accessibility ≥ 95, PWA installable |

## 9. Catatan Implementasi v1.0 (perbedaan dari rancangan)

| Rancangan | Implementasi | Alasan |
|---|---|---|
| `anonId` = SHA-256 | Hash **cyrb53** (16 karakter heks) di `frontend/js/engine/anon.js` | `crypto.subtle` tidak tersedia di http jaringan lokal. Hasil harus sama di semua konteks. Tetap tidak menyimpan nama |
| IndexedDB | **localStorage** lewat `js/store.js` (dengan cadangan memori) | Data kecil, kode lebih sederhana. Tetap aman jika storage diblokir |
| Modul terkunci berurutan | **Semua modul terbuka**, ada penanda "Mulai di sini" | Memudahkan validator ahli dan guru. Urutan tetap disarankan |
| Konten via `/api/content/*` | Frontend memuat file statis `content/*.json`, API tetap tersedia | Frontend bisa di-host statis dan di-cache service worker |
| Bintang | ★1 semua langkah selesai · ★2 kuis ≥ 80% · ★3 latihan benar ≥ 70% | Kriteria jelas dan terukur |

Event yang dicatat: `app_open, step_view, answer, hint, check_calc, practice_done, story_step, quiz_done, module_done, challenge_done, test_done, install`.
