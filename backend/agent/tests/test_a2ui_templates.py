from app.a2ui.catalog import A2UI_PROTOCOL_VERSION, CATALOG_ID
from app.a2ui.intent import route_intent
from app.a2ui.templates import build_query_result_table, build_write_confirm_card
from app.a2ui.validator import validate_a2ui_message


def test_query_result_table_messages_are_valid() -> None:
    messages = build_query_result_table(
        surface_id="query_1",
        title="项目列表",
        columns=["code", "name"],
        rows=[{"code": "demo", "name": "演示"}],
    )
    assert len(messages) == 3
    for msg in messages:
        validate_a2ui_message(msg)
    create = messages[0]["createSurface"]
    assert messages[0]["version"] == A2UI_PROTOCOL_VERSION
    assert create["catalogId"] == CATALOG_ID
    assert set(create) == {"surfaceId", "catalogId"}
    data = messages[2]["updateDataModel"]["value"]
    assert data["table"]["rows"][0]["code"] == "demo"


def test_write_confirm_card_messages_are_valid() -> None:
    messages = build_write_confirm_card(
        surface_id="write_1",
        project_code="demo",
        interface_code="user_create",
        params_summary={"name": "张三"},
    )
    assert len(messages) == 3
    for msg in messages:
        validate_a2ui_message(msg)
    components = messages[1]["updateComponents"]["components"]
    button = next(c for c in components if c["component"] == "AiConfirmButton")
    event = button["action"]["event"]
    assert event["name"] == "interface.write.confirm"
    assert event["context"]["projectCode"] == "demo"
    assert event["context"]["interfaceCode"] == "user_create"
    assert event["context"]["params"] == {"path": "/form/params"}


def test_route_intent_defaults_to_text() -> None:
    result = route_intent("你好")
    assert result["responseMode"] == "TEXT"
    assert result["intent"] == "GENERAL_QA"


def test_route_intent_query_hint() -> None:
    result = route_intent("查看项目列表")
    assert result["responseMode"] == "TEXT_WITH_A2UI"
    assert result["intent"] == "INTERFACE_QUERY"


def test_route_intent_write_hint() -> None:
    result = route_intent("帮我创建一个用户")
    assert result["responseMode"] == "TEXT_WITH_A2UI"
    assert result["intent"] == "INTERFACE_WRITE"
