from typing import Optional
from decimal import Decimal, InvalidOperation
import unicodedata

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import hash_password

router = APIRouter(prefix="/nhanvien", tags=["nhanvien"])

GIOI_TINH_ALLOWED = {"Nam", "Nữ", "Khác"}


def normalize_optional(value: Optional[object]) -> Optional[object]:
    if value is None:
        return None
    if isinstance(value, str):
        trimmed = value.strip()
        return trimmed if trimmed else None
    return value

def normalize_permission_text(value: Optional[object]) -> str:
    normalized = unicodedata.normalize("NFD", str(value or "").strip().lower())
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn")


def matches_permission_group(value: Optional[object], aliases: list[str]) -> bool:
    normalized = normalize_permission_text(value)
    return any(normalize_permission_text(alias) in normalized for alias in aliases)


def require_employee_permission_group(db: Session, actor_id: Optional[int]) -> None:
    if not actor_id:
        raise HTTPException(status_code=403, detail="Missing actor_id")
    row = db.execute(
        text("SELECT vai_tro FROM nhanvien WHERE id = :id LIMIT 1"),
        {"id": actor_id},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=403, detail="Actor khong ton tai")
    if "admin" in normalize_permission_text(row.get("vai_tro")):
        return
    rows = db.execute(
        text(
            """
            SELECT q.nhom_quyen
            FROM nhanvien_quyen nq
            JOIN quyen q ON q.id = nq.quyen_id
            WHERE nq.nhanvien_id = :actor_id
            """
        ),
        {"actor_id": actor_id},
    ).mappings().all()
    if any(matches_permission_group(row.get("nhom_quyen"), ["nhan_su", "nhanvien", "nhan vien", "employees"]) for row in rows):
        return
    raise HTTPException(status_code=403, detail="Khong co quyen nhom Nhan su")


def fetch_permission_ids(db: Session, nhanvien_ids: list[int]) -> dict[int, list[int]]:
    if not nhanvien_ids:
        return {}
    rows = db.execute(
        text(
            """
            SELECT nhanvien_id, quyen_id
            FROM nhanvien_quyen
            WHERE nhanvien_id IN :ids
            ORDER BY quyen_id
            """
        ).bindparams(bindparam("ids", expanding=True)),
        {"ids": nhanvien_ids},
    ).mappings().all()
    permission_map = {nhanvien_id: [] for nhanvien_id in nhanvien_ids}
    for row in rows:
        permission_map.setdefault(row["nhanvien_id"], []).append(row["quyen_id"])
    return permission_map

def sync_employee_permissions(db: Session, nhanvien_id: int, quyen_ids: Optional[list[int]]) -> None:
    if quyen_ids is None:
        return
    requested_ids = sorted({int(quyen_id) for quyen_id in quyen_ids})
    resolved_ids: list[int] = []
    if requested_ids:
        rows = db.execute(
            text("SELECT id, nhom_quyen FROM quyen WHERE id IN :ids").bindparams(bindparam("ids", expanding=True)),
            {"ids": requested_ids},
        ).mappings().all()
        existing_ids = {int(row["id"]) for row in rows}
        missing = set(requested_ids) - existing_ids
        if missing:
            raise HTTPException(status_code=400, detail="Invalid quyen_ids")

        group_names = sorted({row.get("nhom_quyen") for row in rows if row.get("nhom_quyen")})
        if group_names:
            resolved_ids.extend(
                int(permission_id)
                for permission_id in db.execute(
                    text("SELECT id FROM quyen WHERE nhom_quyen IN :groups").bindparams(bindparam("groups", expanding=True)),
                    {"groups": group_names},
                ).scalars().all()
            )
        resolved_ids.extend(int(row["id"]) for row in rows if not row.get("nhom_quyen"))

    unique_ids = sorted(set(resolved_ids))
    db.execute(text("DELETE FROM nhanvien_quyen WHERE nhanvien_id = :id"), {"id": nhanvien_id})
    for quyen_id in unique_ids:
        db.execute(
            text(
                """
                INSERT INTO nhanvien_quyen (nhanvien_id, quyen_id)
                VALUES (:nhanvien_id, :quyen_id)
                """
            ),
            {"nhanvien_id": nhanvien_id, "quyen_id": quyen_id},
        )

AUDIT_FIELD_LABELS = {
    "ho_ten": "Họ tên",
    "email": "Email",
    "mat_khau": "Mật khẩu",
    "so_dien_thoai": "Số điện thoại",
    "gioi_tinh": "Giới tính",
    "ngay_sinh": "Ngày sinh",
    "phong_ban_id": "Phòng ban",
    "chuc_vu": "Chức vụ",
    "luong_co_ban": "Lương cơ bản",
    "trang_thai_lam_viec": "Trạng thái làm việc",
    "vai_tro": "Vai trò",
    "ngay_vao_lam": "Ngày vào làm",
    "avatar_url": "Avatar",
    "quyen_ids": "Nhóm quyền",
    "tao_moi": "Tạo mới hồ sơ",
}

def _stringify_audit_value(value: Optional[object]) -> Optional[str]:
    if value is None:
        return None
    return str(value)


def _audit_values_equal(field: str, old_value: Optional[object], new_value: Optional[object]) -> bool:
    if field == "luong_co_ban":
        try:
            return Decimal(str(old_value or 0)).quantize(Decimal("0.01")) == Decimal(str(new_value or 0)).quantize(Decimal("0.01"))
        except (InvalidOperation, ValueError):
            return _stringify_audit_value(old_value) == _stringify_audit_value(new_value)
    return _stringify_audit_value(old_value) == _stringify_audit_value(new_value)

def _audit_actor_id(actor: str, nhanvien_id: int, actor_id: Optional[int] = None) -> Optional[int]:
    if actor_id:
        return actor_id
    if actor.lower() == "employee":
        return nhanvien_id
    return None

def insert_employee_history(
    db: Session,
    nhanvien_id: int,
    loai_thay_doi: str,
    gia_tri_cu: Optional[object],
    gia_tri_moi: Optional[object],
    nguoi_thay_doi_id: Optional[int] = None,
    ghi_chu: Optional[str] = None,
) -> None:
    db.execute(
        text(
            """
            INSERT INTO nhan_su_lich_su (
              nhan_vien_id, loai_thay_doi, gia_tri_cu, gia_tri_moi, nguoi_thay_doi_id, ghi_chu
            ) VALUES (
              :nhan_vien_id, :loai_thay_doi, :gia_tri_cu, :gia_tri_moi, :nguoi_thay_doi_id, :ghi_chu
            )
            """
        ),
        {
            "nhan_vien_id": nhanvien_id,
            "loai_thay_doi": loai_thay_doi,
            "gia_tri_cu": _stringify_audit_value(gia_tri_cu),
            "gia_tri_moi": _stringify_audit_value(gia_tri_moi),
            "nguoi_thay_doi_id": nguoi_thay_doi_id,
            "ghi_chu": ghi_chu,
        },
    )

def format_permission_ids(db: Session, quyen_ids: Optional[list[int]]) -> str:
    ids = sorted({int(quyen_id) for quyen_id in (quyen_ids or [])})
    if not ids:
        return ""
    rows = db.execute(
        text(
            """
            SELECT id, COALESCE(ten_quyen, ma_quyen) AS ten_quyen
            FROM quyen
            WHERE id IN :ids
            ORDER BY id
            """
        ).bindparams(bindparam("ids", expanding=True)),
        {"ids": ids},
    ).mappings().all()
    name_map = {row["id"]: row["ten_quyen"] for row in rows}
    return ", ".join(name_map.get(quyen_id, str(quyen_id)) for quyen_id in ids)


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
    quyen_ids: Optional[list[int]] = None


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
    quyen_ids: Optional[list[int]] = None


@router.get("/")
def list_nhanvien(
    q: Optional[str] = None,
    phong_ban_id: Optional[int] = None,
    trang_thai: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    skip: Optional[int] = None,
    limit: Optional[int] = None,
    actor_id: Optional[int] = None,
    db: Session = Depends(get_db),
) -> dict:
    if actor_id is not None:
        require_employee_permission_group(db, actor_id)
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
          luong_co_ban,
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
    items = [dict(row) for row in rows]
    permission_map = fetch_permission_ids(db, [item["id"] for item in items])
    for item in items:
        item["quyen_ids"] = permission_map.get(item["id"], [])
    total = db.execute(total_query, params).scalar() or 0
    total_pages = (total + resolved_limit - 1) // resolved_limit if resolved_limit else 0

    return {
        "data": items,
        "total": total,
        "page": page,
        "page_size": resolved_limit,
        "total_pages": total_pages,
    }


@router.post("/")
def create_nhanvien(
    payload: NhanVienCreate,
    actor_id: Optional[int] = None,
    db: Session = Depends(get_db),
) -> dict:
    require_employee_permission_group(db, actor_id)
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

    params = payload.model_dump(exclude={"quyen_ids"})
    params["ho_ten"] = params["ho_ten"].strip()
    params["email"] = params["email"].strip()
    params["mat_khau"] = hash_password(params["mat_khau"].strip())

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
    nhanvien_id = db.execute(text("SELECT LAST_INSERT_ID()" )).scalar()
    sync_employee_permissions(db, int(nhanvien_id), payload.quyen_ids)
    insert_employee_history(
        db,
        int(nhanvien_id),
        "tao_moi",
        None,
        params["ho_ten"],
        actor_id,
        "Tạo mới hồ sơ nhân sự",
    )
    db.commit()

    row = db.execute(
        text(
            """
            SELECT id, ho_ten, email, so_dien_thoai, phong_ban_id, chuc_vu, trang_thai_lam_viec, vai_tro
            FROM nhanvien
            WHERE email = :email
            """
        ),
        {"email": params["email"]},
    ).mappings().first()

    item = dict(row) if row else None
    if item:
        item["quyen_ids"] = fetch_permission_ids(db, [item["id"]]).get(item["id"], [])
    return {"data": item}


@router.put("/{nhanvien_id}")
def update_nhanvien(
    nhanvien_id: int,
    payload: NhanVienUpdate,
    actor: str = "admin",
    actor_id: Optional[int] = None,
    db: Session = Depends(get_db),
) -> dict:
    if actor.lower() != "employee":
        require_employee_permission_group(db, actor_id)
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
        allowed_fields = {"ho_ten", "so_dien_thoai", "ngay_sinh", "gioi_tinh", "avatar_url"}

    payload_data = payload.model_dump(exclude_unset=True)
    data = {k: v for k, v in payload_data.items() if k in allowed_fields}
    for key in list(data.keys()):
        data[key] = normalize_optional(data[key])

    can_sync_permissions = actor.lower() != "employee" and "quyen_ids" in payload_data
    if not data and not can_sync_permissions:
        raise HTTPException(status_code=400, detail="No fields to update")

    if data.get("gioi_tinh") and data["gioi_tinh"] not in GIOI_TINH_ALLOWED:
        raise HTTPException(status_code=400, detail="Invalid gioi_tinh")

    if "mat_khau" in data:
        if not data["mat_khau"]:
            raise HTTPException(status_code=400, detail="Missing password")
        data["mat_khau"] = hash_password(str(data["mat_khau"]))

    old_row = db.execute(
        text("SELECT * FROM nhanvien WHERE id = :id"),
        {"id": nhanvien_id},
    ).mappings().first()
    if not old_row:
        raise HTTPException(status_code=404, detail="Not found")

    if "email" in data:
        exists = db.execute(
            text("SELECT COUNT(*) FROM nhanvien WHERE email = :email AND id <> :id"),
            {"email": data["email"], "id": nhanvien_id},
        ).scalar()
        if exists:
            raise HTTPException(status_code=400, detail="Email already exists")

    changed_fields = []
    for key, value in data.items():
        if not _audit_values_equal(key, old_row[key], value):
            changed_fields.append((key, old_row[key], value))

    if data:
        set_clause = ", ".join([f"{key} = :{key}" for key in data.keys()])
        data["id"] = nhanvien_id
        db.execute(text(f"UPDATE nhanvien SET {set_clause} WHERE id = :id"), data)
    if can_sync_permissions:
        old_permissions = fetch_permission_ids(db, [nhanvien_id]).get(nhanvien_id, [])
        old_permissions_text = format_permission_ids(db, old_permissions)
        new_permissions_text = format_permission_ids(db, payload.quyen_ids)
        sync_employee_permissions(db, nhanvien_id, payload.quyen_ids)
        if old_permissions_text != new_permissions_text:
            changed_fields.append(("quyen_ids", old_permissions_text, new_permissions_text))
    for key, old_value, new_value in changed_fields:
        insert_employee_history(
            db,
            nhanvien_id,
            key,
            "********" if key == "mat_khau" and old_value else old_value,
            "********" if key == "mat_khau" and new_value else new_value,
            _audit_actor_id(actor, nhanvien_id, actor_id),
            f"Cập nhật {AUDIT_FIELD_LABELS.get(key, key)}",
        )
    db.commit()

    row = db.execute(
        text(
            """
            SELECT id, ho_ten, email, so_dien_thoai, phong_ban_id, chuc_vu, trang_thai_lam_viec, vai_tro
            FROM nhanvien
            WHERE id = :id
            """
        ),
        {"id": nhanvien_id},
    ).mappings().first()

    item = dict(row) if row else None
    if item:
        item["quyen_ids"] = fetch_permission_ids(db, [item["id"]]).get(item["id"], [])
    return {"data": item}


@router.get("/{nhanvien_id}/lich_su")
def list_nhanvien_history(
    nhanvien_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> dict:
    rows = db.execute(
        text(
            """
            SELECT
              h.id,
              h.nhan_vien_id,
              h.loai_thay_doi,
              h.gia_tri_cu,
              h.gia_tri_moi,
              h.nguoi_thay_doi_id,
              h.ghi_chu,
              h.thoi_gian,
              nv.ho_ten AS nguoi_thay_doi_ten
            FROM nhan_su_lich_su h
            LEFT JOIN nhanvien nv ON nv.id = h.nguoi_thay_doi_id
            WHERE h.nhan_vien_id = :id
            ORDER BY h.thoi_gian DESC, h.id DESC
            LIMIT :limit
            """
        ),
        {"id": nhanvien_id, "limit": limit},
    ).mappings().all()
    items = [dict(row) for row in rows]
    for item in items:
        item["ten_thay_doi"] = AUDIT_FIELD_LABELS.get(item["loai_thay_doi"], item["loai_thay_doi"])
    return {"data": items}

@router.delete("/{nhanvien_id}")
def delete_nhanvien(
    nhanvien_id: int,
    actor_id: Optional[int] = None,
    db: Session = Depends(get_db),
) -> dict:
    require_employee_permission_group(db, actor_id)
    row = db.execute(
        text("SELECT id, trang_thai_lam_viec FROM nhanvien WHERE id = :id"),
        {"id": nhanvien_id},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")

    db.execute(
        text("UPDATE nhanvien SET trang_thai_lam_viec = 'Nghỉ việc' WHERE id = :id"),
        {"id": nhanvien_id},
    )
    if row["trang_thai_lam_viec"] != "Nghỉ việc":
        insert_employee_history(
            db,
            nhanvien_id,
            "trang_thai_lam_viec",
            row["trang_thai_lam_viec"],
            "Nghỉ việc",
            actor_id,
            "Chuyển trạng thái nghỉ việc",
        )
    db.commit()

    return {"status": "ok"}
