"""企业介绍文档的本地 OCR/规则识别。"""

from app.services.recognition.provider import (
    LocalRecognitionProvider,
    MockRecognitionProvider,
    RecognitionError,
    get_provider,
)

__all__ = [
    "LocalRecognitionProvider",
    "MockRecognitionProvider",
    "RecognitionError",
    "get_provider",
]
