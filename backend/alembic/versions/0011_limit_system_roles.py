"""Limit system roles to Admin and Nhân viên."""

from typing import Union

from alembic import op


revision: str = "0011_limit_system_roles"
down_revision: Union[str, None] = "0010_hash_nhanvien_passwords"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE nhanvien SET vai_tro = 'Nhân viên' WHERE vai_tro <> 'Admin' OR vai_tro IS NULL")
    op.execute("ALTER TABLE nhanvien MODIFY vai_tro ENUM('Admin','Nhân viên') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Nhân viên'")
    op.execute("UPDATE phan_quyen_chuc_nang SET vai_tro = 'Nhân viên' WHERE vai_tro <> 'Admin' OR vai_tro IS NULL")
    op.execute("ALTER TABLE phan_quyen_chuc_nang MODIFY vai_tro ENUM('Admin','Nhân viên') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE nhanvien MODIFY vai_tro ENUM('Admin','Quản lý','Nhân viên') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Nhân viên'")
    op.execute("ALTER TABLE phan_quyen_chuc_nang MODIFY vai_tro ENUM('Admin','Quản lý','Nhân viên','Trưởng nhóm','Nhân viên cấp cao') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL")