"""Expand assigned permissions to full groups."""

from typing import Union

from alembic import op


revision: str = "0012_expand_permissions_by_group"
down_revision: Union[str, None] = "0011_limit_system_roles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        INSERT IGNORE INTO nhanvien_quyen (nhanvien_id, quyen_id)
        SELECT DISTINCT nq.nhanvien_id, q_group.id
        FROM nhanvien_quyen nq
        JOIN quyen q_selected ON q_selected.id = nq.quyen_id
        JOIN quyen q_group ON q_group.nhom_quyen = q_selected.nhom_quyen
        WHERE q_selected.nhom_quyen IS NOT NULL
          AND q_selected.nhom_quyen <> ''
        """
    )


def downgrade() -> None:
    pass