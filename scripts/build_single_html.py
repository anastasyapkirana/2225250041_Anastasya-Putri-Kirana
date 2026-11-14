"""Gabungkan seluruh aplikasi menjadi SATU file HTML: dist/metika.html.

File ini bisa dibuka langsung (klik dua kali) di browser tanpa server dan tanpa internet,
atau dibagikan lewat WhatsApp / Google Drive / flashdisk.

Isi yang digabung: CSS, font Nunito, ikon, semua konten JSON, dan semua modul JavaScript.
Modul ES tetap dipakai apa adanya: saat dibuka, loader kecil membuat blob URL untuk setiap
modul dan menulis ulang path import-nya. Permintaan ke content/*.json dilayani dari data
yang tertanam. Data penelitian tidak terkirim (tidak ada server), tetapi progres siswa
tetap tersimpan di browser.

Pemakaian:  python scripts/build_single_html.py
"""

from __future__ import annotations

import base64
import json
import re 
from graphlib import TopologicalSorter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONT = ROOT / "frontend"
CONTENT = ROOT / "content"
OUT = ROOT / "dist" / "metika.html"

IMPORT_RE = re.compile(r"""(from\s*|import\s*\(\s*|import\s+)(['"])(\.{1,2}/[^'"]+)\2""")


def data_uri(path: Path, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def resolve(from_path: str, spec: str) -> str:
    parts = from_path.split("/")[:-1]
    for seg in spec.split("/"):
        if seg == "..":
            parts.pop()
        elif seg != ".":
            parts.append(seg)
    return "/".join(parts)


def collect_modules() -> list[tuple[str, str]]:
    icon192 = data_uri(FRONT / "assets/icons/icon-192.png", "image/png")
    sources: dict[str, str] = {}
    for f in sorted((FRONT / "js").rglob("*.js")):
        rel = f.relative_to(FRONT).as_posix()
        sources[rel] = f.read_text(encoding="utf-8").replace("assets/icons/icon-192.png", icon192)
    graph = {
        path: {resolve(path, m.group(3)) for m in IMPORT_RE.finditer(code)} for path, code in sources.items()
    }
    for path, deps in graph.items():
        missing = deps - sources.keys()
        if missing:
            raise SystemExit(f"{path} mengimpor modul yang tidak ada: {missing}")
    order = list(TopologicalSorter(graph).static_order())  # gagal jika ada impor melingkar
    return [(p, sources[p]) for p in order]


def collect_content() -> dict[str, object]:
    return {f.relative_to(CONTENT).as_posix(): json.loads(f.read_text(encoding="utf-8")) for f in CONTENT.rglob("*.json")}


def build_css() -> str:
    font = data_uri(FRONT / "assets/fonts/nunito.woff2", "font/woff2")
    css = "\n".join((FRONT / "css" / n).read_text(encoding="utf-8") for n in ("tokens.css", "base.css", "components.css"))
    return css.replace("url('../assets/fonts/nunito.woff2')", f"url('{font}')")


def safe_json(obj: object) -> str:
    # Cegah "</script>" di dalam data menutup tag script.
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


LOADER = r"""
(function () {
  var C = window.__METIKA_CONTENT__;
  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input.url;
    var m = url.match(/(?:^|\/)content\/([^?#]+)/);
    if (m && C[m[1]]) {
      return Promise.resolve(new Response(JSON.stringify(C[m[1]]), { headers: { 'Content-Type': 'application/json' } }));
    }
    if (/(^|\/)api\//.test(url) && location.protocol === 'file:') {
      return Promise.resolve(new Response('Tidak ada server', { status: 503 }));
    }
    return nativeFetch(input, init);
  };
  function resolve(from, spec) {
    var parts = from.split('/').slice(0, -1);
    spec.split('/').forEach(function (seg) { if (seg === '..') parts.pop(); else if (seg !== '.') parts.push(seg); });
    return parts.join('/');
  }
  var urls = {};
  window.__METIKA_MODULES__.forEach(function (entry) {
    var path = entry[0];
    var code = entry[1].replace(/(from\s*|import\s*\(\s*|import\s+)(['"])(\.{1,2}\/[^'"]+)\2/g, function (all, pre, q, spec) {
      return pre + q + urls[resolve(path, spec)] + q;
    });
    urls[path] = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  });
  var s = document.createElement('script');
  s.type = 'module';
  s.src = urls['js/app.js'];
  document.head.appendChild(s);
})();
"""


def main() -> None:
    modules = collect_modules()
    content = collect_content()
    favicon = data_uri(FRONT / "assets/icons/favicon.png", "image/png")
    html = f"""<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Metika</title>
<meta name="description" content="Belajar Barisan Aritmetika kelas VIII: singkat, banyak contoh, dengan petunjuk bertahap.">
<meta name="theme-color" content="#7DA7D9">
<link rel="icon" href="{favicon}" type="image/png">
<style>
{build_css()}
</style>
</head>
<body>
<a class="skip-link" href="#view">Langsung ke isi</a>
<div class="app">
  <div id="view" tabindex="-1" aria-live="polite">
    <div class="boot" role="status"><span class="boot-mark" aria-hidden="true"></span><p>Memuat Metika…</p></div>
  </div>
</div>
<nav id="bottom-nav" class="bottom-nav" aria-label="Navigasi utama"></nav>
<noscript><p class="noscript">Aplikasi ini membutuhkan JavaScript. Aktifkan JavaScript di browsermu.</p></noscript>
<script>
window.__METIKA_CONTENT__ = {safe_json(content)};
window.__METIKA_MODULES__ = {safe_json(modules)};
{LOADER}
</script>
</body>
</html>
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"[OK] {OUT.relative_to(ROOT)}: {len(modules)} modul JS, {len(content)} file konten, {OUT.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
