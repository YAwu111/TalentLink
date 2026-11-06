"""字段校验与置信度：OCR 质量 × 抽取方式 × 业务校验。"""

from typing import Any

from app.services.recognition.rules import ADDRESS_MARKERS, COMPANY_RE, PHONE_RE
from app.services.recognition.types import ExtractedDocument, FieldCandidate

FIELD_IMPORTANCE: dict[str, float] = {
    "name": 0.30,
    "industry": 0.15,
    "phone": 0.20,
    "address": 0.15,
    "intro": 0.20,
}

FIELD_LABELS = {
    "name": "企业名称",
    "industry": "经营行业",
    "phone": "企业电话",
    "address": "企业地址",
    "intro": "企业简介",
}


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _validate(field: str, value: str) -> float:
    value = value.strip()
    if field == "name":
        if len(value) >= 4 and COMPANY_RE.fullmatch(value):
            return 1.0
        if len(value) >= 2:
            return 0.45
        return 0.2
    if field == "industry":
        return 1.0 if 2 <= len(value) <= 50 else 0.3
    if field == "phone":
        return 1.0 if PHONE_RE.fullmatch(value) else 0.3
    if field == "address":
        if len(value) >= 6 and any(marker in value for marker in ADDRESS_MARKERS):
            return 1.0
        return 0.35
    if field == "intro":
        if len(value) >= 10:
            return 1.0
        return 0.4
    return 0.5


def _field_confidence(candidate: FieldCandidate, validation: float) -> float:
    text_quality = (
        candidate.line.score
        if candidate.line is not None and candidate.line.score is not None
        else 0.75
    )
    return round(
        _clamp(
            0.50 * text_quality
            + 0.30 * candidate.extraction_confidence
            + 0.20 * validation
        ),
        3,
    )


def _source(candidate: FieldCandidate) -> dict[str, Any] | None:
    line = candidate.line
    if line is None:
        return None
    return {
        "page": line.page,
        "bbox": line.bbox,
        "text": line.text[:160],
        "method": line.method,
    }


def build_result(
    document: ExtractedDocument,
    candidates: dict[str, FieldCandidate],
    *,
    provider: str,
    model: str,
    duration_ms: int,
) -> dict[str, Any]:
    fields: dict[str, dict[str, Any]] = {}
    warnings = list(document.warnings)

    for field, importance in FIELD_IMPORTANCE.items():
        candidate = candidates.get(field)
        if candidate is None:
            continue
        validation = _validate(field, candidate.value)
        fields[field] = {
            "value": candidate.value,
            "confidence": _field_confidence(candidate, validation),
            "source": _source(candidate),
        }

    overall = round(
        sum(
            FIELD_IMPORTANCE[field] * item["confidence"]
            for field, item in fields.items()
        ),
        3,
    )

    missing = [
        FIELD_LABELS[field]
        for field in FIELD_IMPORTANCE
        if field not in fields
    ]
    if missing:
        warnings.append("未识别到：" + "、".join(missing))
    if not fields:
        warnings.append("未提取到可填充字段，请人工填写企业资料")
    elif overall < 0.6:
        warnings.append("整体置信度较低，请逐项核对后再应用")

    ocr_scores = [
        line.score
        for line in document.lines
        if line.method == "ocr" and line.score is not None
    ]
    if ocr_scores and sum(ocr_scores) / len(ocr_scores) < 0.6:
        warnings.append("OCR 文字质量偏低，建议上传更清晰的扫描件")

    # 去重，避免同一提醒重复出现
    warnings = list(dict.fromkeys(warnings))

    return {
        "schema_version": "recognition.v1",
        "provider": provider,
        "model": model,
        "document_type": "intro",
        "confidence": overall,
        "fields": fields,
        "warnings": warnings,
        "meta": {
            "pages": document.pages,
            "ocr_used": document.ocr_used,
            "text_length": document.text_length,
            "duration_ms": duration_ms,
        },
    }
