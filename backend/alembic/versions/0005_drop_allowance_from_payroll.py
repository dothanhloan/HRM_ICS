"""drop allowance from payroll

Revision ID: 0005_drop_allowance_from_payroll
Revises: 0004_drop_bonus_penalty_from_payroll
Create Date: 2026-06-06
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_drop_allowance_from_payroll"
down_revision = "0004_drop_bonus_penalty_from_payroll"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("luong", "phu_cap")


def downgrade() -> None:
    op.add_column("luong", sa.Column("phu_cap", sa.Numeric(12, 2), server_default="0.00", nullable=True))
