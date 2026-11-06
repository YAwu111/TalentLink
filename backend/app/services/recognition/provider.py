import time
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.services.recognition.confidence import build_result
from app.services.recognition.extractors import extract_document
from app.services.recognition.rules import extract_fields


class RecognitionError(Exception):
    """文档无法完成本地识别。"""


class LocalRecognitionProvider:
    id = "local"
    model = "rapidocr-onnxruntime+rule-v1"

    def recognize(self, path: Path, suffix: str) -> dict[str, Any]:
        started = time.perf_counter()
        document = extract_document(path, suffix)
        if not document.lines:
            raise RecognitionError(
                "未从文档中提取到文字，请确认文件清晰，或改用文本型 PDF/DOCX"
            )

        candidates = extract_fields(document)
        duration_ms = int((time.perf_counter() - started) * 1000)
        return build_result(
            document,
            candidates,
            provider=self.id,
            model=self.model,
            duration_ms=duration_ms,
        )


class MockRecognitionProvider:
    id = "mock"
    model = "mock-rule-v0"

    def recognize(self, _path: Path, _suffix: str) -> dict[str, Any]:
        fields = {
            "name": {"value": "星河科技（上海）有限公司", "confidence": 0.96},
            "industry": {"value": "企业服务 / SaaS", "confidence": 0.91},
            "phone": {"value": "021-58881234", "confidence": 0.88},
            "address": {
                "value": "上海市浦东新区张江路 88 号 3 层",
                "confidence": 0.93,
            },
            "intro": {
                "value": "星河科技专注企业级 SaaS 产品研发，团队约 200 人，已完成 B 轮融资。",
                "confidence": 0.84,
            },
        }
        return {
            "schema_version": "recognition.v1",
            "provider": self.id,
            "model": self.model,
            "document_type": "intro",
            "confidence": 0.92,
            "fields": fields,
            "warnings": ["当前使用 mock 识别适配器，仅用于联调。"],
            "meta": {
                "pages": 1,
                "ocr_used": False,
                "text_length": 0,
                "duration_ms": 0,
            },
        }


def get_provider() -> LocalRecognitionProvider | MockRecognitionProvider:
    provider = settings.RECOGNITION_PROVIDER.strip().lower()
    if provider == "mock":
        return MockRecognitionProvider()
    return LocalRecognitionProvider()
