# PRD — Metika

**Versi:** 0.1 (draf Design) · **Tanggal:** 12 November 2026 · **Model pengembangan:** ADDIE
**Materi:** Barisan Aritmetika, kelas VIII SMP (pola, beda, suku ke-n)

---

## 1. Ringkasan

Metika adalah aplikasi belajar berbasis web (PWA) yang membantu siswa SMP memahami dan **menggunakan** rumus suku ke-n barisan aritmetika, terutama pada **soal cerita**. Desainnya mengikuti hasil wawancara analisis kebutuhan (S01) dan Cognitive Load Theory (CLT). Literasi matematika dibangun dengan pola *merumuskan → menerapkan → menafsirkan*.

## 2. Latar Belakang dan Masalah

Wawancara dengan siswa kelas IX (S01) yang sudah mempelajari materi ini di kelas VIII menunjukkan hal berikut (detail di [docs/01-analisis-kebutuhan.md](docs/01-analisis-kebutuhan.md)):

| Masalah | Kode bukti |
|---|---|
| Lupa rumus suku ke-n | IL.01 |
| Bingung menentukan nilai a, b, n yang dimasukkan ke rumus (substitusi) | IL.02, artefak C5 |
| Kesulitan soal cerita (mengubah cerita menjadi barisan) | IL.04, EL.04, DS.02 |
| Sering salah hitung | IL.05 |
| Contoh soal terlalu sedikit | EL.01 |
| Tidak suka instruksi panjang | DS.04 |
| Belajar dengan menghafal dan meniru contoh, berisiko "ilusi paham" | GL.01, GL.04, GL.05 |
| Pembelajaran di kelas langsung memberi rumus (deduktif), medianya hanya papan tulis dan LKS | K0.1, K0.2 |

**Yang sudah dikuasai:** konsep pola, mencari selisih antarsuku, operasi hitung dasar (K.03, IL.03).

## 3. Tujuan Produk

| # | Tujuan | Jenis beban (CLT) |
|---|---|---|
| G1 | Siswa dapat menentukan a, b, n dari barisan atau soal cerita lalu menghitung Uₙ dengan benar | IL dikelola |
| G2 | Siswa memahami **mengapa** Uₙ = a + (n − 1)b berlaku (bukan sekadar menghafal) | GL didorong |
| G3 | Siswa dapat mengubah soal cerita menjadi model barisan dan menafsirkan hasilnya dalam konteks (literasi matematika) | IL + GL |
| G4 | Penyajian ringkas, banyak contoh, instruksi pendek | EL ditekan |
| G5 | Lancar di HP Android kelas menengah ke bawah, bisa di-install, bisa offline | Non-fungsional |

### Non-Goals (tidak dikerjakan di versi 1)

- Materi deret aritmetika (Sₙ), barisan/deret geometri.
- Akun dengan email/password, login media sosial.
- Papan peringkat (leaderboard) antarsiswa, karena memicu kecemasan dan menambah beban ekstrinsik.
- Fitur chat atau forum.
- Publikasi di Play Store/App Store (opsi APK sideload hanya *stretch goal*).

## 4. Pengguna

### Persona utama: "Raka", siswa kelas VIII (13–14 tahun)
- Memakai HP Android milik sendiri atau orang tua, layar sekitar 360–412 px, RAM 2–4 GB, kuota terbatas.
- Paham pola, tetapi lupa rumus dan bingung substitusi.
- Suka penjelasan singkat lalu langsung contoh. Kalau bingung, ia melihat contoh lagi.
- Butuh petunjuk kecil saat tidak tahu harus mulai dari mana.

### Persona sekunder
- **Guru matematika:** memakai aplikasi sebagai media di kelas atau tugas rumah, ingin melihat rekap kemajuan (versi 1 cukup lewat ekspor data oleh peneliti).
- **Peneliti (mahasiswa):** butuh data penggunaan anonim (hint, percobaan, skor survei beban) untuk tahap Evaluation.

## 5. Metrik Keberhasilan

| Metrik | Target versi 1 |
|---|---|
| Ketepatan substitusi a, b, n (soal latihan modul 4) | ≥ 80% siswa benar tanpa hint pada percobaan ke-2 |
| Kenaikan skor pretest → posttest | N-gain ≥ 0,3 (sedang) |
| Skor beban ekstrinsik (angket) | Rata-rata ≤ 3 dari skala 10 |
| Kepraktisan (angket siswa) | ≥ 80% (kategori praktis) |
| Validasi ahli materi dan ahli media | ≥ 80% (kategori valid) |
| Performa | Lighthouse Performance ≥ 90, PWA installable, berjalan offline |

## 6. Fitur dan Kebutuhan Fungsional

Prioritas: **P0** = wajib ada di MVP, **P1** = penting, **P2** = jika ada waktu.

| ID | Fitur | Deskripsi | Prioritas | Bukti |
|---|---|---|---|---|
| FR-01 | **Peta Belajar (6 modul)** | Modul pendek berurutan, 1 konsep per halaman, progres tersimpan | P0 | DS.05 |
| FR-02 | **Halaman materi ringkas** | Maksimal sekitar 60 kata penjelasan per halaman dan 1 visual. Tombol "Lanjut" | P0 | EL.02, EL.03, DS.04 |
| FR-03 | **Visualisasi pola** | Animasi susunan benda dan garis bilangan "lompatan +b" untuk menurunkan rumus | P0 | GL.01, Kesimpulan 7 |
| FR-04 | **Contoh bertahap (worked example)** | Langkah demi langkah dibuka satu per satu, minimal 3 contoh per modul | P0 | EL.01, GL.03 |
| FR-05 | **Contoh memudar (faded example)** | Contoh → sebagian langkah dikosongkan → soal mandiri | P0 | GL.04 (mengatasi ilusi paham) |
| FR-06 | **Latihan dengan soal sejenis tak terbatas** | Generator soal berparameter (angka acak) agar siswa bisa mencoba "soal sejenis" berulang | P0 | EL.01, GL.03 |
| FR-07 | **Hint bertingkat (3 level)** | Orientasi → strategi → langkah parsial. Pemakaian hint dicatat | P0 | DS.01, GL.03 |
| FR-08 | **Umpan balik spesifik kesalahan** | Mengenali miskonsepsi (memakai n bukan n−1, tanda b salah, salah urutan operasi) dan menjelaskannya singkat | P0 | IL.05, GL.02 |
| FR-09 | **Kartu Rumus (rangkuman)** | Bottom sheet yang bisa dibuka dari layar mana pun: rumus, arti a/b/n, contoh substitusi | P0 | IL.01, DS.01, artefak C1–C4 |
| FR-10 | **Ruang Kerja Soal Cerita** | Langkah terstruktur: Diketahui → Ditanya → Ubah ke barisan → Hitung → Periksa dan tafsirkan | P0 | IL.04, EL.04, DS.02 |
| FR-11 | **Pojok Literasi** | Soal konteks nyata (personal, sekolah, masyarakat, sains) dengan pertanyaan tafsir dan nalar ("Apakah masuk akal?") | P0 | Tujuan literasi |
| FR-12 | **Cek Hitungan** | Tombol untuk memeriksa ulang: hasil diverifikasi dengan menuliskan beberapa suku atau menghitung mundur | P1 | IL.05, GL.02 |
| FR-13 | **Jelaskan dengan Kata-katamu** | Setelah soal benar, siswa memilih atau menyusun alasan (self-explanation) | P1 | GL.04 |
| FR-14 | **Kuis / Tantangan** | Kuis akhir modul (5 soal) dan mode kartu ✕/✓ ala flashcard, dengan pembahasan | P0 | DS.01 |
| FR-15 | **Ulas Lagi** | Kotak otomatis: "Salah konsep" (jawaban cocok dengan miskonsepsi), "Soal sulit", "Ditandai". Soal yang salah masuk ke sini | P1 | GL.02 |
| FR-16 | **Beranda dan progres** | Cincin progres, jumlah soal benar, bintang, tombol "Lanjutkan" | P0 | DS.03 |
| FR-17 | **Survei beban singkat** | Setelah tiap modul: 1 pertanyaan "Seberapa berat usaha mentalmu?" (skala emoji 1–5) | P1 | Evaluasi |
| FR-18 | **Kode siswa anonim** | Siswa memasukkan kode kelas dan nomor absen (tanpa nama). Tidak ada data pribadi | P0 | Etika penelitian |
| FR-19 | **Pencatatan aktivitas dan ekspor** | Event (jawaban, hint, waktu) disinkronkan ke server dan bisa diekspor CSV oleh peneliti | P1 | Evaluasi |
| FR-20 | **Install ke layar utama dan offline** | Manifest dan service worker. Tombol "Pasang aplikasi" | P0 | Kebutuhan pengguna |
| FR-21 | **Pengaturan** | Ukuran huruf (normal/besar), suara efek on/off, reset progres | P1 | Aksesibilitas |
| FR-22 | **Pretest/Posttest dalam aplikasi** | Paket soal tetap untuk penelitian | P2 | Evaluasi |
| FR-23 | **Mode Guru** | Rekap kelas sederhana | P2 | — |

### User Stories Kunci

1. *Sebagai siswa, saya ingin melihat rumus beserta arti a, b, n kapan saja, supaya tidak macet karena lupa rumus.* (FR-09)
2. *Sebagai siswa, saya ingin petunjuk kecil saat tidak tahu mulai dari mana, tanpa langsung diberi jawaban.* (FR-07)
3. *Sebagai siswa, saya ingin banyak contoh yang mirip, supaya bisa melihat contoh lagi saat bingung.* (FR-04, FR-06)
4. *Sebagai siswa, saya ingin soal cerita dipandu langkah demi langkah, supaya tahu cara mengubah cerita menjadi barisan angka.* (FR-10)
5. *Sebagai siswa, saya ingin tahu letak salah hitung saya, supaya bisa memperbaikinya sendiri.* (FR-08, FR-12)
6. *Sebagai peneliti, saya ingin data hint dan percobaan siswa secara anonim untuk mengevaluasi efektivitas fitur.* (FR-19)

## 7. Kebutuhan Non-Fungsional

| ID | Kebutuhan | Kriteria |
|---|---|---|
| NFR-01 | Mobile-first | Nyaman di lebar 360 px. Target sentuh ≥ 44×44 px. Tanpa scroll horizontal |
| NFR-02 | Ringan | Ukuran awal (tanpa font) < 300 KB terkompresi. Tanpa framework berat |
| NFR-03 | Cepat | First Contentful Paint < 2 detik di 4G lambat. Interaksi < 100 ms |
| NFR-04 | Offline | Semua materi, latihan, dan kuis jalan tanpa internet setelah kunjungan pertama. Event disinkronkan saat online |
| NFR-05 | Installable | Lolos kriteria install PWA di Chrome Android (manifest, ikon 192/512, HTTPS, service worker) |
| NFR-06 | Aksesibilitas | Kontras teks ≥ 4.5:1 (WCAG AA). Bisa dipakai tanpa warna sebagai satu-satunya penanda (✓/✕ + teks) |
| NFR-07 | Privasi | Tanpa nama, email, nomor HP, atau lokasi. Hanya kode anonim. Tanpa pelacak pihak ketiga |
| NFR-08 | Bahasa | Antarmuka Bahasa Indonesia baku sederhana. Kalimat instruksi ≤ 12 kata |
| NFR-09 | Kompatibilitas | Chrome Android ≥ versi 2 tahun terakhir, Safari iOS 16+, Chrome/Edge/Firefox desktop |
| NFR-10 | Kualitas konten | Semua soal divalidasi otomatis oleh solver Python sebelum rilis |

## 8. Alur Pengguna Utama

```
Buka app ──► (pertama kali) Isi kode kelas + no. absen ──► Pretest singkat (opsional)
   │
   ▼
Beranda ──► Lanjutkan modul ──► Halaman materi (1 konsep) ──► Contoh bertahap
                                                     │
                                                     ▼
                          Contoh memudar ──► Latihan (hint, umpan balik, cek hitungan)
                                                     │
                                                     ▼
                          Pojok Literasi / Soal Cerita ──► Kuis modul ──► Survei beban (1 klik)
                                                                              │
                                                                              ▼
                                                            Modul berikutnya terbuka
```

Kartu Rumus dan Ulas Lagi bisa diakses kapan saja lewat navigasi bawah.

## 9. Lingkup Konten (6 Modul)

1. **Mengenal Pola dan Barisan**: suku, urutan, barisan naik/turun
2. **Beda (b)**: b = U₂ − U₁, beda tetap, beda negatif
3. **Menemukan Rumus Uₙ**: dari visual lompatan ke a + (n − 1)b
4. **Memakai Rumus (Substitusi)**: menentukan a, b, n lalu menghitung Uₙ
5. **Mencari yang Belum Diketahui**: mencari n, a, atau b (pengayaan)
6. **Soal Cerita dan Literasi**: konteks nyata, model, tafsir

Detail di [docs/03-konten-materi.md](docs/03-konten-materi.md).

## 10. Teknologi (ringkas)

- **Frontend:** HTML + CSS + JavaScript (ES Modules, tanpa build step), PWA (manifest + service worker), penyimpanan lokal IndexedDB/localStorage.
- **Backend:** Python 3.11+, FastAPI, SQLite. Melayani file statis, API konten, penerimaan event, dan ekspor CSV.
- **Kualitas konten:** skrip Python `validate_content.py` dan solver yang diuji dengan pytest.
- **Hosting:** layanan gratis yang mendukung Python dan HTTPS (mis. Render/Railway/PythonAnywhere).

Detail di [docs/05-arsitektur-teknis.md](docs/05-arsitektur-teknis.md).

## 11. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data analisis hanya dari 1 siswa (S01) | Kebutuhan tidak representatif | Tambah wawancara S02 (dan S03) sebelum Development. Dokumentasikan variasi |
| HP siswa lambat atau kuota terbatas | App lambat, siswa berhenti | Tanpa framework, aset kecil, offline-first |
| Gamifikasi mengalihkan perhatian | Beban ekstrinsik naik | Gamifikasi minimal (bintang), tanpa timer wajib, tanpa leaderboard |
| Siswa menekan hint terus | Tidak belajar mandiri | Hint bertingkat, level 3 baru muncul setelah 1 percobaan, pemakaian dicatat |
| Server gratis "tidur" atau mati | Sinkronisasi gagal | App tetap jalan offline, event diantre dan dikirim ulang |
| Siswa di bawah umur | Isu etika | Anonim, persetujuan guru/orang tua, tanpa data pribadi |

## 12. Pertanyaan Terbuka

1. Apakah aplikasi akan diuji di sekolah tertentu? (memengaruhi kode kelas dan jadwal uji)
2. Apakah perlu Mode Guru di versi 1, atau cukup ekspor CSV oleh peneliti?
3. Apakah dibutuhkan file APK (sideload) selain PWA? Jika ya, bisa dibuat via PWABuilder/Bubblewrap di akhir proyek.
4. Nama aplikasi final?

## 13. Perubahan v1.1 (masukan pengguna, 12 Nov 2026)

| ID | Fitur | Deskripsi | Bukti |
|---|---|---|---|
| FR-24 | **Pusat Latihan** | Halaman Latihan berisi Bank Soal, Kuis Cepat, Soal Tersimpan, Riwayat Latihan, Tantangan Hari Ini, dan Permainan | DS.01, DS.03 |
| FR-25 | **Bank Soal bertingkat** | 4 level (Mudah → Sedang → Sulit → Tantangan). Level berikutnya terbuka setelah benar ≥ 3/5 | Segmenting IL |
| FR-26 | **Kuis Cepat ber-timer** | 10 soal, 6 menit. Timer bisa dimatikan agar tidak menambah beban ekstrinsik | DS.01 |
| FR-27 | **Soal Tersimpan** | Tombol 🔖 di setiap soal. Koleksi pribadi bisa dikerjakan ulang dan dilihat pembahasannya (menggantikan "Ditandai") | GL.02 |
| FR-28 | **Riwayat & Evaluasi** | Ketepatan per topik, saran latihan, kesalahan tersering, skor kuis/level, aktivitas terbaru. Tombol "Perbaiki soal yang salah" (menggantikan kotak "Salah konsep"/"Soal sulit") | GL.02, evaluasi diri |
| FR-29 | **Tantangan Hari Ini** | 5 soal yang sama per hari (seed tanggal), hitungan hari beruntun | Latihan rutin |
| FR-30 | **Permainan edukatif** | Tebak Angka Berikutnya, Pemburu Beda, Susun Barisan, Kuis Pilihan Ganda, Benar atau Salah. 8 ronde, skor + combo, tanpa timer | DS.01 "kuis atau permainan" |

Catatan CLT: timer hanya ada di Kuis Cepat dan bisa dimatikan. Permainan tidak memakai timer.
