from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
import unicodedata
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


def is_employee(role: Optional[str]) -> bool:
    return not is_admin(role)


def normalize_permission_text(value: Optional[object]) -> str:
    normalized = unicodedata.normalize("NFD", str(value or "").strip().lower())
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn")


def has_permission_group(db: Session, actor_id: int, aliases: list[str]) -> bool:
    row = db.execute(
        text("SELECT vai_tro FROM nhanvien WHERE id = :id LIMIT 1"),
        {"id": actor_id},
    ).mappings().first()
    if not row:
        return False
    if is_admin(row.get("vai_tro")):
        return True
    normalized_aliases = [normalize_permission_text(alias) for alias in aliases]
    rows = db.execute(
        text(
            """
            SELECT DISTINCT q.nhom_quyen
            FROM nhanvien_quyen nq
            JOIN quyen q ON q.id = nq.quyen_id
            WHERE nq.nhanvien_id = :actor_id
            """
        ),
        {"actor_id": actor_id},
    ).mappings().all()
    return any(
        any(alias in normalize_permission_text(row.get("nhom_quyen")) for alias in normalized_aliases)
        for row in rows
    )


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
