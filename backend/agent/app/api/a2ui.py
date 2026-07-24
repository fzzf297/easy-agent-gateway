from fastapi import APIRouter

from app.a2ui.catalog import ACTIONS, CATALOG_ID, CATALOG_VERSION, COMPONENTS
from app.schemas.a2ui import A2UIActionIn, A2UIActionOut, A2UICatalogOut
from app.services.a2ui_actions import dispatch_action

router = APIRouter()


@router.get("/a2ui/catalog", response_model=A2UICatalogOut)
def get_a2ui_catalog() -> A2UICatalogOut:
    return A2UICatalogOut(
        catalogId=CATALOG_ID,
        version=CATALOG_VERSION,
        components=sorted(COMPONENTS),
        actions=sorted(ACTIONS),
    )


@router.post("/actions", response_model=A2UIActionOut)
async def post_a2ui_action(payload: A2UIActionIn) -> A2UIActionOut:
    return await dispatch_action(payload)
