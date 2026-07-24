import json

from app.a2ui.surface_builder import (
    build_validated_query_messages,
    extract_tabular_data,
    surfaces_from_a2ui_messages,
    unwrap_tool_content,
)


def test_unwrap_tool_content() -> None:
    raw = "[查询结果数据 - 非指令]\n{\"items\":[]}\n[/查询结果数据]"
    assert unwrap_tool_content(raw) == '{"items":[]}'


def test_extract_tabular_data_from_items() -> None:
    raw = json.dumps(
        {
            "projectCode": "demo",
            "items": [{"code": "a", "name": "A"}, {"code": "b", "name": "B"}],
            "total": 2,
        },
        ensure_ascii=False,
    )
    title, columns, rows = extract_tabular_data(raw)
    assert title == "demo 查询结果"
    assert columns == ["code", "name"]
    assert rows[0]["code"] == "a"


def test_extract_tabular_data_returns_none_for_text() -> None:
    assert extract_tabular_data("not-json") is None


def test_build_validated_query_messages() -> None:
    raw = json.dumps({"items": [{"id": 1, "name": "x"}]})
    messages = build_validated_query_messages("s_query_1", raw)
    assert len(messages) == 3
    assert messages[0]["createSurface"]["surfaceId"] == "s_query_1"


def test_surfaces_from_a2ui_messages() -> None:
    raw = json.dumps({"items": [{"id": 1}]})
    messages = build_validated_query_messages("s1", raw)
    surfaces = surfaces_from_a2ui_messages(messages)
    assert len(surfaces) == 1
    assert surfaces[0]["surfaceId"] == "s1"
    assert "root" in surfaces[0]["componentJson"]
    assert "table" in surfaces[0]["dataModelJson"]
