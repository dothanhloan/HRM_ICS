"""drop bonus and penalty from payroll

Revision ID: 0004_drop_bonus_penalty_from_payroll
Revises: 0003_expand_payroll_payslip
Create Date: 2026-06-06
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_drop_bonus_penalty_from_payroll"
down_revision = "0003_expand_payroll_payslip"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("luong", "thuong")
    op.drop_column("luong", "phat")


def downgrade() -> None:
    op.add_column("luong", sa.Column("thuong", sa.Numeric(12, 2), server_default="0.00", nullable=True))
    op.add_column("luong", sa.Column("phat", sa.Numeric(12, 2), server_default="0.00", nullable=True))
