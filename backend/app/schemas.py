"""Skema Pydantic untuk konten dan data penelitian."""

from __future__ import annotations

import re
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

TAG_RE = re.compile(r"<[^>]+>")
CONCEPT_MAX_WORDS = 60
HOOK_MAX_WORDS = 40


def word_count(html: str) -> int:
    return len(TAG_RE.sub(" ", html).split())


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# ---------- Konten: modul ----------


class HookStep(_Strict):
    kind: Literal["hook"]
    title: str
    text: str
    visual: str | None = None
    reveal: str | None = None

    @field_validator("text")
    @classmethod
    def _short(cls, v: str) -> str:
        if word_count(v) > HOOK_MAX_WORDS:
            raise ValueError(f"Teks pemantik > {HOOK_MAX_WORDS} kata")
        return v


class ConceptStep(_Strict):
    kind: Literal["concept"]
    title: str
    text: str
    visual: str | None = None

    @field_validator("text")
    @classmethod
    def _short(cls, v: str) -> str:
        if word_count(v) > CONCEPT_MAX_WORDS:
            raise ValueError(f"Teks konsep {word_count(v)} kata (> {CONCEPT_MAX_WORDS})")
        return v


class ExampleStep(_Strict):
    kind: Literal["example"]
    title: str
    problem: str
    steps: list[str] = Field(min_length=1)
    visual: str | None = None


class FadedStep(_Strict):
    kind: Literal["faded"]
    title: str
    problem: str
    steps: list[str] = Field(min_length=1)


class Discussion(_Strict):
    """Pembahasan setelah soal selesai: ilustrasi (opsional) + langkah."""

    visual: str | None = None
    steps: list[str] = Field(min_length=1)


class ExplainOption(_Strict):
    text: str
    correct: bool
    why: str


class ExplainStep(_Strict):
    kind: Literal["explain"]
    title: str
    question: str
    visual: str | None = None
    options: list[ExplainOption] = Field(min_length=2)
    discussion: Discussion | None = None


class PracticeStep(_Strict):
    kind: Literal["practice"]
    title: str
    templates: list[str] = Field(min_length=1)
    count: int = Field(ge=1, le=20)


class Choice(_Strict):
    question: str | None = None
    options: list[str] = Field(min_length=2)
    answer: int
    hint: str | None = None
    explanation: str | None = None


class StoryStep(_Strict):
    kind: Literal["story"]
    id: str
    title: str
    context: str
    text: str
    visual: str | None = None
    known: Choice
    asked: Choice
    model: dict[str, float]
    target: Literal["un", "n"]
    expected: float
    unit: str
    money: bool = False
    interpret: Choice
    reason: Choice | None = None
    discussion: Discussion | None = None


class McqStep(_Strict):
    kind: Literal["mcq"]
    title: str
    context: str | None = None
    question: str
    visual: str | None = None
    options: list[str] = Field(min_length=2)
    answer: int
    explanation: str
    discussion: Discussion | None = None


class QuizItem(_Strict):
    type: Literal["numeric", "mcq"]
    prompt: str
    answer: float
    options: list[str] | None = None
    explanation: str | None = None
    indicator: str | None = None


class QuizStep(_Strict):
    kind: Literal["quiz"]
    title: str
    items: list[QuizItem] = Field(min_length=1)


Step = Annotated[
    HookStep | ConceptStep | ExampleStep | FadedStep | ExplainStep | PracticeStep | StoryStep | McqStep | QuizStep,
    Field(discriminator="kind"),
]


class Module(_Strict):
    id: str
    title: str
    goal: str
    steps: list[Step] = Field(min_length=1)


class ManifestModule(_Strict):
    id: str
    order: int
    title: str
    subtitle: str
    minutes: int
    file: str


class Manifest(_Strict):
    version: str
    modules: list[ManifestModule]
    templates: str
    misconceptions: str
    challenge: str
    tests: str
    surveys: str


# ---------- Konten: template soal ----------


class TemplateField(_Strict):
    key: str
    label: str
    answer: str
    type: Literal["number", "choice"] = "number"
    options: list[str] | None = None
    misconceptions: list[str] = []
    chip: Literal["a", "b", "n"] | None = None


class QuestionTemplate(_Strict):
    topic: str
    title: str
    params: dict[str, tuple[int, int]]
    exclude: dict[str, list[int]] = {}
    constraints: list[str] = []
    seq: str | None = None
    derived: dict[str, str] = {}
    prompt: str
    fields: list[TemplateField] = Field(min_length=1)
    hints: list[str] = Field(min_length=3, max_length=3)
    solution: list[str] = Field(min_length=1)
    check: bool = False
    visual: str | None = None


class Misconception(_Strict):
    msg: str
    expr: str | None = None
    near: bool = False


# ---------- Data penelitian ----------

EventType = Literal[
    "app_open",
    "step_view",
    "answer",
    "hint",
    "check_calc",
    "practice_done",
    "story_step",
    "quiz_done",
    "module_done",
    "challenge_done",
    "test_done",
    "install",
]

ANON_RE = r"^[a-z0-9]{8,32}$"


class Participant(_Strict):
    anon_id: str = Field(pattern=ANON_RE)
    class_code: str = Field(min_length=1, max_length=32)
    app_version: str | None = Field(default=None, max_length=32)


class Event(_Strict):
    client_id: str = Field(min_length=8, max_length=64)
    anon_id: str = Field(pattern=ANON_RE)
    type: EventType
    module_id: str | None = Field(default=None, max_length=16)
    item_id: str | None = Field(default=None, max_length=64)
    payload: dict[str, Any] = {}
    client_ts: str = Field(max_length=40)


class EventBatch(_Strict):
    events: list[Event] = Field(max_length=200)


class Survey(_Strict):
    client_id: str = Field(min_length=8, max_length=64)
    anon_id: str = Field(pattern=ANON_RE)
    kind: Literal["mental_effort", "cl_questionnaire", "practicality"]
    module_id: str | None = Field(default=None, max_length=16)
    answers: dict[str, float]
    client_ts: str = Field(max_length=40)
