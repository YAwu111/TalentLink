from dataclasses import dataclass, field


@dataclass
class SourceLine:
    text: str
    page: int | None = None
    bbox: list[float] | None = None
    score: float | None = None
    method: str = "text"


@dataclass
class ExtractedDocument:
    lines: list[SourceLine]
    pages: int
    ocr_used: bool
    warnings: list[str] = field(default_factory=list)

    @property
    def text_length(self) -> int:
        return sum(len(line.text) for line in self.lines)


@dataclass
class FieldCandidate:
    value: str
    extraction_confidence: float
    line: SourceLine | None
    method: str
