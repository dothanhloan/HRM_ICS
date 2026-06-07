"""update payroll insurance base to 5100000

Revision ID: 0006_update_payroll_insurance_base
Revises: 0005_drop_allowance_from_payroll
Create Date: 2026-06-06
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_update_payroll_insurance_base"
down_revision = "0005_drop_allowance_from_payroll"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "luong",
        "muc_luong_dong_bh",
        existing_type=sa.Numeric(12, 2),
        server_default="5100000.00",
        existing_nullable=False,
    )
    op.execute(
        """
        UPDATE luong
        SET
            muc_luong_dong_bh = 5100000.00,
            bh_xa_hoi = CASE WHEN bao_hiem > 0 THEN 408000.00 ELSE 0.00 END,
            bh_y_te = CASE WHEN bao_hiem > 0 THEN 76500.00 ELSE 0.00 END,
            bh_that_nghiep = CASE WHEN bao_hiem > 0 THEN 51000.00 ELSE 0.00 END,
            bao_hiem = CASE WHEN bao_hiem > 0 THEN 535500.00 ELSE 0.00 END
        """
    )


def downgrade() -> None:
    op.alter_column(
        "luong",
        "muc_luong_dong_bh",
        existing_type=sa.Numeric(12, 2),
        server_default="5000000.00",
        existing_nullable=False,
    )
    op.execute(
        """
        UPDATE luong
        SET
            muc_luong_dong_bh = 5000000.00,
            bh_xa_hoi = CASE WHEN bao_hiem > 0 THEN 400000.00 ELSE 0.00 END,
            bh_y_te = CASE WHEN bao_hiem > 0 THEN 75000.00 ELSE 0.00 END,
            bh_that_nghiep = CASE WHEN bao_hiem > 0 THEN 50000.00 ELSE 0.00 END,
            bao_hiem = CASE WHEN bao_hiem > 0 THEN 525000.00 ELSE 0.00 END
        """
    )
