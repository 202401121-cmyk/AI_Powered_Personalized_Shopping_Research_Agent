"""The one LLM wrapper (US-26). The only package allowed to talk to an LLM provider (build rule 1).

from app.llm import build_llm_client
llm = build_llm_client()
result = llm.complete(LLMTask.EXTRACT_CLAIMS, SYSTEM_PROMPT, text, RawExtraction)
"""

from .client import InMemoryCallLog, WrapperLLMClient, build_llm_client
from .config import load_llm_config

__all__ = ["InMemoryCallLog", "WrapperLLMClient", "build_llm_client", "load_llm_config"]
