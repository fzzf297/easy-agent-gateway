from typing import Any, Optional

from pydantic import Field

from app.schemas.common import ApiModel


class CreateSessionIn(ApiModel):
    user_label: str = Field(default="", max_length=200)


class SessionOut(ApiModel):
    sessionId: str
    summary: str
    createdAt: str
    updatedAt: str


class SendMessageIn(ApiModel):
    content: str = Field(..., min_length=1, max_length=10000)


class MessageOut(ApiModel):
    role: str
    content: str
    createdAt: str
    responseMode: str = "TEXT"
    surfaceIds: list[str] = Field(default_factory=list)


class HistoryOut(ApiModel):
    sessionId: str
    messages: list[MessageOut]


class SessionScoreIn(ApiModel):
    score: int = Field(..., ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


class SessionScoreOut(ApiModel):
    sessionId: str
    userLabel: str
    score: int
    comment: str
    createdAt: str
    updatedAt: str


class SseEvent(ApiModel):
    type: str
    payload: Optional[Any] = None
