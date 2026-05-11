from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session


@dataclass(frozen=True)
class ActorContext:
    actor_id: int
    actor_role: str
    actor_department_id: Optional[int]


def normalize_role(role: Optional[str]) -> str:
    return (role or "").strip().lower()


def is_admin(role: Optional[str]) -> bool:
    return "admin" in normalize_role(role)


def is_manager(role: Optional[str]) -> bool:
    normalized = normalize_role(role)
    return "quản lý" in normalized or "quan ly" in normalized or "manager" in normalized


def is_employee(role: Optional[str]) -> bool:
    normalized = normalize_role(role)
    return not is_admin(normalized) and not is_manager(normalized)


def load_actor_context(db: Session, actor_id: int, actor_role: Optional[str] = None) -> ActorContext:
    row = db.execute(
        text("SELECT id, vai_tro, phong_ban_id FROM nhanvien WHERE id = :id LIMIT 1"),
        {"id": actor_id},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Nhan vien khong ton tai")
    resolved_role = actor_role or row.get("vai_tro") or "Nhân viên"
    return ActorContext(
        actor_id=int(row["id"]),
        actor_role=resolved_role,
        actor_department_id=row.get("phong_ban_id"),
    )


def resolve_target_employee_id(
    db: Session,
    actor_id: int,
    target_employee_id: Optional[int],
    actor_role: Optional[str] = None,
) -> int:
    context = load_actor_context(db, actor_id, actor_role)
    target_id = int(target_employee_id or context.actor_id)

    if is_admin(context.actor_role):
        return target_id

    if target_id == context.actor_id:
        return target_id

    if is_manager(context.actor_role):
        target_row = db.execute(
            text("SELECT phong_ban_id FROM nhanvien WHERE id = :id LIMIT 1"),
            {"id": target_id},
        ).mappings().first()
        if not target_row:
            raise HTTPException(status_code=404, detail="Nhan vien khong ton tai")
        if target_row.get("phong_ban_id") != context.actor_department_id:
            raise HTTPException(status_code=403, detail="Manager chi co quyen xem team cua minh")
        return target_id

    raise HTTPException(status_code=403, detail="Nhan vien chi duoc truy cap du lieu cua chinh minh")


def get_standard_work_days(db: Session) -> Decimal:
    value = db.execute(
        text(
            """
            SELECT gia_tri
            FROM luong_cau_hinh
            WHERE LOWER(COALESCE(ten_cau_hinh, '')) IN (
                'so_ngay_cong_chuan', 'standard_work_days'
            )
            ORDER BY id DESC
            LIMIT 1
            """
        )
    ).scalar()
    if value is None:
        return Decimal("26")
    try:
        resolved = Decimal(str(value))
        return resolved if resolved > 0 else Decimal("26")
    except Exception:
        return Decimal("26")
