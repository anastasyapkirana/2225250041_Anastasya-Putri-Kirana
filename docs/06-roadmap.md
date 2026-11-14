# 06 — Roadmap (ADDIE)

## Ringkasan Tahap

| Tahap | Output | Status |
|---|---|---|
| **A — Analysis** | Hasil wawancara S01, matriks kebutuhan | ✅ Selesai (S01). ⏳ Tambah S02/S03, analisis kurikulum, analisis perangkat |
| **D — Design** | Dokumen ini (PRD, desain pembelajaran, konten, design system, arsitektur), wireframe, instrumen validasi | ✅ Draf. ⏳ Review dosen |
| **D — Development** | Aplikasi MVP + validasi ahli + revisi | ⏳ |
| **I — Implementation** | Uji coba terbatas, lalu uji coba lapangan | ⏳ |
| **E — Evaluation** | Evaluasi formatif (tiap tahap) dan sumatif | ⏳ |

## Tahap Design (sisa pekerjaan)

- [ ] Review dokumen bersama dosen pembimbing
- [ ] Wawancara S02 (+S03) dan isi tabel variasi di [01-analisis-kebutuhan.md](01-analisis-kebutuhan.md)
- [ ] Finalkan nama aplikasi dan ikon
- [ ] Mockup visual hi-fi 4 layar utama (Beranda, Materi, Latihan, Soal Cerita)
- [ ] Susun instrumen validasi ahli materi dan ahli media (lihat [07-rencana-evaluasi.md](07-rencana-evaluasi.md))
- [ ] Finalkan semua teks konten di [03-konten-materi.md](03-konten-materi.md)

## Tahap Development — Milestone

Estimasi untuk 1–2 orang, ±2 jam/hari. Setiap milestone diakhiri demo di HP.

### M0 — Fondasi (± 2 hari)
- [ ] `git init`, struktur folder, `requirements.txt`, `.env.example`, `.gitignore`
- [ ] FastAPI melayani `frontend/` + `/api/health`
- [ ] `tokens.css`, `base.css`, font Nunito lokal
- **Selesai jika:** halaman kosong bertema tampil di HP lewat Wi-Fi lokal

### M1 — App Shell & PWA (± 3 hari)
- [ ] Hash router, navigasi bawah 5 tab + FAB
- [ ] `manifest.webmanifest`, ikon, `sw.js` precache
- [ ] Tombol "Pasang aplikasi", halaman Join (kode kelas + no. absen → anonId)
- [ ] `store.js` dengan try/catch
- **Selesai jika:** bisa di-install di Android dan dibuka dalam mode pesawat

### M2 — Konten & Penampil Modul (± 4 hari)
- [ ] Skema Pydantic + `validate_content.py` + `content_loader.py`
- [ ] Endpoint konten + cache SW
- [ ] View lesson: hook, concept, example (buka langkah bertahap), faded
- [ ] Kartu Rumus (bottom sheet)
- [ ] Konten Modul 1–2 lengkap
- **Selesai jika:** Modul 1–2 bisa dipelajari dari awal sampai akhir, progres tersimpan

### M3 — Mesin Latihan (± 5 hari) ⭐
- [ ] `solver.py` + `expr.js` + fixture uji bersama
- [ ] `generator.js` (RNG ber-seed), `checker.js` + miskonsepsi M1–M8, `hints.js`
- [ ] View practice: input angka, hint 3 level, lembar umpan balik, Cek Hitungan
- [ ] Self-explanation (pilihan ganda)
- [ ] Konten Modul 3–4 + visual pola (garis bilangan lompatan, korek api)
- **Selesai jika:** soal `T-un` tak terbatas, M1–M4 terdeteksi dengan benar, semua test lulus

### M4 — Soal Cerita & Literasi (± 4 hari)
- [ ] Ruang Kerja 5 Langkah
- [ ] Pojok Literasi (soal tafsir/nalar, tabel, gambar)
- [ ] Konten Modul 5–6
- **Selesai jika:** soal C1–C3 dan L1–L6 bisa dikerjakan lengkap dengan langkah tafsir

### M5 — Kuis, Tantangan, Ulas Lagi, Beranda (± 3 hari)
- [ ] Kuis modul + pembahasan + bintang
- [ ] Mode Tantangan kartu ✕/✓
- [ ] Folder Ulas Lagi otomatis
- [ ] Beranda: cincin progres, statistik, "Lanjutkan"
- **Selesai jika:** alur PRD §8 berjalan penuh

### M6 — Data Penelitian (± 3 hari)
- [ ] Outbox event + sinkronisasi + deduplikasi
- [ ] Survei beban per modul, angket beban kognitif, angket kepraktisan
- [ ] Pretest/posttest (FR-22)
- [ ] Ekspor CSV admin + `analyze_results.py`
- **Selesai jika:** data dari 2 HP uji masuk ke server dan bisa diekspor

### M7 — Polishing & Rilis (± 3 hari)
- [ ] Aksesibilitas (kontras, fokus keyboard, label ARIA, huruf besar)
- [ ] `prefers-reduced-motion`, suara opsional
- [ ] Lighthouse ≥ 90/95, uji di 2–3 HP berbeda
- [ ] Deploy ke Render (HTTPS) + ADMIN_TOKEN
- [ ] (Opsional) APK via PWABuilder
- **Selesai jika:** URL publik siap untuk validasi ahli

### Validasi Ahli & Revisi (± 1–2 minggu)
- [ ] Validasi ahli materi, ahli media (dan ahli pembelajaran bila ada)
- [ ] Rekap saran, revisi, catat perubahan di changelog

## Tahap Implementation

1. **Uji coba perorangan (one-to-one):** 3 siswa, diamati langsung, think-aloud. Fokus pada kemudahan dan instruksi.
2. **Uji coba kelompok kecil:** 6–10 siswa. Angket kepraktisan + angket beban kognitif.
3. **Uji lapangan:** 1 kelas. Pretest → pemakaian 2–3 pertemuan → posttest + angket.

## Tahap Evaluation

Lihat [07-rencana-evaluasi.md](07-rencana-evaluasi.md).

## Urutan Prioritas jika Waktu Terbatas (MVP minimum)

1. M0–M3 (materi Modul 1–4, latihan, hint, Kartu Rumus, PWA offline)
2. M4 (soal cerita + literasi): **wajib** karena menjadi tujuan utama
3. Kuis sederhana dari M5
4. Ekspor data minimal dari M6 (bisa diganti angket Google Form sementara)
