"""drop unused luu_kpi columns

Revision ID: 0009_drop_unused_luu_kpi_columns
Revises: 0008_drop_cong_viec_danh_gia
Create Date: 2026-06-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "0009_drop_unused_luu_kpi_columns"
down_revision = "0008_drop_cong_viec_danh_gia"
branch_labels = None
depends_on = None


REMOVED_COLUMNS = (
    "chi_tieu",
    "ket_qua",
    "xep_loai",
    "trang_thai",
    "ghi_chu",
    "ngay_tao",
    "ngay_tinh",
    "ngay_cap_nhat",
)


def upgrade() -> None:
    bind = op.get_bind()
    existing_columns = {column["name"] for column in inspect(bind).get_columns("luu_kpi")}
    for column_name in REMOVED_COLUMNS:
        if column_name in existing_columns:
            op.drop_column("luu_kpi", column_name)


def downgrade() -> None:
    op.add_column("luu_kpi", sa.Column("ngay_cap_nhat", sa.DateTime(), nullable=True))
    op.add_column("luu_kpi", sa.Column("ngay_tinh", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")))
    op.add_column("luu_kpi", sa.Column("ngay_tao", sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")))
    op.add_column("luu_kpi", sa.Column("ghi_chu", sa.Text(), nullable=True))
    op.add_column("luu_kpi", sa.Column("trang_thai", sa.String(length=30), nullable=False, server_default=sa.text("'DA_TINH'")))
    op.add_column("luu_kpi", sa.Column("xep_loai", sa.String(length=50), nullable=True))
    op.add_column("luu_kpi", sa.Column("ket_qua", sa.Text(), nullable=True))
    op.add_column("luu_kpi", sa.Column("chi_tieu", sa.Text(), nullable=True))
