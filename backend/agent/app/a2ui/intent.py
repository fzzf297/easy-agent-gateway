from typing import Any


def route_intent(user_text: str) -> dict[str, Any]:
    text = (user_text or "").strip().lower()
    form_keywords = ("表单", "填一下", "给我一个", "生成界面", "确认卡片")
    write_keywords = ("创建", "新增", "删除", "修改", "更新", "确认")
    query_keywords = ("查询", "列表", "查看", "搜索", "有哪些")

    if any(k in text for k in form_keywords) and any(
        k in text for k in ("新增", "创建", "删除", "修改", "写", "用户", "接口")
    ):
        return {
            "responseMode": "A2UI_ONLY",
            "intent": "INTERFACE_WRITE_FORM",
            "confidence": 0.8,
        }
    if any(k in text for k in write_keywords):
        return {
            "responseMode": "TEXT_WITH_A2UI",
            "intent": "INTERFACE_WRITE",
            "confidence": 0.75,
        }
    if any(k in text for k in query_keywords):
        return {
            "responseMode": "TEXT_WITH_A2UI",
            "intent": "INTERFACE_QUERY",
            "confidence": 0.75,
        }
    return {
        "responseMode": "TEXT",
        "intent": "GENERAL_QA",
        "confidence": 0.6,
    }
