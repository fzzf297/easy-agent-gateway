from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.business_context import build_context


@pytest.mark.anyio
async def test_general_qa_returns_empty_context() -> None:
    assert await build_context("GENERAL_QA", "你好") == {}


@pytest.mark.anyio
async def test_query_context_includes_projects() -> None:
    project = MagicMock(code="demo", name="演示", status="enabled")
    listing = MagicMock(items=[project], total=1, page=1, pageSize=5)
    with patch(
        "app.services.business_context.admin_client.list_projects",
        new=AsyncMock(return_value=listing),
    ):
        ctx = await build_context("INTERFACE_QUERY", "查看项目")
    assert ctx["projects"]["items"][0]["code"] == "demo"


@pytest.mark.anyio
async def test_write_context_filters_readonly_false() -> None:
    project = MagicMock(code="demo", name="演示")
    projects = MagicMock(items=[project], total=1, page=1, pageSize=3)
    iface_write = MagicMock(
        code="user_create",
        name="创建用户",
        method="POST",
        parsedConfig={"kind": "api", "readOnly": False},
    )
    iface_read = MagicMock(
        code="user_list",
        name="用户列表",
        method="GET",
        parsedConfig={"kind": "api", "readOnly": True},
    )
    interfaces = MagicMock(items=[iface_write, iface_read], total=2, page=1, pageSize=20)
    with patch(
        "app.services.business_context.admin_client.list_projects",
        new=AsyncMock(return_value=projects),
    ), patch(
        "app.services.business_context.admin_client.list_interfaces",
        new=AsyncMock(return_value=interfaces),
    ):
        ctx = await build_context("INTERFACE_WRITE", "创建用户")
    assert len(ctx["writeInterfaces"]) == 1
    assert ctx["writeInterfaces"][0]["interfaceCode"] == "user_create"


@pytest.mark.anyio
async def test_context_failure_is_soft() -> None:
    with patch(
        "app.services.business_context.admin_client.list_projects",
        new=AsyncMock(side_effect=RuntimeError("boom")),
    ):
        ctx = await build_context("INTERFACE_QUERY", "查看")
    assert ctx["error"] == "CONTEXT_UNAVAILABLE"
