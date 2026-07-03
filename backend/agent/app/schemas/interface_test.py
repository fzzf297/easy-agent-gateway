from typing import Any, Optional

from pydantic import Field

from app.schemas.common import ApiModel


class InterfaceTestIn(ApiModel):
    projectCode: str = Field(..., min_length=1, max_length=64)
    interfaceCode: str = Field(..., min_length=1, max_length=64)
    params: dict[str, Any] = Field(default_factory=dict)


class InterfaceTestError(ApiModel):
    code: str
    statusCode: int


class InterfaceTestOut(ApiModel):
    ok: bool
    projectCode: str
    interfaceCode: str
    durationMs: int
    authUsed: bool = False
    data: Optional[Any] = None
    preview: str = ""
    error: Optional[InterfaceTestError] = None
