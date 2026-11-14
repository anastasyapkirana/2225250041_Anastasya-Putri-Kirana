# 07 — Rencana Evaluasi

Evaluasi menjawab tiga pertanyaan: **Valid?** (menurut ahli), **Praktis?** (menurut siswa/guru), **Efektif?** (hasil belajar, beban kognitif, literasi).

## 1. Uji Fitur (dari Matriks Kebutuhan)

| Fitur | Tugas yang diberikan ke siswa | Indikator berhasil | Sumber data |
|---|---|---|---|
| Kartu Rumus + keterangan simbol | Tentukan a, b, n dari barisan, lalu substitusi | ≥ 80% benar | Log `T-identify` |
| Ruang Kerja Soal Cerita | Kerjakan soal kursi gedung | Langkah Diketahui/Ditanya benar tanpa hint ≥ 70% | Log langkah |
| Contoh bertahap + soal sejenis | Pelajari contoh, kerjakan 3 soal sejenis | Benar ≥ 2 dari 3 | Log |
| Visualisasi pola | "Jelaskan mengapa n − 1" | Memilih alasan benar ≥ 70% | Self-explanation |
| Umpan balik + Cek Hitungan | Diberi jawaban yang keliru, temukan salahnya | Menemukan letak salah | Observasi |
| Hint | Soal yang membuat siswa macet | Benar setelah hint ≥ 60% | Log hint → answer |
| Navigasi/instruksi singkat | "Buka Kartu Rumus", "Kembali ke Modul 3" tanpa bantuan | Berhasil ≤ 10 detik | Observasi/usability |
| Materi pendek + latihan | Pelajari 1 modul | Menyelesaikan modul | Log `module_done` |

## 2. Validasi Ahli (skala Likert 1–5)

**Ahli materi:** kebenaran konsep, kesesuaian dengan CP/TP, kecukupan contoh, kualitas soal literasi, bahasa.
**Ahli media:** tampilan, keterbacaan, kemudahan navigasi, konsistensi, kinerja di HP, fitur install/offline.

Persentase kelayakan = (skor diperoleh ÷ skor maksimal) × 100%.

| Persentase | Kategori |
|---|---|
| 81–100% | Sangat valid |
| 61–80% | Valid |
| 41–60% | Cukup valid |
| ≤ 40% | Kurang valid |

## 3. Kepraktisan (angket siswa, Likert 1–5)

Contoh butir:
1. Instruksi di aplikasi mudah dipahami.
2. Saya tahu harus menekan apa untuk lanjut.
3. Petunjuk (💡) membantu saya saat bingung.
4. Kartu Rumus membantu saat saya lupa rumus.
5. Contoh soalnya cukup banyak.
6. Aplikasi lancar di HP saya.
7. Saya ingin memakai aplikasi ini lagi.

Kategori sama dengan tabel validasi (praktis jika ≥ 61%, target ≥ 80%).

## 4. Beban Kognitif

### 4.1 Satu butir per modul (di aplikasi)
Skala *mental effort* (diadaptasi dari Paas, 1992) yang disederhanakan menjadi 5 titik bergambar:
*"Seberapa berat usaha mentalmu di modul ini?"* 😌 1 · 🙂 2 · 😐 3 · 😓 4 · 😫 5

### 4.2 Angket beban kognitif (setelah uji coba)
Adaptasi **Leppink dkk. (2013)**, 10 butir, skala 0–10, diterjemahkan dan disederhanakan untuk SMP:

| Dimensi | Contoh butir | Harapan |
|---|---|---|
| IL (3 butir) | "Materi di aplikasi ini sangat rumit." | Sedang (wajar karena materi baru) |
| EL (3 butir) | "Penjelasan di aplikasi membingungkan." · "Instruksinya tidak jelas." | **Rendah (≤ 3)** |
| GL (4 butir) | "Aplikasi ini membuat saya lebih paham cara memakai rumus." | **Tinggi (≥ 7)** |

> Lakukan uji keterbacaan butir ke 2–3 siswa sebelum dipakai. Laporkan reliabilitas (Cronbach's α) bila jumlah responden memadai.

## 5. Efektivitas Hasil Belajar

**Desain:** one-group pretest–posttest (atau dua kelompok jika memungkinkan).

### Kisi-kisi tes (10 butir, paralel untuk pretest dan posttest)

| No | Indikator | TP | Jenis | Level literasi |
|---|---|---|---|---|
| 1 | Menentukan suku berikutnya | TP1 | Isian | — |
| 2 | Menentukan beda (termasuk negatif) | TP2 | Isian | — |
| 3 | Mengidentifikasi barisan aritmetika | TP2 | PG | — |
| 4 | Menentukan a, b, n dari barisan | TP4 | Isian | — |
| 5 | Menghitung Uₙ | TP4 | Isian | Menerapkan |
| 6 | Menjelaskan arti (n − 1) | TP3 | PG + alasan | Bernalar |
| 7 | Mencari n | TP5 | Isian | Menerapkan |
| 8 | Soal cerita: merumuskan model | TP6 | Uraian | Merumuskan |
| 9 | Soal cerita: menghitung dan menafsirkan | TP6 | Uraian | Menafsirkan |
| 10 | Soal kewajaran/perbandingan (paket A vs B) | TP6 | Uraian | Bernalar |

**Analisis:** N-gain = (posttest − pretest) ÷ (skor maks − pretest).
Tinggi ≥ 0,7 · Sedang 0,3–0,7 · Rendah < 0,3. Target: **sedang**. Jika data memungkinkan, tambahkan uji-t berpasangan atau Wilcoxon.

### Rubrik literasi untuk butir uraian (0–3)

| Skor | Merumuskan | Menerapkan | Menafsirkan |
|---|---|---|---|
| 3 | a, b, n tepat dan alasannya jelas | Perhitungan benar dan runtut | Jawaban dihubungkan ke konteks + cek kewajaran |
| 2 | 2 dari 3 unsur tepat | Langkah benar, salah hitung kecil | Jawaban dalam konteks tanpa cek kewajaran |
| 1 | 1 unsur tepat | Ada langkah, tapi rumus salah | Hanya angka tanpa satuan/konteks |
| 0 | Tidak ada/salah semua | Tidak ada | Tidak ada |

## 6. Data Log untuk Evaluasi Formatif

Diolah dengan `scripts/analyze_results.py` dari ekspor CSV:
- Tingkat benar per template dan per miskonsepsi (miskonsepsi mana yang paling sering?)
- Rata-rata level hint sebelum benar
- Waktu per langkah materi (layar yang lama dibaca bisa jadi terlalu padat → revisi)
- Rata-rata skor *mental effort* per modul (modul dengan skor ≥ 4 → revisi penyajian)
- Tingkat penyelesaian modul (drop-off)

## 7. Etika

- Izin sekolah dan guru. Lembar persetujuan orang tua/wali.
- Data anonim (kode kelas + no. absen di-hash). Tidak ada rekaman wajah/suara di dalam aplikasi.
- Siswa boleh berhenti kapan saja. Data dihapus atas permintaan.
