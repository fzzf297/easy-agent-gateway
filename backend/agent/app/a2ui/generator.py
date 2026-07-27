import json
import logging
from collections.abc import Awaitable
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from app.a2ui.catalog import A2UI_PROTOCOL_VERSION, CATALOG_ID, COMPONENT_SCHEMAS
from app.a2ui.surface_builder import build_validated_query_messages
from app.a2ui.templates import build_write_confirm_card
from app.a2ui.validator import A2UIValidationError, validate_a2ui_message

logger = logging.getLogger(__name__)

LlmGenerateFn = Callable[[str], Awaitable[str]]


@dataclass
class GenerateResult:
    messages: list[dict[str, Any]] = field(default_factory=list)
    degraded: bool = False
    source: str = "none"
    error: str = ""


async def generate_a2ui(
    *,
    intent: str,
    context: dict[str, Any],
    tool_results: list[str],
    user_text: str,
    surface_prefix: str,
    llm_generate: Optional[LlmGenerateFn] = None,
) -> GenerateResult:
    # 1) tabular tool results → query table template
    for index, tool_content in enumerate(tool_results):
        surface_id = f"{surface_prefix}_q{index}"
        try:
            built = build_validated_query_messages(surface_id, tool_content)
        except A2UIValidationError as exc:
            logger.warning("template validation failed: %s", exc.message)
            continue
        if built:
            return GenerateResult(messages=built, degraded=False, source="template_query")

    # 2) write intents → confirm card from context
    if intent in {"INTERFACE_WRITE", "INTERFACE_WRITE_FORM"}:
        write_apis = context.get("writeInterfaces") or []
        if write_apis:
            first = write_apis[0]
            messages = build_write_confirm_card(
                surface_id=f"{surface_prefix}_w0",
                project_code=first["projectCode"],
                interface_code=first["interfaceCode"],
                params_summary={"note": "请确认参数后执行"},
            )
            for message in messages:
                validate_a2ui_message(message)
            return GenerateResult(messages=messages, degraded=False, source="template_write")

    # 3) optional LLM structured generation with one repair
    if llm_generate is None:
        return GenerateResult(messages=[], degraded=True, source="none", error="NO_GENERATOR")

    prompt = _build_prompt(intent=intent, context=context, user_text=user_text)
    raw = await llm_generate(prompt)
    try:
        messages = _parse_and_validate(raw)
        return GenerateResult(messages=messages, degraded=False, source="llm")
    except (A2UIValidationError, ValueError) as first_error:
        repair_prompt = (
            f"{prompt}\n\n上次输出校验失败：{first_error}\n"
            "请只输出合法 JSON 数组，每项是单个 A2UI 消息对象。"
        )
        try:
            raw2 = await llm_generate(repair_prompt)
            messages = _parse_and_validate(raw2)
            return GenerateResult(messages=messages, degraded=False, source="llm_repair")
        except (A2UIValidationError, ValueError) as second_error:
            return GenerateResult(
                messages=[],
                degraded=True,
                source="llm_failed",
                error=str(second_error),
            )


def _build_prompt(*, intent: str, context: dict[str, Any], user_text: str) -> str:
    component_contract = json.dumps(COMPONENT_SCHEMAS, ensure_ascii=False)
    return (
        "你是 A2UI 生成器。只输出 JSON 数组，不要 Markdown。"
        f"协议版本：{A2UI_PROTOCOL_VERSION}，Catalog：{CATALOG_ID}。"
        f"组件契约：{component_contract}。"
        "每个元素必须包含 version，且只能再包含 "
        "createSurface/updateComponents/updateDataModel/deleteSurface 之一。"
        "根组件 id 必须为 root；数据更新使用 path/value；Action 使用 action.event。"
        f"意图：{intent}\n用户：{user_text}\n上下文：{json.dumps(context, ensure_ascii=False)}"
    )


def _parse_and_validate(raw: str) -> list[dict[str, Any]]:
    text = (raw or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()
    data = json.loads(text)
    if isinstance(data, dict):
        data = [data]
    if not isinstance(data, list) or not data:
        raise ValueError("A2UI payload must be a non-empty JSON array")
    messages: list[dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            raise ValueError("each A2UI message must be an object")
        validate_a2ui_message(item)
        messages.append(item)
    return messages
