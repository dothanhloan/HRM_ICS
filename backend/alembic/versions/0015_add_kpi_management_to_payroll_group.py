"""Add KPI management permission to payroll group."""

from typing import Union

from alembic import op


revision: str = "0015_add_kpi_management_to_payroll_group"
down_revision: Union[str, None] = "0014_add_leave_management_to_attendance_group"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO quyen (ma_quyen, ten_quyen, nhom_quyen)
        VALUES ('quanly_kpi', 'Quản lý KPI', 'luong')
        ON DUPLICATE KEY UPDATE
            ten_quyen = VALUES(ten_quyen),
            nhom_quyen = VALUES(nhom_quyen)
        """
    )
    op.execute(
        """
        INSERT IGNORE INTO nhanvien_quyen (nhanvien_id, quyen_id)
        SELECT DISTINCT nq.nhanvien_id, q_kpi.id
        FROM nhanvien_quyen nq
        JOIN quyen q_payroll ON q_payroll.id = nq.quyen_id
        JOIN quyen q_kpi ON q_kpi.ma_quyen = 'quanly_kpi'
        WHERE q_payroll.nhom_quyen = 'luong'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE nq
        FROM nhanvien_quyen nq
        JOIN quyen q ON q.id = nq.quyen_id
        WHERE q.ma_quyen = 'quanly_kpi'
        """
    )
    op.execute("DELETE FROM quyen WHERE ma_quyen = 'quanly_kpi'")