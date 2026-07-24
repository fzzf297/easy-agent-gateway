from typing import Any, Literal

from pydantic import Field

from app.schemas.common import ApiModel

ResponseMode = Literal["TEXT", "TEXT_WITH_A2UI", "A2UI_ONLY"]


class A2UICreateSurface(ApiModel):
    surfaceId: str = Field(..., min_length=1, max_length=128)
    catalogId: str
    catalogVersion: str
    rootId: str


class A2UIUpdateComponents(ApiModel):
    surfaceId: str
    components: list[dict[str, Any]] = Field(..., max_length=80)


class A2UIUpdateDataModel(ApiModel):
    surfaceId: str
    dataModel: dict[str, Any]


class A2UIDeleteSurface(ApiModel):
    surfaceId: str


class A2UIActionIn(ApiModel):
    conversationId: str = Field(..., min_length=1, max_length=64)
    messageId: str = Field(default="", max_length=64)
    surfaceId: str = Field(..., min_length=1, max_length=128)
    idempotencyKey: str = Field(..., min_length=8, max_length=128)
    action: dict[str, Any]


class A2UIActionOut(ApiModel):
    ok: bool
    message: str = ""
    responseMode: ResponseMode = "TEXT"
    text: str = ""
    a2uiMessages: list[dict[str, Any]] = Field(default_factory=list)


class A2UICatalogOut(ApiModel):
    catalogId: str
    version: str
    components: list[str]
    actions: list[str]
