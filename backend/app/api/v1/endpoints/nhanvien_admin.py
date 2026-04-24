from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db

router = APIRouter(prefix="/nhanvien", tags=["nhanvien"])

GIOI_TINH_ALLOWED = {"Nam", "Nữ", "Khác"}


def normalize_optional(value: Optional[object]) -> Optional[object]:
    if value is None:
        return None
    if isinstance(value, str):
        trimmed = value.strip()
        return trimmed if trimmed else None
    return value


class NhanVienCreate(BaseModel):
    ho_ten: str
    email: str
    mat_khau: str
    so_dien_thoai: Optional[str] = None
    gioi_tinh: Optional[str] = None
    ngay_sinh: Optional[str] = None
    phong_ban_id: Optional[int] = None
    chuc_vu: Optional[str] = None
    luong_co_ban: Optional[float] = None
    trang_thai_lam_viec: Optional[str] = None
    vai_tro: Optional[str] = None
    ngay_vao_lam: Optional[str] = None
    avatar_url: Optional[str] = None


class NhanVienUpdate(BaseModel):
    ho_ten: Optional[str] = None
    email: Optional[str] = None
    mat_khau: Optional[str] = None
    so_dien_thoai: Optional[str] = None
    gioi_tinh: Optional[str] = None
    ngay_sinh: Optional[str] = None
    phong_ban_id: Optional[int] = None
    chuc_vu: Optional[str] = None
    luong_co_ban: Optional[float] = None
    trang_thai_lam_viec: Optional[str] = None
    vai_tro: Optional[str] = None
    ngay_vao_lam: Optional[str] = None
    avatar_url: Optional[str] = None


@router.get("/")
def list_nhanvien(
    q: Optional[str] = None,
    phong_ban_id: Optional[int] = None,
    trang_thai: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    skip: Optional[int] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
) -> dict:
    conditions = []
    resolved_limit = limit if limit is not None else page_size
    resolved_skip = skip if skip is not None else max(page - 1, 0) * resolved_limit
    params: dict = {"skip": resolved_skip, "limit": resolved_limit}

    if q:
        conditions.append("(ho_ten LIKE :q OR email LIKE :q OR so_dien_thoai LIKE :q)")
        params["q"] = f"%{q}%"
    if phong_ban_id is not None:
        conditions.append("phong_ban_id = :phong_ban_id")
        params["phong_ban_id"] = phong_ban_id
    if trang_thai:
        conditions.append("trang_thai_lam_viec = :trang_thai")
        params["trang_thai"] = trang_thai

    where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query = text(
        f"""
        SELECT
          id,
          ho_ten,
          email,
          so_dien_thoai,
          gioi_tinh,
          ngay_sinh,
          phong_ban_id,
          chuc_vu,
          ngay_vao_lam,
          trang_thai_lam_viec,
          vai_tro,
          avatar_url
        FROM nhanvien
        {where_sql}
        ORDER BY id DESC
        LIMIT :limit OFFSET :skip
        """
    )

    total_query = text(
        f"""
        SELECT COUNT(*) AS total
        FROM nhanvien
        {where_sql}
        """
    )

    rows = db.execute(query, params).mappings().all()
    total = db.execute(total_query, params).scalar() or 0
    total_pages = (total + resolved_limit - 1) // resolved_limit if resolved_limit else 0

    return {
        "data": [dict(row) for row in rows],
        "total": total,
        "page": page,
        "page_size": resolved_limit,
        "total_pages": total_pages,
    }


@router.post("/")
def create_nhanvien(payload: NhanVienCreate, db: Session = Depends(get_db)) -> dict:
    if not payload.ho_ten.strip() or not payload.email.strip() or not payload.mat_khau.strip():
        raise HTTPException(status_code=400, detail="Missing required fields")

    exists = db.execute(
        text("SELECT COUNT(*) FROM nhanvien WHERE email = :email"),
        {"email": payload.email.strip()},
    ).scalar()
    if exists:
        raise HTTPException(status_code=400, detail="Email already exists")

    query = text(
        """
        INSERT INTO nhanvien (
          ho_ten, email, mat_khau, so_dien_thoai, gioi_tinh, ngay_sinh, phong_ban_id,
          chuc_vu, luong_co_ban, trang_thai_lam_viec, vai_tro, ngay_vao_lam, avatar_url
        ) VALUES (
          :ho_ten, :email, :mat_khau, :so_dien_thoai, :gioi_tinh, :ngay_sinh, :phong_ban_id,
          :chuc_vu, :luong_co_ban, :trang_thai_lam_viec, :vai_tro, :ngay_vao_lam, :avatar_url
        )
        """
    )

    params = payload.model_dump()
    params["ho_ten"] = params["ho_ten"].strip()
    params["email"] = params["email"].strip()
    params["mat_khau"] = params["mat_khau"].strip()

    for key in [
        "so_dien_thoai",
        "gioi_tinh",
        "ngay_sinh",
        "chuc_vu",
        "trang_thai_lam_viec",
        "vai_tro",
        "ngay_vao_lam",
        "avatar_url",
    ]:
        params[key] = normalize_optional(params.get(key))

    if params.get("gioi_tinh") and params["gioi_tinh"] not in GIOI_TINH_ALLOWED:
        raise HTTPException(status_code=400, detail="Invalid gioi_tinh")

    db.execute(query, params)
    db.commit()

    row = db.execute(
        text(
            """
            SELECT id, ho_ten, email, so_dien_thoai, phong_ban_id, chuc_vu, trang_thai_lam_viec
            FROM nhanvien
            WHERE email = :email
            """
        ),
        {"email": params["email"]},
    ).mappings().first()

    return {"data": dict(row) if row else None}


@router.put("/{nhanvien_id}")
def update_nhanvien(
    nhanvien_id: int,
    payload: NhanVienUpdate,
    actor: str = "admin",
    db: Session = Depends(get_db),
) -> dict:
    allowed_fields = {
        "ho_ten",
        "email",
        "mat_khau",
        "so_dien_thoai",
        "gioi_tinh",
        "ngay_sinh",
        "phong_ban_id",
        "chuc_vu",
        "luong_co_ban",
        "trang_thai_lam_viec",
        "vai_tro",
        "ngay_vao_lam",
        "avatar_url",
    }
    if actor.lower() == "employee":
        allowed_fields = {"ho_ten", "so_dien_thoai", "ngay_sinh", "gioi_tinh"}

    data = {k: v for k, v in payload.model_dump().items() if v is not None and k in allowed_fields}
    for key in list(data.keys()):
        data[key] = normalize_optional(data[key])
        if data[key] is None:
            del data[key]

    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if data.get("gioi_tinh") and data["gioi_tinh"] not in GIOI_TINH_ALLOWED:
        raise HTTPException(status_code=400, detail="Invalid gioi_tinh")

    if "email" in data:
        exists = db.execute(
            text("SELECT COUNT(*) FROM nhanvien WHERE email = :email AND id <> :id"),
            {"email": data["email"], "id": nhanvien_id},
        ).scalar()
        if exists:
            raise HTTPException(status_code=400, detail="Email already exists")

    set_clause = ", ".join([f"{key} = :{key}" for key in data.keys()])
    data["id"] = nhanvien_id
    db.execute(text(f"UPDATE nhanvien SET {set_clause} WHERE id = :id"), data)
    db.commit()

    row = db.execute(
        text(
            """
            SELECT id, ho_ten, email, so_dien_thoai, phong_ban_id, chuc_vu, trang_thai_lam_viec
            FROM nhanvien
            WHERE id = :id
            """
        ),
        {"id": nhanvien_id},
    ).mappings().first()

    return {"data": dict(row) if row else None}


@router.delete("/{nhanvien_id}")
def delete_nhanvien(nhanvien_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.execute(
        text("SELECT id FROM nhanvien WHERE id = :id"),
        {"id": nhanvien_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")

    db.execute(
        text("UPDATE nhanvien SET trang_thai_lam_viec = 'Nghỉ việc' WHERE id = :id"),
        {"id": nhanvien_id},
    )
    db.commit()

    return {"status": "ok"}
