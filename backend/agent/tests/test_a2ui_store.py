import os
import tempfile
from pathlib import Path

db_path = Path(tempfile.gettempdir()) / "agent-a2ui-store-test.db"
if db_path.exists():
    db_path.unlink()
os.environ["AGENT_API_DATABASE_URL"] = f"sqlite:///{db_path}"
os.environ.setdefault("AGENT_LLM_API_KEY", "test-key")

from app.db.database import get_connection, initialize_database  # noqa: E402
from app.repositories import a2ui_store  # noqa: E402
from app.repositories import sessions as session_repo  # noqa: E402


def test_upsert_surface_and_action_log() -> None:
    initialize_database()
    with get_connection() as conn:
        session_repo.create_session(conn, "s1", "u")
        a2ui_store.upsert_surface(
            conn,
            surface_id="surf_1",
            session_id="s1",
            catalog_version="0.1.0",
            component_json={"root": {"id": "root"}},
            data_model_json={"form": {"name": "a"}},
        )
        a2ui_store.save_action_log(
            conn,
            session_id="s1",
            surface_id="surf_1",
            action_name="interface.write.confirm",
            request_context={"projectCode": "demo"},
            execution_result={"ok": True},
            idempotency_key="idem-store-001",
        )
        surfaces = a2ui_store.list_surfaces(conn, "s1")
        row = a2ui_store.get_action_by_idempotency(conn, "idem-store-001")
    assert len(surfaces) == 1
    assert surfaces[0]["surface_id"] == "surf_1"
    assert row is not None
    assert row["action_name"] == "interface.write.confirm"
