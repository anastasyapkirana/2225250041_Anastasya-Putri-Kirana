// ID anonim dari nama + nomor absen. Nama hanya disimpan di HP, tidak dikirim ke server.
// Memakai hash cyrb53 (non-kriptografis) agar hasilnya sama di semua browser,
// termasuk halaman http di jaringan lokal (crypto.subtle hanya ada di HTTPS).

// Salt sengaja tetap dari nama lama agar ID anonim siswa tidak berubah.
const SALT = 'langkahbeda-2026';

export function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function normalizeClassCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '').slice(0, 32);
}

/** 16 karakter heksadesimal, cocok dengan pola ANON_RE di backend. */
export function anonId(classCode, studentNo) {
  const key = `${normalizeClassCode(classCode)}#${String(studentNo).trim()}#${SALT}`;
  const p1 = cyrb53(key, 1).toString(16).padStart(14, '0');
  const p2 = cyrb53(key, 2).toString(16).padStart(14, '0');
  return (p1 + p2).slice(0, 16);
}

export function guestId() {
  return anonId(`TAMU-${Date.now()}-${Math.random()}`, 0);
}

/** Rapikan nama yang diketik: buang spasi berlebih. Nama hanya disimpan di HP. */
export function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 40);
}

/** Label profil, contoh: "CINTA NUR — 08". */
export function profileLabel(profile) {
  const who = (profile.name || profile.classCode || '').toUpperCase();
  const no = String(profile.studentNo ?? '').padStart(2, '0');
  return `${who} — ${no}`;
}

/** Sapaan dengan nama depan, contoh: "Halo, Cinta!". */
export function greeting(profile) {
  const first = normalizeName(profile?.name || profile?.classCode).split(' ')[0];
  if (!first) return 'Halo!';
  return `Halo, ${first.charAt(0).toUpperCase()}${first.slice(1).toLowerCase()}!`;
}
