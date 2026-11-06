"""本地文档解析：PDF 文本层、DOCX 段落/表格、图片 OCR。"""

import io
import logging
import threading
from pathlib import Path

import pymupdf
from docx import Document as DocxDocument
from PIL import Image, ImageOps

from app.services.recognition.types import ExtractedDocument, SourceLine

logger = logging.getLogger("talentlink.recognition.extract")

PDF_TEXT_MIN_CHARS = 20
OCR_MIN_SCORE = 0.25

_ocr_engine = None
_ocr_lock = threading.Lock()


def _get_ocr_engine():
    global _ocr_engine
    if _ocr_engine is None:
        with _ocr_lock:
            if _ocr_engine is None:
                from rapidocr import RapidOCR

                _ocr_engine = RapidOCR()
    return _ocr_engine


def _ocr_image(image: Image.Image, page: int | None) -> list[SourceLine]:
    engine = _get_ocr_engine()
    with _ocr_lock:
        result = engine(image)

    if result is None or not result.txts:
        return []

    scores = (
        result.scores
        if result.scores is not None
        else [0.0] * len(result.txts)
    )
    boxes = (
        result.boxes
        if result.boxes is not None
        else [None] * len(result.txts)
    )
    lines: list[SourceLine] = []
    for text, score, box in zip(result.txts, scores, boxes):
        text = str(text).strip()
        if not text or score is None or float(score) < OCR_MIN_SCORE:
            continue
        bbox = None
        if box is not None and len(box) > 0:
            xs = [float(point[0]) for point in box]
            ys = [float(point[1]) for point in box]
            bbox = [min(xs), min(ys), max(xs), max(ys)]
        lines.append(
            SourceLine(
                text=text,
                page=page,
                bbox=bbox,
                score=float(score),
                method="ocr",
            )
        )
    return lines


def _extract_pdf(path: Path) -> ExtractedDocument:
    lines: list[SourceLine] = []
    ocr_used = False
    warnings: list[str] = []

    document = pymupdf.open(str(path))
    try:
        pages = document.page_count
        for index in range(pages):
            page = document[index]
            page_lines: list[SourceLine] = []
            for block in page.get_text("blocks", sort=True):
                text = str(block[4]).strip()
                if not text:
                    continue
                bbox = [float(block[0]), float(block[1]), float(block[2]), float(block[3])]
                for line in text.splitlines():
                    line = line.strip()
                    if line:
                        page_lines.append(
                            SourceLine(
                                text=line,
                                page=index + 1,
                                bbox=bbox,
                                score=1.0,
                                method="pdf_text",
                            )
                        )

            # 文本层太少，按扫描页处理；常见于扫描 PDF
            if sum(len(line.text) for line in page_lines) < PDF_TEXT_MIN_CHARS:
                pixmap = page.get_pixmap(dpi=200)
                image = Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGB")
                ocr_lines = _ocr_image(image, page=index + 1)
                if ocr_lines:
                    page_lines = ocr_lines
                    ocr_used = True
                elif not page_lines:
                    warnings.append(f"第 {index + 1} 页没有提取到文字")

            lines.extend(page_lines)
    finally:
        document.close()

    if ocr_used:
        warnings.append("部分或全部页面使用了本地 OCR")
    return ExtractedDocument(
        lines=lines,
        pages=pages,
        ocr_used=ocr_used,
        warnings=warnings,
    )


def _extract_docx(path: Path) -> ExtractedDocument:
    document = DocxDocument(str(path))
    lines: list[SourceLine] = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        if text:
            lines.append(
                SourceLine(text=text, score=1.0, method="docx_paragraph")
            )

    for table in document.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if not cells:
                continue
            if len(cells) >= 2:
                text = f"{cells[0]}：{cells[1]}"
                if len(cells) > 2:
                    text += " " + " ".join(cells[2:])
            else:
                text = cells[0]
            lines.append(SourceLine(text=text, score=1.0, method="docx_table"))

    return ExtractedDocument(
        lines=lines,
        pages=1,
        ocr_used=False,
        warnings=[],
    )


def _extract_image(path: Path) -> ExtractedDocument:
    image = ImageOps.exif_transpose(Image.open(str(path))).convert("RGB")
    lines = _ocr_image(image, page=1)
    warnings = ["图片已使用本地 OCR"] if lines else ["图片没有识别到文字"]
    return ExtractedDocument(
        lines=lines,
        pages=1,
        ocr_used=True,
        warnings=warnings,
    )


def extract_document(path: Path, suffix: str) -> ExtractedDocument:
    suffix = suffix.lower()
    if suffix == ".pdf":
        return _extract_pdf(path)
    if suffix == ".docx":
        return _extract_docx(path)
    if suffix in {".png", ".jpg", ".jpeg"}:
        return _extract_image(path)
    raise ValueError(f"不支持的文档类型：{suffix}")
