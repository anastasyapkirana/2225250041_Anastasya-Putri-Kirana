# 03 — Konten Materi dan Storyboard

Semua teks di bawah adalah **draf konten** yang nanti dipindahkan ke `content/modules/*.json`. Batas: ≤ 60 kata penjelasan per layar, instruksi ≤ 12 kata. Semua angka sudah dihitung ulang. Setelah ditulis ke JSON, wajib dicek dengan `scripts/validate_content.py`.

Notasi: a = suku pertama, b = beda, n = nomor suku, Uₙ = suku ke-n.

---

## Modul 1 — Mengenal Pola dan Barisan (TP1)

**Pemantik:** gambar tumpukan ubin 2, 4, 6, 8. *"Berapa ubin di susunan berikutnya?"*

| Layar | Isi |
|---|---|
| 1.1 | **Barisan** adalah bilangan yang disusun berurutan dengan aturan tertentu. Setiap bilangan disebut **suku**. Visual: 2, 4, 6, 8 dengan label U₁, U₂, U₃, U₄. |
| 1.2 | **U₁** = suku pertama, **U₂** = suku kedua, dan seterusnya. Angka kecil di bawah U adalah **nomor suku**. *(pre-training simbol n)* |
| 1.3 | Barisan bisa **naik** (3, 7, 11, 15) atau **turun** (20, 17, 14, 11). |

**Contoh bertahap**
1. 3, 7, 11, 15, … → selisihnya 4 → dua suku berikutnya **19, 23**.
2. 20, 17, 14, 11, … → berkurang 3 → **8, 5**.
3. Pola korek api segitiga: 3, 5, 7 batang → berikutnya **9**.

**Latihan (generator `T-next`)**: diberi 4 suku, isi 2 suku berikutnya.

---

## Modul 2 — Beda (b) (TP2)

| Layar | Isi |
|---|---|
| 2.1 | **Beda (b)** = selisih dua suku yang berurutan. **b = U₂ − U₁**. Visual: lompatan "+4" di atas garis bilangan. |
| 2.2 | Jika bedanya **selalu sama**, barisan itu disebut **barisan aritmetika**. |
| 2.3 | Barisan turun punya **beda negatif**. 20, 17, 14 → b = 17 − 20 = **−3**. |
| 2.4 | Bukan aritmetika: 1, 2, 4, 8 → selisihnya 1, 2, 4 (tidak tetap). |

**Contoh bertahap**
1. 5, 8, 11, 14 → 8 − 5 = 3, 11 − 8 = 3, 14 − 11 = 3 → **b = 3**, aritmetika.
2. 50, 46, 42, 38 → **b = −4**.
3. 2, 5, 9, 14 → selisih 3, 4, 5 → **bukan** aritmetika.

**Self-explanation:** *"Mengapa b = U₂ − U₁, bukan U₁ − U₂?"* → (✓) "Beda menunjukkan berapa yang ditambahkan untuk sampai ke suku berikutnya."

**Latihan:** `T-beda` (tentukan b), `T-is-arith` (aritmetika atau bukan).

---

## Modul 3 — Menemukan Rumus Uₙ (TP3) ⭐ inti pemahaman

Tujuan: siswa **melihat** mengapa rumusnya a + (n − 1)b, supaya tidak bergantung pada hafalan (GL.04, GL.05).

| Layar | Isi |
|---|---|
| 3.1 | Visual interaktif: barisan 5, 8, 11, 14. Tap tiap suku untuk melihat lompatan dari a. |
| 3.2 | Tabel yang muncul bertahap: |

```
U₁ = 5                 = a
U₂ = 5 + 3             = a + 1·b
U₃ = 5 + 3 + 3         = a + 2·b
U₄ = 5 + 3 + 3 + 3     = a + 3·b
            ⋮
Uₙ                     = a + (n − 1)·b
```

| Layar | Isi |
|---|---|
| 3.3 | **Kunci:** dari U₁ ke Uₙ ada **(n − 1) lompatan**. Visual: 4 tiang (suku) dan 3 lompatan di antaranya. |
| 3.4 | **Rumus:** Uₙ = a + (n − 1)b. Kartu Rumus terbuka otomatis pertama kali dan tersimpan di tombol 📘. |

**Contoh bertahap (korek api segitiga 3, 5, 7, …)**
1. a = 3, b = 2.
2. U₁₀ = 3 + (10 − 1) × 2
3. = 3 + 9 × 2 = 3 + 18 = **21 batang**.
4. Cek: n segitiga berjajar memakai 2n + 1 batang → 2(10) + 1 = 21 ✓.

**Self-explanation:** *"Mengapa dikali (n − 1), bukan n?"*
- (✓) Karena suku pertama sudah ada, lompatannya dimulai setelah U₁.
- (✕) Karena rumusnya memang begitu.
- (✕) Supaya hasilnya lebih kecil.

---

## Modul 4 — Memakai Rumus / Substitusi (TP4) ⭐ mengatasi IL.02

**Pemantik (dari artefak wawancara):** *"Untuk mencari U₁₀ dari 5, 8, 11, 14, angka apa saja yang dimasukkan ke rumus?"* → jawaban: **a = 5, b = 3, n = 10**.

| Layar | Isi |
|---|---|
| 4.1 | Tiga langkah: **① Temukan a, b, n → ② Masukkan ke rumus → ③ Hitung: kurung dulu, kali, lalu tambah.** |
| 4.2 | n adalah **nomor suku yang ditanya**, bukan nilai suku. |

**Contoh bertahap**
1. 5, 8, 11, 14, … U₁₀ → a = 5, b = 3, n = 10 → 5 + 9 × 3 = 5 + 27 = **32**.
2. 2, 9, 16, 23, … U₂₀ → a = 2, b = 7, n = 20 → 2 + 19 × 7 = 2 + 133 = **135**.
3. 50, 46, 42, … U₁₂ → a = 50, b = −4, n = 12 → 50 + 11 × (−4) = 50 − 44 = **6**.

**Contoh memudar**
- F1: 4, 10, 16, … U₈ → a = 4, b = 6, n = 8 → 4 + (8 − 1) × 6 = 4 + ▢ = ▢ *(jawaban: 42, 46)*
- F2: 30, 27, 24, … U₉ → a = ▢, b = ▢, n = ▢ → U₉ = ▢ *(30, −3, 9, 6)*

**Bentuk sederhana (pengayaan):** 5, 8, 11 → Uₙ = 5 + (n − 1)3 = 3n + 2. Cek U₁₀ = 32 ✓.

**Latihan:**
- `T-identify`: dari barisan dan pertanyaan, isi kotak a, b, n terpisah (melatih tepat C5).
- `T-un`: hitung Uₙ (dengan hint dan deteksi miskonsepsi M1–M8).

---

## Modul 5 — Mencari yang Belum Diketahui (TP5, pengayaan)

**Contoh bertahap**
1. **Cari n:** 7, 11, 15, …, 87. Suku ke berapa 87?
   87 = 7 + (n − 1) × 4 → 80 = (n − 1) × 4 → n − 1 = 20 → **n = 21**.
2. **Cari b:** a = 4 dan U₆ = 29 → 29 = 4 + 5b → 25 = 5b → **b = 5**.
3. **Cari a dan b dari dua suku:** U₃ = 11 dan U₇ = 27.
   Dari U₃ ke U₇ ada 4 lompatan → 4b = 16 → **b = 4**. a = 11 − 2 × 4 = **3**.

**Latihan:** `T-find-n`, `T-find-b`, `T-two-terms`.

---

## Modul 6 — Soal Cerita dan Literasi (TP6) ⭐ mengatasi IL.04, EL.04

Semua soal memakai **Ruang Kerja 5 Langkah**: Diketahui → Ditanya → Ubah ke barisan → Hitung → Periksa dan tafsirkan.

### Contoh bertahap

**C1 — Kursi gedung (konteks masyarakat)**
> Baris pertama gedung pertunjukan berisi 12 kursi. Setiap baris di belakangnya bertambah 3 kursi. Berapa kursi di baris ke-15?

| Langkah | Isi |
|---|---|
| Diketahui | Baris 1 = 12 kursi, tiap baris bertambah 3 |
| Ditanya | Banyak kursi baris ke-15 |
| Ubah ke barisan | 12, 15, 18, … → a = 12, b = 3, n = 15 |
| Hitung | U₁₅ = 12 + 14 × 3 = 12 + 42 = **54** |
| Tafsirkan | Baris ke-15 berisi 54 kursi. Masuk akal: lebih banyak dari baris 1 |
| Nalar | *Mungkinkah ada baris berisi tepat 100 kursi?* (100 − 12) ÷ 3 = 29,33… → bukan bilangan bulat → **tidak mungkin** |

**C2 — Tabungan (konteks personal)**
> Rina menabung Rp5.000 di minggu pertama. Setiap minggu ia menabung Rp2.000 lebih banyak dari minggu sebelumnya. Berapa yang ia tabung di minggu ke-8?

a = 5.000, b = 2.000, n = 8 → U₈ = 5.000 + 7 × 2.000 = **Rp19.000**.
Nalar: *Minggu ke berapa Rina menabung Rp25.000?* (25.000 − 5.000) ÷ 2.000 + 1 = **minggu ke-11**.

**C3 — Parkir (konteks masyarakat, jebakan bahasa)**
> Tarif parkir: jam pertama Rp3.000, setiap jam berikutnya Rp2.000. Berapa biaya parkir 6 jam?

Barisan biaya total: 3.000, 5.000, 7.000, … → a = 3.000, b = 2.000, n = 6 → **Rp13.000**.
Poin literasi: "6 jam" berarti suku ke-6 dari barisan *biaya total*, bukan tarif jam ke-6.

### Soal latihan literasi

| ID | Konteks | Soal | Jawaban |
|---|---|---|---|
| L1 | Ilmiah | Tinggi tanaman di minggu ke-1 adalah 12 cm dan bertambah 1,5 cm setiap minggu. Tinggi di minggu ke-10? | 12 + 9 × 1,5 = **25,5 cm**. Tafsir: *Apakah tanaman tumbuh begini selamanya?* (tidak, model hanya berlaku sementara) |
| L2 | Ilmiah | Suhu di pos 1 pendakian 26 °C. Setiap pos berikutnya 2 °C lebih dingin. Suhu di pos 6? | 26 + 5 × (−2) = **16 °C** |
| L3 | Pekerjaan | Rak toko: rak paling atas berisi 8 kaleng, setiap rak di bawahnya bertambah 4. Isi rak ke-7? | 8 + 6 × 4 = **32 kaleng** |
| L4 | Personal | Dimas push-up 10 kali di hari pertama, bertambah 5 setiap hari. Hari ke berapa ia push-up 60 kali? | (60 − 10) ÷ 5 + 1 = **hari ke-11** |
| L5 | Penalaran | Paket internet A: bulan 1 Rp20.000, naik Rp5.000/bulan. Paket B: bulan 1 Rp35.000, naik Rp2.000/bulan. Mana lebih murah di bulan ke-5, 6, dan 7? | Bulan 5: A 40.000 < B 43.000 · Bulan 6: **sama**, 45.000 · Bulan 7: A 50.000 > B 47.000. Tafsir: pilihan bergantung lama pemakaian |
| L6 | Membaca tabel | Tabel minggu–tabungan: 1 → 7.000, 2 → 10.000, 3 → 13.000. Tabungan minggu ke-12? | 7.000 + 11 × 3.000 = **Rp40.000** |

---

## Kuis dan Mode Tantangan

### Contoh soal kuis modul 4 (5 soal)
1. Barisan 6, 11, 16, … Nilai b = ? → **5**
2. Barisan 6, 11, 16, … U₁₅ = ? → 6 + 14 × 5 = **76**
3. Barisan 40, 37, 34, … U₁₀ = ? → 40 + 9 × (−3) = **13**
4. Untuk mencari U₂₅ dari 1, 4, 7, …, nilai n = ? → **25**
5. Pilih langkah yang benar untuk U₈ dari 2, 6, 10: (a) 2 + 8 × 4 (b) **2 + 7 × 4** (c) (2 + 7) × 4

### Kartu ✕/✓ (Tantangan)
| Pernyataan | Jawaban |
|---|---|
| Beda barisan 20, 17, 14 adalah 3 | ✕ (−3) |
| 2, 4, 8, 16 adalah barisan aritmetika | ✕ |
| Pada U₁₂, nilai n = 12 | ✓ |
| U₅ dari 1, 3, 5, … adalah 9 | ✓ |
| Rumus suku ke-n adalah a + n·b | ✕ |

---

## Template Generator Soal (untuk `content/questions/*.json`)

Generator di klien memilih parameter acak sesuai batas lalu menghitung jawabannya. Semua template dites oleh solver Python.

| Template | Parameter | Batasan | Jawaban |
|---|---|---|---|
| `T-next` | a, b | a ∈ [−10, 30], b ∈ [−6, 9] \ {0} | U₅, U₆ |
| `T-beda` | a, b | sama | b |
| `T-is-arith` | — | 50% aritmetika, 50% tidak (selisih naik 1) | ya/tidak |
| `T-identify` | a, b, n | n ∈ [6, 30] | a, b, n |
| `T-un` | a, b, n | sama, \|Uₙ\| ≤ 500 | a + (n − 1)b |
| `T-find-n` | a, b, n | b ≠ 0 | n |
| `T-find-b` | a, b, n | n ≥ 3 | b |
| `T-two-terms` | a, b, p, q | 1 ≤ p < q ≤ 15 | a, b |
| `T-story-*` | slot konteks + a, b, n | angka "ramah" (kelipatan 500/1.000 untuk uang) | sesuai template |

Contoh JSON:

```json
{
  "id": "T-un",
  "module": "m4",
  "type": "numeric",
  "prompt": "Barisan {u1}, {u2}, {u3}, {u4}, … Tentukan U<sub>{n}</sub>.",
  "params": { "a": [-10, 30], "b": [-6, 9], "n": [6, 30] },
  "exclude": { "b": [0] },
  "constraints": ["abs(a + (n - 1) * b) <= 500"],
  "answer": "a + (n - 1) * b",
  "hints": [
    "Tentukan dulu a, b, dan n.",
    "a = suku pertama. b = U₂ − U₁. n = {n}.",
    "U<sub>{n}</sub> = {a} + ({n} − 1) × ▢"
  ],
  "misconceptions": ["M1", "M2", "M3", "M4", "M6", "M8"]
}
```

> Ekspresi `answer` dan `constraints` hanya boleh memakai variabel parameter, angka, `+ - * / ( )`, dan `abs`. Klien mengevaluasinya dengan parser aman (bukan `eval`). Solver Python memakai `ast` untuk mengevaluasi ekspresi yang sama, sehingga kedua bahasa diuji dengan data yang sama.
