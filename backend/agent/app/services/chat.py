"""Thin chat facade used by HTTP routes."""

from collections.abc import AsyncIterator

from app.services.conversation import stream_response


async def stream_message(session_id: str, content: str) -> AsyncIterator[str]:
    """Equivalent entry to the design-doc Chat API (mapped to /api/agent sessions messages)."""
    async for chunk in stream_response(session_id, content):
        yield chunk
