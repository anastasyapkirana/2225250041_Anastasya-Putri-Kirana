from backend.app.services import content_loader as loader


def test_all_content_is_valid():
    errors = loader.validate_all()
    assert errors == [], "\n".join(errors)


def test_every_module_has_examples_before_practice():
    """Aturan CLAUDE.md #5: contoh dulu, lalu soal."""
    for entry in loader.manifest().modules:
        kinds = [s.kind for s in loader.module(entry.id).steps]
        if "practice" in kinds:
            first_practice = kinds.index("practice")
            assert kinds[:first_practice].count("example") >= 3, entry.id


def test_every_template_has_three_hints():
    for tid, tpl in loader.templates().items():
        assert len(tpl.hints) == 3, tid
