"""收藏路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Collection
from app.schemas import CollectionRequest

router = APIRouter(prefix="/api/v1/collections", tags=["收藏"])


@router.get("/")
def get_collections(
    target_type: str = "song",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    collections = (
        db.query(Collection)
        .filter(Collection.user_id == current_user.id, Collection.target_type == target_type)
        .order_by(Collection.created_at.desc())
        .all()
    )
    return [{"id": c.id, "target_type": c.target_type, "target_id": c.target_id, "created_at": c.created_at} for c in collections]


@router.post("/", status_code=201)
def add_collection(
    req: CollectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Collection).filter(
        Collection.user_id == current_user.id,
        Collection.target_type == req.target_type,
        Collection.target_id == req.target_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="已收藏")

    c = Collection(user_id=current_user.id, target_type=req.target_type, target_id=req.target_id)
    db.add(c)
    db.commit()
    return {"message": "收藏成功"}


@router.delete("/{target_id}")
def remove_collection(
    target_id: str,
    target_type: str = "song",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = db.query(Collection).filter(
        Collection.user_id == current_user.id,
        Collection.target_type == target_type,
        Collection.target_id == target_id,
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="收藏记录不存在")
    db.delete(c)
    db.commit()
    return {"message": "取消收藏成功"}
