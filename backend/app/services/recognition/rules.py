"""规则抽取：优先识别显式标签，再用关键词/版面位置兜底。"""

import re

from app.services.recognition.types import (
    ExtractedDocument,
    FieldCandidate,
    SourceLine,
)

NAME_LABELS = ("企业名称", "公司名称", "单位名称", "公司全称", "企业全称", "名称")
INDUSTRY_LABELS = ("所属行业", "经营行业", "行业", "经营范围")
PHONE_LABELS = ("联系电话", "联系方式", "企业电话", "手机", "电话")
ADDRESS_LABELS = ("注册地址", "办公地址", "企业地址", "公司地址", "地址", "住所")
INTRO_LABELS = ("企业简介", "公司简介", "企业介绍", "公司介绍", "简介", "介绍")

COMPANY_RE = re.compile(
    r"[\u4e00-\u9fa5A-Za-z0-9（）()·]{2,60}"
    r"(?:股份有限公司|有限责任公司|有限公司|集团有限公司|集团|公司)"
)
PHONE_RE = re.compile(r"(?<!\d)(1[3-9]\d{9}|0\d{2,3}[-\s]?\d{7,8})(?!\d)")
ADDRESS_MARKERS = ("省", "市", "区", "县", "路", "街", "号", "大厦", "园区", "镇", "村")

INDUSTRY_KEYWORDS = (
    ("人工智能", "人工智能"),
    ("大数据", "大数据"),
    ("互联网", "互联网"),
    ("软件", "软件"),
    ("SaaS", "企业服务 / SaaS"),
    ("企业服务", "企业服务"),
    ("制造", "制造业"),
    ("零售", "零售"),
    ("物流", "物流"),
    ("教育", "教育"),
    ("金融", "金融"),
    ("医疗", "医疗"),
    ("建筑", "建筑"),
    ("咨询", "咨询"),
)

NOISE_LABELS = (
    "企业名称",
    "公司名称",
    "联系电话",
    "联系方式",
    "企业电话",
    "地址",
    "企业简介",
    "公司简介",
)


def _clean_value(value: str) -> str:
    return value.strip().strip("：:，,。;； \t")


def _label_pattern(labels: tuple[str, ...]) -> re.Pattern:
    joined = "|".join(re.escape(label) for label in sorted(labels, key=len, reverse=True))
    return re.compile(rf"^\s*(?:{joined})\s*[：:]?\s*(.*)$")


_NAME_LABEL_RE = _label_pattern(NAME_LABELS)
_INDUSTRY_LABEL_RE = _label_pattern(INDUSTRY_LABELS)
_ADDRESS_LABEL_RE = _label_pattern(ADDRESS_LABELS)
_INTRO_LABEL_RE = _label_pattern(INTRO_LABELS)


def _find_label(
    lines: list[SourceLine], pattern: re.Pattern
) -> tuple[str, SourceLine, float] | None:
    for index, line in enumerate(lines):
        match = pattern.match(line.text)
        if not match:
            continue
        value = _clean_value(match.group(1))
        source = line
        confidence = 0.95
        if not value and index + 1 < len(lines):
            value = _clean_value(lines[index + 1].text)
            source = lines[index + 1]
            confidence = 0.9
        if value:
            return value, source, confidence
    return None


def _looks_like_address(value: str) -> bool:
    return len(value) >= 6 and any(marker in value for marker in ADDRESS_MARKERS)


def _extract_name(lines: list[SourceLine]) -> FieldCandidate | None:
    labeled = _find_label(lines, _NAME_LABEL_RE)
    if labeled:
        value, source, confidence = labeled
        if 2 <= len(value) <= 100:
            return FieldCandidate(value[:100], confidence, source, "label")

    for line in lines:
        if any(label in line.text for label in NOISE_LABELS):
            continue
        match = COMPANY_RE.search(line.text)
        if match:
            value = _clean_value(match.group(0))
            if len(value) >= 4:
                return FieldCandidate(value[:100], 0.7, line, "company_suffix")
    return None


def _extract_industry(lines: list[SourceLine]) -> FieldCandidate | None:
    labeled = _find_label(lines, _INDUSTRY_LABEL_RE)
    if labeled:
        value, source, confidence = labeled
        if len(value) >= 2:
            return FieldCandidate(value[:50], confidence, source, "label")

    text = "\n".join(line.text for line in lines)
    for keyword, industry in INDUSTRY_KEYWORDS:
        if keyword.lower() in text.lower():
            return FieldCandidate(industry, 0.6, None, "keyword")
    return None


def _extract_phone(lines: list[SourceLine]) -> FieldCandidate | None:
    for line in lines:
        match = PHONE_RE.search(line.text)
        if not match:
            continue
        value = match.group(1).replace(" ", "")
        confidence = 0.98 if any(label in line.text for label in PHONE_LABELS) else 0.78
        return FieldCandidate(value[:20], confidence, line, "phone_regex")
    return None


def _extract_address(lines: list[SourceLine]) -> FieldCandidate | None:
    labeled = _find_label(lines, _ADDRESS_LABEL_RE)
    if labeled:
        value, source, confidence = labeled
        if _looks_like_address(value):
            return FieldCandidate(value[:200], confidence, source, "label")

    for line in lines:
        text = _clean_value(line.text)
        if not _looks_like_address(text):
            continue
        if PHONE_RE.search(text) or any(label in text for label in NAME_LABELS):
            continue
        return FieldCandidate(text[:200], 0.62, line, "address_marker")
    return None


def _extract_intro(lines: list[SourceLine]) -> FieldCandidate | None:
    for index, line in enumerate(lines):
        match = _INTRO_LABEL_RE.match(line.text)
        if not match:
            continue
        value = _clean_value(match.group(1))
        source = line
        confidence = 0.92
        if not value:
            collected: list[str] = []
            for next_line in lines[index + 1 : index + 4]:
                text = _clean_value(next_line.text)
                if not text:
                    continue
                if any(label in text for label in NOISE_LABELS):
                    break
                collected.append(text)
                source = next_line
            value = " ".join(collected)
            confidence = 0.82
        if len(value) >= 10:
            return FieldCandidate(value[:2000], confidence, source, "label")

    # 没有显式简介标签时，取正文前几行中非联系方式内容兜底
    collected: list[str] = []
    source = None
    for line in lines[:6]:
        text = _clean_value(line.text)
        if any(label in text for label in NOISE_LABELS):
            continue
        if PHONE_RE.search(text) or COMPANY_RE.fullmatch(text):
            continue
        if len(text) >= 8:
            collected.append(text)
            source = line
        if len(" ".join(collected)) >= 40:
            break
    value = " ".join(collected)
    if len(value) >= 10:
        return FieldCandidate(value[:2000], 0.55, source, "paragraph_fallback")
    return None


def extract_fields(document: ExtractedDocument) -> dict[str, FieldCandidate]:
    lines = [line for line in document.lines if line.text.strip()]
    if not lines:
        return {}

    fields: dict[str, FieldCandidate] = {}
    extractors = {
        "name": _extract_name,
        "industry": _extract_industry,
        "phone": _extract_phone,
        "address": _extract_address,
        "intro": _extract_intro,
    }
    for field, extractor in extractors.items():
        candidate = extractor(lines)
        if candidate is not None:
            fields[field] = candidate
    return fields
