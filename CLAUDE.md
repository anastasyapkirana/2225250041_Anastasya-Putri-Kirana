# CLAUDE.md — Panduan Membangun Metika

File ini dibaca Claude Code (dan developer manusia) sebelum menulis kode. Ikuti aturan di sini. Kalau ada konflik, urutan prioritasnya: **CLAUDE.md > PRD.md > docs/**.

## Ringkasan Proyek

PWA pembelajaran **Barisan Aritmetika** untuk siswa SMP kelas VIII. Tujuannya mengurangi beban kognitif yang tidak perlu dan menumbuhkan literasi matematika. Proyek ini mengikuti ADDIE. Kebutuhan berasal dari wawancara siswa (lihat [docs/01-analisis-kebutuhan.md](docs/01-analisis-kebutuhan.md)).

Dokumen acuan:
- Kebutuhan produk: [PRD.md](PRD.md)
- Pedagogi: [docs/02-desain-pembelajaran.md](docs/02-desain-pembelajaran.md)
- Isi materi dan soal: [docs/03-konten-materi.md](docs/03-konten-materi.md)
- UI dan warna: [docs/04-design-system.md](docs/04-design-system.md)
- Arsitektur: [docs/05-arsitektur-teknis.md](docs/05-arsitektur-teknis.md)
- Urutan kerja: [docs/06-roadmap.md](docs/06-roadmap.md)

## Stack (jangan diganti tanpa persetujuan)

- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2, SQLite (modul `sqlite3` bawaan atau SQLModel), pytest.
- **Frontend:** HTML, CSS, **JavaScript vanilla (ES Modules)**. **Tanpa** React/Vue/bundler/npm build. Tanpa CDN saat runtime (harus offline). Font di-host sendiri.
- **PWA:** `manifest.webmanifest` + `sw.js` (ditulis manual, strategi cache-first untuk app shell dan konten).
- **Test JS:** `node --test` (Node 20+) untuk modul murni di `frontend/js/engine/`.

## Perintah

```bash
# setup (sekali)
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements.txt

# jalankan dev server (melayani frontend + API) di http://localhost:8000
uvicorn backend.app.main:app --reload

# validasi semua konten soal
python scripts/validate_content.py

# test
pytest backend/tests
node --test frontend/tests
```

Untuk uji di HP saat development: jalankan `uvicorn ... --host 0.0.0.0`, buka `http://<IP-laptop>:8000` dari HP di Wi-Fi yang sama. Service worker hanya aktif di `localhost` atau HTTPS, jadi uji install/offline lewat deploy HTTPS atau port forwarding `chrome://inspect`.

## Struktur Folder

```
backend/app/          FastAPI: main.py, config.py, db.py, routers/, services/
backend/tests/        pytest
content/              Sumber kebenaran materi & soal (JSON) + schema
frontend/             PWA statis: index.html, sw.js, manifest, css/, js/, assets/
frontend/js/engine/   Logika murni (generator, checker, hints, misconceptions) — tanpa DOM
frontend/js/views/    Satu file per layar
frontend/js/components/  Komponen UI kecil yang dipakai ulang
scripts/              validate_content.py, build_icons, dll.
docs/                 Dokumen perencanaan
```

## Aturan Desain Pembelajaran (WAJIB, ini inti proyek)

Aturan ini menerjemahkan Cognitive Load Theory menjadi batasan yang bisa dicek. Fitur yang melanggarnya dianggap bug.

1. **Satu konsep per halaman.** Teks penjelasan ≤ 60 kata per halaman materi. (DS.05, EL.02)
2. **Instruksi ≤ 12 kata, satu kalimat.** Tidak ada paragraf instruksi. (DS.04)
3. **Teks dan visual yang terkait diletakkan berdekatan** (split-attention). Label langsung di gambar, bukan legenda terpisah.
4. **Tidak ada elemen dekoratif yang bergerak** di halaman soal. Animasi hanya untuk menjelaskan konsep (visual pola). Hormati `prefers-reduced-motion`.
5. **Contoh dulu, lalu soal.** Urutan tiap modul: materi → contoh bertahap (≥ 3) → contoh memudar → latihan → literasi → kuis. (EL.01, GL.03)
6. **Hint bertingkat 3 level, tidak pernah langsung memberi jawaban di level 1–2.** Level 3 = langkah parsial dengan isian kosong. (DS.01)
7. **Umpan balik salah harus spesifik**: sebutkan kemungkinan penyebab (lihat daftar miskonsepsi di `frontend/js/engine/misconceptions.js`) dalam ≤ 2 kalimat. Jangan hanya "Salah, coba lagi".
8. **Kartu Rumus selalu bisa dibuka** dari tombol tetap. Isinya: Uₙ = a + (n − 1)b, arti setiap simbol, dan satu contoh substitusi. (IL.01)
9. **Soal cerita memakai ruang kerja 5 langkah**: Diketahui → Ditanya → Ubah ke barisan → Hitung → Periksa dan tafsirkan. (IL.04, EL.04)
10. **Tidak ada timer wajib, tidak ada leaderboard.** Timer hanya di Kuis Cepat dan selalu bisa dimatikan.
11. **Konsistensi notasi:** `Uₙ`, `a` = suku pertama, `b` = beda, `n` = nomor suku. Tampilkan subskrip dengan `<sub>`. Bilangan desimal memakai koma, ribuan memakai titik (format Indonesia, `Intl.NumberFormat('id-ID')`).

## Aturan UI

- Token warna, spasi, dan radius **hanya** dari `frontend/css/tokens.css`. Jangan menulis hex langsung di komponen.
- Warna utama: **soft cobalt `#7DA7D9`** dan **butter yellow `#FFF7CC`**. Teks: deep navy `#2F4860`. Lihat [docs/04-design-system.md](docs/04-design-system.md).
- Cobalt `#7DA7D9` **tidak boleh** dipakai untuk teks kecil di atas putih (kontras ±2.5:1). Untuk link/teks cobalt pakai `--cobalt-700` (`#3F6FA8`). Label tombol di atas cobalt-500 memakai teks navy ≥ 18px tebal.
- Mobile-first: rancang di 360 px dulu. Target sentuh ≥ 44 px. Input angka memakai `inputmode="numeric"` (izinkan tanda minus).
- Semua teks UI dalam Bahasa Indonesia. Identifier kode dalam Bahasa Inggris.

## Aturan Kode

- **Python:** type hints, Pydantic untuk semua skema request/response, format dengan `ruff format`, lint `ruff check`. Fungsi solver murni dan diuji.
- **JavaScript:** ES Modules, `const`/`let`, tanpa variabel global kecuali `window.__APP_VERSION__`. Logika di `engine/` harus murni (tanpa DOM) agar bisa dites di Node.
- Semua akses `localStorage`/IndexedDB dibungkus `try/catch` lewat `js/store.js`. App harus tetap jalan kalau storage gagal.
- Konten (teks materi, soal) **tidak di-hardcode di JS**. Konten ada di `content/*.json` dan dimuat lewat API atau cache.
- Setiap perubahan konten wajib lolos `python scripts/validate_content.py`.
- Naikkan `CACHE_VERSION` di `sw.js` setiap kali aset frontend atau konten berubah.

## Privasi dan Etika

- Jangan pernah meminta atau menyimpan nama, email, nomor HP, foto, atau lokasi siswa.
- Identitas cukup `class_code` + `student_no` → di-hash menjadi `anon_id` di klien.
- Endpoint ekspor dilindungi token dari environment variable `ADMIN_TOKEN`. Jangan commit token.
- Tanpa analytics atau pelacak pihak ketiga.

## Definition of Done (per fitur)

- [ ] Memenuhi aturan desain pembelajaran di atas
- [ ] Berfungsi di lebar 360 px dan di desktop
- [ ] Berfungsi offline (jika fitur siswa)
- [ ] Test unit untuk logika (engine/solver) lulus
- [ ] Kontras warna lolos AA
- [ ] Tercantum di tabel traceability [docs/01-analisis-kebutuhan.md](docs/01-analisis-kebutuhan.md) bila fitur baru

## Yang Jangan Dilakukan

- Jangan menambah framework/dependensi frontend.
- Jangan menulis instruksi panjang atau teks materi panjang di UI.
- Jangan memakai warna sebagai satu-satunya penanda benar/salah (sertakan ikon dan teks).
- Jangan membuat fitur di luar lingkup PRD tanpa bertanya.
