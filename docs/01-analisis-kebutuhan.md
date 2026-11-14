# 01 — Analisis Kebutuhan (Tahap A, ADDIE)

Sumber: *Hasil Wawancara Analisis Kebutuhan Aplikasi Pembelajaran Berbasis Website pada Materi Barisan Aritmetika* (S01, kelas IX, 08 November 2026, 46 menit, daring, tanpa rekaman) dan *Penjelasan Hasil Observasi*.

## 1. Kerangka Kode

| Kode | Nama | Arti | Implikasi desain |
|---|---|---|---|
| IL | Intrinsic Load | Kesulitan yang melekat pada materi | **Dikelola**: materi dipecah bertahap (segmenting, pre-training simbol) |
| EL | Extraneous Load | Beban dari cara penyajian | **Ditekan**: teks ringkas, banyak contoh, instruksi pendek |
| GL | Germane / strategi belajar | Usaha mental yang membangun pemahaman | **Didorong**: contoh memudar, self-explanation, periksa ulang |
| K | Konteks/prasyarat | Latar dan kemampuan awal | Menentukan titik awal materi |
| DS | Desain/Saran | Keinginan siswa terhadap aplikasi | Menentukan fitur dan UX |

## 2. Profil Siswa S01

- **Sudah dikuasai:** konsep pola, mencari selisih, operasi hitung dasar (K.03, IL.03).
- **Hambatan:** (1) mengingat dan memakai rumus (IL.01, IL.02), (2) menerjemahkan soal cerita (IL.04, EL.04), (3) ketelitian berhitung (IL.05).
- **Gaya belajar:** menghafal dan meniru contoh (GL.01, GL.05). Merasa paham saat melihat contoh tetapi belum pernah menjelaskan ke orang lain, jadi ada risiko **ilusi pemahaman** (GL.04).
- **Pengalaman kelas:** rumus diberikan langsung (deduktif). Media papan tulis dan LKS (K0.1, K0.2).
- **Bukti artefak:** saat ditanya angka apa yang dimasukkan ke rumus, siswa hanya menjawab "5" (C5) padahal perlu a = 5, b = 3, n = 10. Setelah rumus dan keterangan simbol ditampilkan, siswa menghitung U₁₀ = 32 dengan benar (C1). Artinya **rumus + keterangan simbol + petunjuk** efektif untuk siswa ini.

> Catatan: ada sedikit inkonsistensi antara "agak lupa" (K0.1) dan "masih ingat dan cukup paham" (K0.2). Interpretasi: siswa ingat **konsep** tetapi lupa **rumus**.

## 3. Matriks Traceability: Temuan → Fitur → Cara Uji

| No | Temuan (kode) | Interpretasi | Fitur (PRD) | Indikator uji |
|---|---|---|---|---|
| 1 | Lupa rumus, bingung substitusi (IL.01, IL.02, C5) | Butuh dukungan memakai rumus dan mengenali unsur a, b, n | FR-09 Kartu Rumus, FR-03 penurunan rumus visual, Modul 3–4 | Siswa menentukan a, b, n dari soal lalu substitusi dengan benar |
| 2 | Soal cerita dan perhitungan sulit (IL.04, IL.05) | Butuh latihan memahami informasi soal dan menyelesaikannya | FR-10 Ruang Kerja Soal Cerita, FR-12 Cek Hitungan | Siswa mengisi diketahui/ditanya dengan benar dan menyelesaikan |
| 3 | Contoh terlalu sedikit, suka teks singkat (EL.01–EL.03) | Butuh materi ringkas dan contoh bervariasi | FR-02, FR-04 (≥ 3 contoh/modul), FR-06 generator soal sejenis | Siswa mempelajari contoh lalu mengerjakan soal sejenis mandiri |
| 4 | Terbantu contoh bertahap, pola/gambar, rumus (GL.01) | Belajar melalui contoh dan visual | FR-03 Visualisasi pola, FR-04, FR-09 | Siswa menjelaskan pola dan menyelesaikan soal |
| 5 | Memeriksa ulang rumus dan hitungan (GL.02) | Strategi evaluasi diri sudah ada | FR-08 umpan balik spesifik, FR-12, FR-15 Ulas Lagi | Diberi soal dengan jawaban keliru, siswa menemukan letak salahnya |
| 6 | Butuh petunjuk awal (DS.01, GL.03) | Butuh bantuan awal saat macet | FR-07 Hint 3 level | Log: siswa melanjutkan dan benar setelah hint |
| 7 | Tidak suka instruksi panjang (DS.03, DS.04) | Instruksi sederhana dan mudah digunakan | NFR-08, navigasi 5 tab, aturan ≤ 12 kata | Siswa menemukan fitur tanpa bantuan (uji usability) |
| 8 | Ingin 1 materi pendek per halaman + soal (DS.05) | Materi ringkas langsung latihan | FR-01, FR-02, latihan di akhir tiap halaman/modul | Siswa belajar lalu langsung mencoba latihan |
| 9 | Merasa paham hanya dengan melihat contoh (GL.04) | Risiko ilusi pemahaman | FR-05 Contoh memudar, FR-13 Jelaskan dengan kata-katamu | Siswa menyelesaikan soal tanpa contoh dan memilih alasan yang benar |
| 10 | Ingin kuis/permainan (DS.01) | Motivasi dan latihan retrieval | FR-14 Kuis/Tantangan | Skor kuis dan tingkat penyelesaian |
| 11 | Tujuan tambahan peneliti: **literasi matematika** | Siswa perlu merumuskan, menerapkan, menafsirkan dalam konteks | FR-11 Pojok Literasi, langkah "Periksa dan tafsirkan" di FR-10 | Skor soal literasi (rubrik di 07-rencana-evaluasi) |

## 4. Keterbatasan dan Tindak Lanjut

1. **Baru 1 informan (S01).** Sesuai catatan pedoman, temuan belum mewakili seluruh siswa SMP. Rencana: wawancara **S02 (dan S03)** dengan pedoman yang sama, terutama siswa dengan kemampuan berbeda. Catat variasi di tabel berikut.
2. Jawaban siswa untuk soal pemicu 3, 7, 11, 15, … tidak tercatat. Pada wawancara berikutnya, catat jawaban dan alasannya.
3. Tambahkan **analisis kurikulum** (Capaian Pembelajaran fase D yang berlaku di sekolah sasaran) dan **wawancara singkat guru** (ketersediaan HP, waktu belajar, cara aplikasi dipakai di kelas).
4. Tambahkan **analisis perangkat**: jenis HP, versi Android, kuota internet siswa.

### Tabel variasi antarsiswa (diisi setelah S02)

| Aspek | S01 | S02 | S03 | Dampak ke desain |
|---|---|---|---|---|
| Penguasaan pola | Paham | | | |
| Ingat rumus | Lupa | | | |
| Kesulitan utama | Substitusi, soal cerita, hitung | | | |
| Preferensi penyajian | Teks singkat + contoh | | | |
| Fitur yang diinginkan | Rangkuman, kuis, hint | | | |
| Perangkat | — | | | |
