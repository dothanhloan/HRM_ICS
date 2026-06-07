from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginPayload(BaseModel):
    identifier: str
    password: str


class ChangePasswordPayload(BaseModel):
    user_id: int
    old_password: str
    new_password: str


def serialize_user(row) -> dict:
    data = dict(row)
    for key in ["ngay_sinh", "ngay_vao_lam", "ngay_tao"]:
        if data.get(key) is not None:
            data[key] = str(data[key])
    return data

def fetch_user_permissions(db: Session, user_id: int) -> dict:
    rows = db.execute(
        text(
            """
            SELECT q.id, q.ma_quyen, q.ten_quyen, q.nhom_quyen
            FROM nhanvien_quyen nq
            JOIN quyen q ON q.id = nq.quyen_id
            WHERE nq.nhanvien_id = :user_id
            ORDER BY q.nhom_quyen, q.ten_quyen
            """
        ),
        {"user_id": user_id},
    ).mappings().all()
    permissions = [dict(row) for row in rows]
    return {
        "quyen_ids": [permission["id"] for permission in permissions],
        "ma_quyen": [permission["ma_quyen"] for permission in permissions],
        "permissions": permissions,
    }


@router.post("/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)) -> dict:
    identifier = payload.identifier.strip()
    password = payload.password.strip()

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Missing credentials")

    query = text(
        """
        SELECT
          nv.id,
          nv.ho_ten,
          nv.email,
          nv.so_dien_thoai,
          nv.gioi_tinh,
          nv.ngay_sinh,
          nv.vai_tro,
          nv.chuc_vu,
          nv.phong_ban_id,
          pb.ten_phong AS phong_ban,
          nv.trang_thai_lam_viec,
          nv.ngay_vao_lam,
          nv.avatar_url,
          nv.ngay_tao
        FROM nhanvien nv
        LEFT JOIN phong_ban pb ON pb.id = nv.phong_ban_id
        WHERE (nv.email = :identifier OR nv.so_dien_thoai = :identifier)
          AND nv.mat_khau = :password
        LIMIT 1
        """
    )

    result = db.execute(query, {"identifier": identifier, "password": password}).mappings().first()
    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = (result.get("vai_tro") or "").lower()
    home_route = "/admin" if "admin" in role else "/home"

    user = serialize_user(result)
    user.update(fetch_user_permissions(db, user["id"]))

    return {
        "user": user,
        "home_route": home_route,
    }


@router.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.execute(
        text(
            """
            SELECT
              nv.id,
              nv.ho_ten,
              nv.email,
              nv.so_dien_thoai,
              nv.gioi_tinh,
              nv.ngay_sinh,
              nv.vai_tro,
              nv.chuc_vu,
              nv.phong_ban_id,
              pb.ten_phong AS phong_ban,
              nv.trang_thai_lam_viec,
              nv.ngay_vao_lam,
              nv.avatar_url,
              nv.ngay_tao
            FROM nhanvien nv
            LEFT JOIN phong_ban pb ON pb.id = nv.phong_ban_id
            WHERE nv.id = :user_id
            LIMIT 1
            """
        ),
        {"user_id": user_id},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    user = serialize_user(row)
    user.update(fetch_user_permissions(db, user["id"]))
    return {"data": user}


@router.post("/change_password")
def change_password(payload: ChangePasswordPayload, db: Session = Depends(get_db)) -> dict:
    old_password = payload.old_password.strip()
    new_password = payload.new_password.strip()
    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="Missing password")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    row = db.execute(
        text("SELECT id FROM nhanvien WHERE id = :user_id AND mat_khau = :old_password LIMIT 1"),
        {"user_id": payload.user_id, "old_password": old_password},
    ).first()
    if not row:
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    db.execute(
        text("UPDATE nhanvien SET mat_khau = :new_password WHERE id = :user_id"),
        {"user_id": payload.user_id, "new_password": new_password},
    )
    db.commit()
    return {"message": "Password changed successfully"}

