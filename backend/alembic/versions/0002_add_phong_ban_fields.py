"""Add mo_ta and trang_thai to phong_ban

Revision ID: 0002_add_phong_ban_fields
Revises: 0001_create_tables_except_nhanvien
Create Date: 2026-04-22
"""

from alembic import op

revision = "0002_add_phong_ban_fields"
down_revision = "0001_create_tables_except_nhanvien"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE phong_ban "
        "ADD COLUMN mo_ta TEXT NULL, "
        "ADD COLUMN trang_thai VARCHAR(20) NOT NULL DEFAULT 'Hoat dong'"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE phong_ban DROP COLUMN trang_thai, DROP COLUMN mo_ta")
