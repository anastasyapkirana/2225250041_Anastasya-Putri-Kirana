# Metika — Aplikasi Belajar Barisan Aritmetika (SMP Kelas VIII)

Aplikasi web progresif (**PWA**) untuk materi **Barisan Aritmetika (pola, beda, suku ke-n)**. Aplikasi ini dirancang dengan **Cognitive Load Theory** (mengelola beban intrinsik, menekan beban ekstrinsik, mendorong beban germane) dan bertujuan **menumbuhkan literasi matematika** siswa.

- Berjalan di **browser** (HP dan laptop) dan **bisa di-install ke layar utama Android** tanpa Play Store/App Store.
- Tetap bisa dipakai **offline** setelah dibuka pertama kali.
- Teknologi: **Python (FastAPI)** untuk backend dan **JavaScript (vanilla, ES Modules)** untuk frontend.

## Peta Dokumen Perencanaan

| File | Isi |
|---|---|
| [PRD.md](PRD.md) | Product Requirements Document: tujuan, pengguna, fitur, kebutuhan non-fungsional |
| [CLAUDE.md](CLAUDE.md) | Panduan kerja untuk Claude Code / developer saat membangun aplikasi |
| [docs/01-analisis-kebutuhan.md](docs/01-analisis-kebutuhan.md) | Ringkasan wawancara S01 → temuan → keputusan fitur (traceability) |
| [docs/02-desain-pembelajaran.md](docs/02-desain-pembelajaran.md) | Strategi pedagogis: CLT, literasi matematika (PISA), alur belajar, hint, umpan balik |
| [docs/03-konten-materi.md](docs/03-konten-materi.md) | Storyboard isi modul, contoh soal, bank soal, miskonsepsi |
| [docs/04-design-system.md](docs/04-design-system.md) | Palet warna, tipografi, komponen UI, layar-layar utama |
| [docs/05-arsitektur-teknis.md](docs/05-arsitektur-teknis.md) | Stack, struktur folder, API, model data, PWA/offline, deployment |
| [docs/06-roadmap.md](docs/06-roadmap.md) | Tahapan ADDIE, milestone pengembangan, checklist |
| [docs/07-rencana-evaluasi.md](docs/07-rencana-evaluasi.md) | Uji fitur, validasi ahli, angket beban kognitif, pretest–posttest |

## Status

Analysis ✅ · Design ✅ · **Development ✅ (MVP v1.0)**. Berikutnya: validasi ahli dan uji coba (lihat [docs/06-roadmap.md](docs/06-roadmap.md)).

## Menjalankan di Laptop

```bash
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

- Buka **http://localhost:8000** di laptop.
- Di HP (Wi-Fi yang sama): buka **http://IP-LAPTOP:8000** (cek IP dengan `ipconfig`). Mode offline dan tombol "Pasang aplikasi" hanya aktif lewat HTTPS atau localhost, jadi untuk install di HP pakai link hasil deploy.
- Aktifkan ekspor data: set env `ADMIN_TOKEN`, lalu `GET /api/admin/export.csv?table=events` dengan header `Authorization: Bearer <token>`.

## Satu File HTML (tanpa server, tanpa internet)

```bash
python scripts/build_single_html.py   # menghasilkan dist/metika.html (± 350 KB)
```

- Klik dua kali `dist/metika.html` untuk membukanya di Chrome/Edge. File ini bisa dikirim lewat WhatsApp, Google Drive, atau flashdisk.
- Semua materi, latihan, game, dan kuis berjalan. Progres siswa tersimpan di browser masing-masing.
- Batasan: data penelitian **tidak** terkirim ke server, dan file ini tidak bisa di-"Instal" sebagai aplikasi. Untuk itu, pakai server lokal atau hasil deploy.
- Jalankan ulang perintah di atas setiap kali kode atau konten berubah.

## Deploy (link HTTPS permanen, gratis)

1. Push folder ini ke GitHub.
2. Buka render.com → **New + → Blueprint** → pilih repo. File [render.yaml](render.yaml) sudah disiapkan (ADMIN_TOKEN dibuat otomatis).
3. Setelah selesai, buka `https://metika-xxxx.onrender.com` di Chrome Android → menu ⋮ → **Instal aplikasi**.

> Paket gratis Render menghapus database saat server restart. Ekspor CSV secara rutin selama masa uji coba.

## Pengujian

```bash
python scripts/validate_content.py   # validasi semua soal (9 template × 200 sampel acak)
pytest                               # 44 test backend + konten
node --test "frontend/tests/*.test.mjs"   # 10 test engine JS (generator, checker, miskonsepsi)
python scripts/analyze_results.py    # olah data uji coba (akurasi, miskonsepsi, beban, N-gain)
```

## Struktur Kode

| Folder | Isi |
|---|---|
| `content/` | Semua materi, template soal, kuis, tes, angket (JSON) — ubah konten di sini |
| `backend/app/` | FastAPI: API konten, penerimaan data penelitian, ekspor CSV, solver Python |
| `frontend/js/engine/` | Logika murni: parser ekspresi, generator soal, pemeriksa + miskonsepsi |
| `frontend/js/components/` | Kartu soal, kuis, ruang kerja soal cerita, visual pola, Kartu Rumus |
| `frontend/js/views/` | Satu file per layar |
| `scripts/` | Validasi konten, pembuat ikon, analisis hasil |
