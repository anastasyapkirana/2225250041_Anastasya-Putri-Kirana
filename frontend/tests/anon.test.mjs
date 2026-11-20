import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greeting, profileLabel, normalizeName } from '../js/engine/anon.js';

test('label profil memakai nama kapital dan nomor dua digit', () => {
  assert.equal(profileLabel({ name: 'cinta nur', studentNo: '8' }), 'CINTA NUR — 08');
  assert.equal(profileLabel({ name: 'Tasya', studentNo: '16' }), 'TASYA — 16');
});

test('sapaan memakai nama depan', () => {
  assert.equal(greeting({ name: '  cinta   nur ' }), 'Halo, Cinta!');
  assert.equal(greeting({ name: 'TASYA' }), 'Halo, Tasya!');
  assert.equal(greeting({}), 'Halo!');
  assert.equal(normalizeName('  a   b '), 'a b');
});
