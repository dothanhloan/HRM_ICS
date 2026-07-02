"""Add leave management permission to attendance group."""

from typing import Union

from alembic import op


revision: str = "0014_add_leave_management_to_attendance_group"
down_revision: Union[str, None] = "0013_remove_report_system_permission_groups"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO quyen (ma_quyen, ten_quyen, nhom_quyen)
        VALUES ('quanly_nghiphep', 'Quản lý nghỉ phép', 'chamcong')
        ON DUPLICATE KEY UPDATE
            ten_quyen = VALUES(ten_quyen),
            nhom_quyen = VALUES(nhom_quyen)
        """
    )
    op.execute(
        """
        INSERT IGNORE INTO nhanvien_quyen (nhanvien_id, quyen_id)
        SELECT DISTINCT nq.nhanvien_id, q_leave.id
        FROM nhanvien_quyen nq
        JOIN quyen q_attendance ON q_attendance.id = nq.quyen_id
        JOIN quyen q_leave ON q_leave.ma_quyen = 'quanly_nghiphep'
        WHERE q_attendance.nhom_quyen = 'chamcong'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE nq
        FROM nhanvien_quyen nq
        JOIN quyen q ON q.id = nq.quyen_id
        WHERE q.ma_quyen = 'quanly_nghiphep'
        """
    )
    op.execute("DELETE FROM quyen WHERE ma_quyen = 'quanly_nghiphep'")