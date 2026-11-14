import json
import random
from pathlib import Path

import pytest

from backend.app.services import solver

CASES = json.loads((Path(__file__).parent / "fixtures" / "expr_cases.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", CASES["evaluate"], ids=lambda c: c["expr"])
def test_evaluate_matches_fixture(case):
    result = solver.evaluate(case["expr"], case["env"])
    if isinstance(case["result"], bool):
        assert result is case["result"]
    else:
        assert solver.clean(result) == pytest.approx(case["result"])


@pytest.mark.parametrize("expr", CASES["errors"])
def test_rejects_unsafe_or_invalid(expr):
    with pytest.raises(solver.ExprError):
        solver.evaluate(expr, {"a": 1, "b": 2})


@pytest.mark.parametrize("case", CASES["format"], ids=lambda c: c["text"])
def test_format_id(case):
    assert solver.format_id(case["value"], paren_negative=case["paren"]) == case["text"]


@pytest.mark.parametrize("case", CASES["render"], ids=lambda c: c["text"])
def test_render(case):
    assert solver.render(case["template"], case["env"]) == case["text"]


def test_sample_respects_exclude_and_constraints():
    tpl = {
        "params": {"a": [-10, 30], "b": [-6, 9], "n": [6, 30]},
        "exclude": {"b": [0]},
        "constraints": ["abs(a + (n - 1) * b) <= 100"],
    }
    rng = random.Random(1)
    for _ in range(300):
        env = solver.sample_template(tpl, rng)
        assert env["b"] != 0
        assert abs(env["a"] + (env["n"] - 1) * env["b"]) <= 100
        assert env["u2"] - env["u1"] == env["b"]


def test_compute_vars_custom_sequence():
    tpl = {"seq": "a + (k - 1) * b + flag * (k - 1) * (k - 2) / 2"}
    env = solver.compute_vars(tpl, {"a": 1, "b": 2, "flag": 1})
    diffs = [env[f"u{k + 1}"] - env[f"u{k}"] for k in range(1, 5)]
    assert diffs == [2, 3, 4, 5]
