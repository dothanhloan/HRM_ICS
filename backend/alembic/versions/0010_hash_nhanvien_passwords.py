"""hash existing employee passwords

Revision ID: 0010_hash_nhanvien_passwords
Revises: 0009_drop_unused_luu_kpi_columns
Create Date: 2026-06-29
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.core.security import hash_password, is_password_hash

revision: str = "0010_hash_nhanvien_passwords"
down_revision: Union[str, None] = "0009_drop_unused_luu_kpi_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id, mat_khau FROM nhanvien")).mappings().all()
    for row in rows:
        password = row.get("mat_khau")
        if password and not is_password_hash(password):
            connection.execute(
                sa.text("UPDATE nhanvien SET mat_khau = :password_hash WHERE id = :id"),
                {"id": row["id"], "password_hash": hash_password(password)},
            )


def downgrade() -> None:
    pass
