"""Validasi semua konten di content/.

Pemakaian:  python scripts/validate_content.py
Keluar dengan kode 1 jika ada kesalahan.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.app.services.content_loader import (  # noqa: E402
    SAMPLES_PER_TEMPLATE,
    manifest,
    templates,
    validate_all,
)
 

def main() -> int:
    errors = validate_all()
    if errors:
        print(f"[X] {len(errors)} kesalahan konten:")
        for err in errors:
            print("  -", err)
        return 1
    man = manifest()
    print(
        f"[OK] Konten valid (versi {man.version}): {len(man.modules)} modul, "
        f"{len(templates())} template x {SAMPLES_PER_TEMPLATE} sampel acak."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
