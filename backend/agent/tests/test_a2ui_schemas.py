import pytest
from pydantic import ValidationError

from app.schemas.a2ui import (
    A2UIActionIn,
    A2UIActionOut,
    A2UICatalogOut,
    A2UICreateSurface,
    A2UIUpdateComponents,
    A2UIUpdateDataModel,
)
from app.schemas.session import MessageOut


def test_create_surface_requires_ids() -> None:
    surface = A2UICreateSurface(
        surfaceId="s1",
        catalogId="ruoyi-agent-a2ui",
        catalogVersion="0.1.0",
        rootId="root",
    )
    assert surface.surfaceId == "s1"
    assert surface.rootId == "root"


def test_update_components_rejects_too_many() -> None:
    components = [{"id": f"c{i}", "component": "AiText"} for i in range(81)]
    with pytest.raises(ValidationError):
        A2UIUpdateComponents(surfaceId="s1", components=components)


def test_update_data_model_accepts_dict() -> None:
    model = A2UIUpdateDataModel(surfaceId="s1", dataModel={"form": {"name": "x"}})
    assert model.dataModel["form"]["name"] == "x"


def test_action_in_requires_idempotency_key() -> None:
    with pytest.raises(ValidationError):
        A2UIActionIn(
            conversationId="c1",
            surfaceId="s1",
            idempotencyKey="short",
            action={"name": "interface.write.confirm", "context": {}},
        )


def test_action_out_defaults() -> None:
    out = A2UIActionOut(ok=True)
    assert out.responseMode == "TEXT"
    assert out.a2uiMessages == []


def test_catalog_out_shape() -> None:
    catalog = A2UICatalogOut(
        catalogId="ruoyi-agent-a2ui",
        version="0.1.0",
        components=["AiText"],
        actions=["interface.write.confirm"],
    )
    assert catalog.catalogId == "ruoyi-agent-a2ui"


def test_message_out_includes_a2ui_fields() -> None:
    msg = MessageOut(
        role="assistant",
        content="hello",
        createdAt="2026-07-24 00:00:00",
        responseMode="TEXT_WITH_A2UI",
        surfaceIds=["s1"],
    )
    assert msg.responseMode == "TEXT_WITH_A2UI"
    assert msg.surfaceIds == ["s1"]


def test_message_out_defaults_to_text_mode() -> None:
    msg = MessageOut(role="user", content="hi", createdAt="2026-07-24 00:00:00")
    assert msg.responseMode == "TEXT"
    assert msg.surfaceIds == []
