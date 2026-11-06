"""求职者简历的本地 OCR/规则抽取。"""

import re
import time
from datetime import date
from pathlib import Path
from typing import Any

from app.services.recognition.extractors import extract_document
from app.services.recognition.provider import RecognitionError
from app.services.recognition.types import ExtractedDocument, FieldCandidate, SourceLine

FIELD_WEIGHTS = {
    "name": 12,
    "gender": 4,
    "birth_date": 8,
    "phone": 12,
    "email": 8,
    "household": 4,
    "education": 8,
    "major": 5,
    "degree": 4,
    "school": 8,
    "skills": 10,
    "job_intention": 8,
    "expected_salary_min": 4,
    "expected_salary_max": 5,
}

FIELD_LABELS = {
    "name": "姓名",
    "gender": "性别",
    "birth_date": "出生日期",
    "phone": "联系电话",
    "email": "邮箱",
    "household": "户籍所在地",
    "education": "学历",
    "major": "专业",
    "degree": "学位",
    "school": "毕业学校",
    "skills": "技能",
    "job_intention": "求职意向",
    "expected_salary_min": "期望薪资下限",
    "expected_salary_max": "期望薪资上限",
}

LABELS = {
    "name": ("姓名", "名字"),
    "gender": ("性别",),
    "birth_date": ("出生日期", "出生年月", "生日"),
    "phone": ("联系电话", "手机号码", "手机", "电话"),
    "email": ("电子邮箱", "邮箱", "Email", "E-mail"),
    "household": ("户籍所在地", "户籍", "籍贯"),
    "education": ("最高学历", "学历", "教育背景"),
    "major": ("所学专业", "专业"),
    "degree": ("学位",),
    "school": ("毕业院校", "毕业学校", "学校"),
    "skills": ("专业技能", "技能特长", "技能", "能力"),
    "job_intention": ("求职意向", "意向岗位", "目标岗位", "应聘岗位"),
    "expected_salary": ("期望薪资", "期望工资", "薪资要求", "期望月薪"),
}

PHONE_RE = re.compile(r"(?<!\d)(1[3-9]\d{9}|0\d{2,3}[-\s]?\d{7,8})(?!\d)")
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
DATE_RE = re.compile(r"(\d{4})\s*[年./-]\s*(\d{1,2})\s*[月./-]\s*(\d{1,2})")
SALARY_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*[kK千]?\s*[-~至到]\s*(\d+(?:\.\d+)?)\s*[kK千]?"
)
SALARY_SINGLE_RE = re.compile(r"(\d+(?:\.\d+)?)\s*[kK千]?")


def _clean(value: str) -> str:
    return value.strip().strip("：:，,。;； \t")


def _find_label(
    lines: list[SourceLine], labels: tuple[str, ...]
) -> tuple[str, SourceLine, float] | None:
    joined = "|".join(re.escape(label) for label in sorted(labels, key=len, reverse=True))
    pattern = re.compile(rf"^\s*(?:{joined})\s*[：:]?\s*(.*)$")
    for index, line in enumerate(lines):
        match = pattern.match(line.text)
        if not match:
            continue
        value = _clean(match.group(1))
        source = line
        confidence = 0.94
        if not value and index + 1 < len(lines):
            value = _clean(lines[index + 1].text)
            source = lines[index + 1]
            confidence = 0.88
        if value:
            return value, source, confidence
    return None


def _add(
    fields: dict[str, FieldCandidate],
    key: str,
    value: str,
    source: SourceLine | None,
    confidence: float,
) -> None:
    if value:
        fields[key] = FieldCandidate(value, confidence, source, "label")


def _parse_birth(value: str) -> str | None:
    match = DATE_RE.search(value)
    if not match:
        return None
    try:
        parsed = date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    except ValueError:
        return None
    if parsed > date.today():
        return None
    return parsed.isoformat()


def _parse_salary(value: str) -> tuple[int, int] | None:
    text = value.replace(",", "")
    match = SALARY_RE.search(text)
    if match:
        low = float(match.group(1))
        high = float(match.group(2))
    else:
        single = SALARY_SINGLE_RE.search(text)
        if not single:
            return None
        low = high = float(single.group(1))

    if "k" in text.lower() or "千" in text or max(low, high) < 1000:
        low *= 1000
        high *= 1000
    low_i, high_i = int(low), int(high)
    if low_i <= 0 or high_i <= 0 or low_i > high_i:
        return None
    return low_i, high_i


def extract_seeker_fields(document: ExtractedDocument) -> dict[str, FieldCandidate]:
    lines = [line for line in document.lines if line.text.strip()]
    fields: dict[str, FieldCandidate] = {}
    if not lines:
        return fields

    for key in ("name", "gender", "household", "education", "major", "degree", "school", "skills", "job_intention"):
        found = _find_label(lines, LABELS[key])
        if found:
            value, source, confidence = found
            if key == "gender":
                gender = "男" if "男" in value else "女" if "女" in value else ""
                _add(fields, key, gender, source, confidence)
            else:
                _add(fields, key, value, source, confidence)

    birth = _find_label(lines, LABELS["birth_date"])
    if birth:
        parsed = _parse_birth(birth[0])
        if parsed:
            _add(fields, "birth_date", parsed, birth[1], birth[2])

    phone = _find_label(lines, LABELS["phone"])
    if phone:
        match = PHONE_RE.search(phone[0])
        if match:
            _add(fields, "phone", match.group(1).replace(" ", ""), phone[1], 0.98)

    email = _find_label(lines, LABELS["email"])
    if email:
        match = EMAIL_RE.search(email[0])
        if match:
            _add(fields, "email", match.group(0), email[1], 0.96)

    salary = _find_label(lines, LABELS["expected_salary"])
    if salary:
        parsed = _parse_salary(salary[0])
        if parsed:
            _add(fields, "expected_salary_min", str(parsed[0]), salary[1], 0.9)
            _add(fields, "expected_salary_max", str(parsed[1]), salary[1], 0.9)

    # 无标签时从正文补充手机号/邮箱
    if "phone" not in fields:
        for line in lines:
            match = PHONE_RE.search(line.text)
            if match:
                _add(fields, "phone", match.group(1).replace(" ", ""), line, 0.76)
                break
    if "email" not in fields:
        for line in lines:
            match = EMAIL_RE.search(line.text)
            if match:
                _add(fields, "email", match.group(0), line, 0.76)
                break
    if "school" not in fields:
        for line in lines:
            match = re.search(r"[\u4e00-\u9fa5]{2,20}(?:大学|学院|学校)", line.text)
            if match:
                _add(fields, "school", match.group(0), line, 0.62)
                break

    return fields


def _validate(key: str, value: str) -> float:
    if key == "gender":
        return 1.0 if value in {"男", "女"} else 0.4
    if key == "birth_date":
        return 1.0 if DATE_RE.fullmatch(value) or re.fullmatch(r"\d{4}-\d{2}-\d{2}", value) else 0.3
    if key == "phone":
        return 1.0 if PHONE_RE.fullmatch(value) else 0.3
    if key == "email":
        return 1.0 if EMAIL_RE.fullmatch(value) else 0.3
    if key.startswith("expected_salary"):
        return 1.0 if value.isdigit() and int(value) > 0 else 0.3
    if key == "skills":
        return 1.0 if len(value) >= 3 else 0.5
    return 1.0 if len(value) >= 2 else 0.4


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


def build_seeker_result(
    document: ExtractedDocument,
    fields: dict[str, FieldCandidate],
    *,
    duration_ms: int,
) -> dict[str, Any]:
    output: dict[str, dict[str, Any]] = {}
    for key, candidate in fields.items():
        text_quality = (
            candidate.line.score
            if candidate.line is not None and candidate.line.score is not None
            else 0.78
        )
        confidence = round(
            max(
                0.0,
                min(
                    1.0,
                    0.5 * text_quality
                    + 0.3 * candidate.extraction_confidence
                    + 0.2 * _validate(key, candidate.value),
                ),
            ),
            3,
        )
        output[key] = {
            "value": candidate.value,
            "confidence": confidence,
            "source": _source(candidate),
        }

    overall = round(
        sum(
            FIELD_WEIGHTS[key] * value["confidence"]
            for key, value in output.items()
        )
        / 100,
        3,
    )
    missing = [
        FIELD_LABELS[key]
        for key in FIELD_WEIGHTS
        if key not in output
    ]
    warnings = list(document.warnings)
    if missing:
        warnings.append("未识别到：" + "、".join(missing))
    if len(output) == 0:
        warnings.append("未提取到可回填字段，请手动填写")
    elif overall < 0.6:
        warnings.append("识别置信度较低，请逐项核对")
    warnings = list(dict.fromkeys(warnings))

    return {
        "schema_version": "recognition.v1",
        "provider": "local-seeker",
        "model": "rapidocr-onnxruntime+seeker-rule-v1",
        "document_type": "seeker_resume",
        "confidence": overall,
        "fields": output,
        "warnings": warnings,
        "meta": {
            "pages": document.pages,
            "ocr_used": document.ocr_used,
            "text_length": document.text_length,
            "duration_ms": duration_ms,
        },
    }


def recognize_seeker_resume(path: Path, suffix: str) -> dict[str, Any]:
    started = time.perf_counter()
    document = extract_document(path, suffix)
    if not document.lines:
        raise RecognitionError(
            "未从简历中提取到文字，请确认文件清晰，或改用文本型 PDF/DOCX"
        )
    fields = extract_seeker_fields(document)
    duration_ms = int((time.perf_counter() - started) * 1000)
    return build_seeker_result(document, fields, duration_ms=duration_ms)
