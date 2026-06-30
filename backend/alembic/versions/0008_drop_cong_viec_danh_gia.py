"""drop cong_viec_danh_gia

Revision ID: 0008_drop_cong_viec_danh_gia
Revises: 0007_drop_unused_tables
Create Date: 2026-06-12
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_drop_cong_viec_danh_gia"
down_revision = "0007_drop_unused_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS cong_viec_danh_gia")


def downgrade() -> None:
    op.create_table(
        "cong_viec_danh_gia",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("cong_viec_id", sa.Integer(), nullable=True),
        sa.Column("nguoi_danh_gia_id", sa.Integer(), nullable=True),
        sa.Column("is_from_worker", sa.Boolean(), nullable=False, server_default=sa.text("'0'")),
        sa.Column("nhan_xet", sa.Text(), nullable=True),
        sa.Column("thoi_gian", sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["cong_viec_id"], ["cong_viec.id"], name="cong_viec_danh_gia_ibfk_1", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["nguoi_danh_gia_id"], ["nhanvien.id"], name="cong_viec_danh_gia_ibfk_2", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("cong_viec_id", "cong_viec_id"),
        sa.Index("nguoi_danh_gia_id", "nguoi_danh_gia_id"),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )