"""The one LLM wrapper (US-26). The only package allowed to talk to an LLM provider (build rule 1)."""

from .config import load_llm_config

__all__ = ["load_llm_config"]
