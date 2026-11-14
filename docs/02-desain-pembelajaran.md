# 02 — Desain Pembelajaran

## 1. Tujuan Pembelajaran

Setelah memakai aplikasi, siswa dapat:

| Kode | Tujuan | Modul |
|---|---|---|
| TP1 | Mengenali barisan aritmetika dan menentukan suku berikutnya | 1 |
| TP2 | Menentukan beda (b), termasuk beda negatif, dan menjelaskan mengapa beda tetap | 2 |
| TP3 | Menjelaskan asal rumus Uₙ = a + (n − 1)b dari pola lompatan | 3 |
| TP4 | Menentukan a, b, n dari barisan lalu menghitung Uₙ dengan teliti | 4 |
| TP5 | Mencari n, a, atau b jika unsur lain diketahui (pengayaan) | 5 |
| TP6 | Mengubah situasi nyata menjadi barisan aritmetika, menyelesaikannya, dan menafsirkan hasil dalam konteks | 6 + Pojok Literasi |

## 2. Prinsip Cognitive Load Theory yang Dipakai

| Prinsip | Bentuk di aplikasi | Mengatasi |
|---|---|---|
| **Segmenting** | 1 konsep per halaman, ≤ 60 kata, modul pendek (± 10–15 menit) | DS.05, IL |
| **Pre-training** | Arti simbol a, b, n, dan Uₙ dikenalkan di Modul 1–2 sebelum rumus | IL.02 |
| **Worked example effect** | ≥ 3 contoh bertahap per modul, langkah dibuka satu per satu | EL.01, GL.03 |
| **Completion / fading** | Contoh → 1 langkah kosong → 2 langkah kosong → soal mandiri | GL.04 |
| **Split-attention** | Label angka langsung di visual, rumus dan substitusi bersebelahan | EL |
| **Redundancy** | Tidak membacakan teks yang sudah tertulis. Tidak ada teks hiasan | EL |
| **Signaling** | Warna konsisten: **a** selalu cobalt, **b** selalu kuning, **n** selalu navy bergaris | IL.02 |
| **Expertise reversal** | Bantuan dikurangi seiring kemahiran. Siswa yang benar 3× berturut-turut boleh melewati contoh | GL |
| **Self-explanation** | Setelah benar: "Mengapa n − 1?" pilihan ganda singkat | GL.04 |
| **Retrieval practice** | Kuis akhir modul, kartu ✕/✓, Ulas Lagi | GL.05 |

### Kode warna simbol (signaling)

Dipakai konsisten di materi, contoh, latihan, dan Kartu Rumus.

- **a** (suku pertama): latar cobalt muda, teks navy
- **b** (beda): latar butter yellow, teks navy
- **n** (nomor suku): teks navy dengan garis bawah putus-putus
- **Uₙ** (hasil): teks navy tebal

## 3. Alur di Dalam Satu Modul

```
┌─ 1. Pemantik (1 layar) ─────── Pertanyaan konteks singkat, tanpa harus dijawab benar
├─ 2. Materi (2–4 layar) ─────── 1 konsep/layar + visual
├─ 3. Contoh bertahap (≥3) ───── Tap "Langkah berikutnya" untuk membuka langkah
├─ 4. Contoh memudar (2) ─────── Isi langkah yang dikosongkan
├─ 5. Latihan (5–8 soal) ─────── Generator soal sejenis, hint, umpan balik, cek hitungan
├─ 6. Pojok Literasi (1–2) ───── Soal konteks nyata + pertanyaan tafsir
├─ 7. Kuis modul (5 soal) ────── Skor + pembahasan. Lulus ≥ 4/5 untuk bintang penuh
└─ 8. Survei beban (1 klik) ──── "Seberapa berat usaha mentalmu?" 😌🙂😐😓😫
```

Modul berikutnya terbuka setelah kuis dikerjakan (tidak harus lulus, agar siswa tidak terkunci). Bintang menandai penguasaan.

## 4. Literasi Matematika

Mengacu pada kerangka **PISA 2022**: literasi matematika adalah kemampuan **bernalar secara matematis** serta **merumuskan, menerapkan, dan menafsirkan** matematika dalam berbagai konteks.

### 4.1 Tiga proses literasi → langkah di Ruang Kerja Soal Cerita

| Proses PISA | Langkah di aplikasi | Contoh pertanyaan pemandu (≤ 12 kata) |
|---|---|---|
| **Merumuskan** (*formulate*) | 1. Diketahui · 2. Ditanya · 3. Ubah ke barisan | "Angka apa yang muncul pertama?" · "Bertambah berapa setiap kali?" · "Suku ke berapa yang dicari?" |
| **Menerapkan** (*employ*) | 4. Hitung | "Masukkan a, b, n ke rumus." |
| **Menafsirkan & mengevaluasi** (*interpret*) | 5. Periksa dan tafsirkan | "Apa arti angka ini dalam cerita?" · "Masuk akal tidak?" |
| **Bernalar** (*reasoning*) | Pertanyaan tambahan | "Mungkinkah ada baris berisi 100 kursi? Mengapa?" |

### 4.2 Ragam konteks (minimal 1 soal per konteks di Modul 6)

| Konteks PISA | Contoh situasi dekat dengan siswa SMP |
|---|---|
| Personal | Tabungan mingguan, jumlah halaman buku yang dibaca, latihan push-up |
| Pekerjaan | Upah harian bertambah, susunan barang di rak toko |
| Masyarakat | Kursi gedung pertunjukan, antrean, tarif parkir per jam |
| Ilmiah | Pertumbuhan tinggi tanaman, suhu turun tiap kenaikan ketinggian |

### 4.3 Ragam representasi

Agar literasi tidak hanya berupa membaca soal teks, siswa juga membaca informasi dari:
- **gambar pola** (susunan korek api, ubin, kursi),
- **tabel** (minggu ke-, jumlah tabungan),
- **poster/infografis sederhana** (daftar tarif),
- **garis bilangan**.

### 4.4 Pertanyaan tafsir dan nalar (bukan hanya menghitung)

- *Kewajaran:* "Hasilmu 540 kursi untuk baris ke-15. Masuk akal?" (memicu periksa ulang, IL.05)
- *Bilangan bulat:* "Apakah ada minggu ketika tabungannya tepat Rp50.000?" (n harus bilangan asli)
- *Perbandingan:* "Paket A atau paket B yang lebih murah pada bulan ke-6?"
- *Keterbatasan model:* "Apakah tanaman akan terus tumbuh 2 cm setiap minggu selamanya?"

## 5. Hint Bertingkat

Setiap soal punya 3 hint. Level 3 baru bisa dibuka setelah ada minimal 1 jawaban.

| Level | Fungsi | Contoh (soal: barisan 5, 8, 11, 14, …, cari U₁₀) |
|---|---|---|
| 1. Orientasi | Mengarahkan ke apa yang perlu dicari | "Tentukan dulu a, b, dan n." |
| 2. Strategi | Memberi cara, tanpa angka akhir | "a = suku pertama. b = U₂ − U₁. n = suku yang ditanya." |
| 3. Langkah parsial | Menampilkan substitusi dengan isian kosong | "U₁₀ = 5 + (10 − 1) × ▢ = 5 + ▢ × 3" |

Data yang dicatat: level hint tertinggi, waktu sebelum hint, benar/salah setelah hint.

## 6. Umpan Balik Berbasis Miskonsepsi

Checker (`engine/checker.js`) mencocokkan jawaban salah dengan pola miskonsepsi. Jika cocok, tampilkan pesan khusus (≤ 2 kalimat). Jika tidak cocok, tampilkan pesan umum + tawaran hint.

| ID | Miskonsepsi | Cara deteksi (jawaban siswa =) | Pesan umpan balik |
|---|---|---|---|
| M1 | Memakai n, bukan n − 1 | a + n·b | "Sepertinya kamu mengalikan b dengan n. Dari U₁ ke Uₙ ada n − 1 lompatan." |
| M2 | Lupa menambahkan a | (n − 1)·b | "Kamu baru menghitung total lompatannya. Jangan lupa mulai dari a." |
| M3 | Salah urutan operasi | (a + n − 1)·b | "Kalikan dulu (n − 1) × b, baru tambahkan a." |
| M4 | Tanda beda salah (barisan turun) | a + (n − 1)·|b| | "Barisannya turun, jadi b negatif." |
| M5 | Beda dihitung terbalik | b = U₁ − U₂ | "Beda = suku sesudah − suku sebelum." |
| M6 | Menganggap b = U₂ | a + (n − 1)·U₂ | "b adalah selisih, bukan suku kedua." |
| M7 | Menjumlahkan suku (bingung dengan deret) | Sₙ | "Yang ditanya suku ke-n, bukan jumlah semua suku." |
| M8 | Salah hitung kecil | selisih kecil dari jawaban benar, langkah benar | "Langkahmu sudah benar! Coba periksa lagi perkaliannya." |

Pesan selalu diawali penguatan positif jika sebagian benar (misalnya a dan b sudah tepat).

## 7. Cek Hitungan (FR-12)

Untuk melatih kebiasaan periksa ulang (GL.02, IL.05), setelah siswa memasukkan Uₙ, ada tombol **"Cek dengan cara lain"**:
- **Daftar suku:** tampilkan U₁, U₂, …, Uₙ (jika n ≤ 15) sehingga siswa melihat hasilnya cocok.
- **Hitung mundur:** (Uₙ − a) ÷ b + 1 harus = n.

## 8. Gamifikasi Ringan

- **Bintang** per modul (0–3): menyelesaikan latihan, lulus kuis, menjawab soal literasi.
- **Kartu ✕/✓ (mode Tantangan):** pernyataan singkat ("Beda barisan 20, 17, 14 adalah 3"), geser/tap ✕ atau ✓. Terinspirasi desain flashcard referensi.
- Tidak ada leaderboard, penalti, atau timer wajib.

## 9. Pemetaan ke Prinsip "IL dikelola, EL ditekan, GL didorong"

| | Fitur |
|---|---|
| **IL dikelola** | 6 modul berurutan, pre-training simbol, ruang kerja soal cerita bertahap, Kartu Rumus |
| **EL ditekan** | ≤ 60 kata/halaman, instruksi ≤ 12 kata, navigasi 5 tab, tanpa animasi dekoratif, label di dalam visual |
| **GL didorong** | Penurunan rumus visual, contoh memudar, self-explanation, cek hitungan, soal tafsir literasi, Ulas Lagi |
