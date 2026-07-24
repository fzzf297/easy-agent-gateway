from app.a2ui.intent import route_intent


def test_general_qa_is_text() -> None:
    result = route_intent("你好，你是谁")
    assert result["responseMode"] == "TEXT"
    assert result["intent"] == "GENERAL_QA"
    assert result["confidence"] >= 0.5


def test_query_is_text_with_a2ui() -> None:
    result = route_intent("查看项目列表")
    assert result["responseMode"] == "TEXT_WITH_A2UI"
    assert result["intent"] == "INTERFACE_QUERY"


def test_write_is_text_with_a2ui() -> None:
    result = route_intent("帮我创建一个用户")
    assert result["responseMode"] == "TEXT_WITH_A2UI"
    assert result["intent"] == "INTERFACE_WRITE"


def test_form_only_is_a2ui_only() -> None:
    result = route_intent("给我一个新增用户的表单")
    assert result["responseMode"] == "A2UI_ONLY"
    assert result["intent"] == "INTERFACE_WRITE_FORM"
