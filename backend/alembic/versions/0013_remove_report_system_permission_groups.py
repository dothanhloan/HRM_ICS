"""Remove unused report and system permission groups."""

from typing import Union

from alembic import op


revision: str = "0013_remove_report_system_permission_groups"
down_revision: Union[str, None] = "0012_expand_permissions_by_group"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DELETE nq
        FROM nhanvien_quyen nq
        JOIN quyen q ON q.id = nq.quyen_id
        WHERE LOWER(COALESCE(q.nhom_quyen, '')) IN ('baocao', 'hethong')
        """
    )
    op.execute("DELETE FROM quyen WHERE LOWER(COALESCE(nhom_quyen, '')) IN ('baocao', 'hethong')")


def downgrade() -> None:
    pass