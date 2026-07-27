import json

import pytest

from app.a2ui.catalog import A2UI_PROTOCOL_VERSION, CATALOG_ID
from app.a2ui.generator import generate_a2ui


@pytest.mark.anyio
async def test_generator_uses_query_template() -> None:
    tool = json.dumps({"items": [{"id": 1, "name": "a"}]})
    result = await generate_a2ui(
        intent="INTERFACE_QUERY",
        context={},
        tool_results=[tool],
        user_text="查看",
        surface_prefix="s",
    )
    assert result.degraded is False
    assert result.source == "template_query"
    assert result.messages[0]["createSurface"]["catalogId"] == CATALOG_ID


@pytest.mark.anyio
async def test_generator_uses_write_template_from_context() -> None:
    result = await generate_a2ui(
        intent="INTERFACE_WRITE_FORM",
        context={
            "writeInterfaces": [
                {"projectCode": "demo", "interfaceCode": "user_create"}
            ]
        },
        tool_results=[],
        user_text="给我一个新增用户表单",
        surface_prefix="s",
    )
    assert result.source == "template_write"
    assert len(result.messages) == 3


@pytest.mark.anyio
async def test_generator_llm_repair_then_success() -> None:
    calls = {"n": 0}

    async def llm(prompt: str) -> str:
        calls["n"] += 1
        if calls["n"] == 1:
            bad = {
                "version": A2UI_PROTOCOL_VERSION,
                "updateComponents": {
                    "surfaceId": "x",
                    "components": [{"id": "a", "component": "Evil"}],
                }
            }
            return json.dumps([bad])
        return json.dumps(
            [
                {
                    "version": A2UI_PROTOCOL_VERSION,
                    "createSurface": {
                        "surfaceId": "s1",
                        "catalogId": CATALOG_ID,
                    }
                }
            ]
        )

    result = await generate_a2ui(
        intent="GENERAL_QA",
        context={},
        tool_results=[],
        user_text="x",
        surface_prefix="s",
        llm_generate=llm,
    )
    assert result.degraded is False
    assert result.source == "llm_repair"
    assert calls["n"] == 2


@pytest.mark.anyio
async def test_generator_degrades_after_two_failures() -> None:
    async def llm(prompt: str) -> str:
        return "not-json"

    result = await generate_a2ui(
        intent="GENERAL_QA",
        context={},
        tool_results=[],
        user_text="x",
        surface_prefix="s",
        llm_generate=llm,
    )
    assert result.degraded is True
    assert result.messages == []
