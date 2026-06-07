"""expand payroll payslip

Revision ID: 0003_expand_payroll_payslip
Revises: 0002_add_phong_ban_fields
Create Date: 2026-06-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


revision = "0003_expand_payroll_payslip"
down_revision = "0002_add_phong_ban_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "luong",
        "trang_thai",
        existing_type=mysql.ENUM("Chưa trả", "Đã trả"),
        type_=mysql.ENUM("Chưa trả", "Đã trả", "Chờ duyệt", "Đã chốt", "Đã thanh toán"),
        existing_nullable=True,
        server_default="Chờ duyệt",
    )
    op.execute("UPDATE luong SET trang_thai = 'Chờ duyệt' WHERE trang_thai = 'Chưa trả'")
    op.execute("UPDATE luong SET trang_thai = 'Đã thanh toán' WHERE trang_thai = 'Đã trả'")
    op.alter_column(
        "luong",
        "trang_thai",
        existing_type=mysql.ENUM("Chưa trả", "Đã trả", "Chờ duyệt", "Đã chốt", "Đã thanh toán"),
        type_=mysql.ENUM("Chờ duyệt", "Đã chốt", "Đã thanh toán"),
        existing_nullable=True,
        server_default="Chờ duyệt",
    )
    op.add_column("luong", sa.Column("so_ngay_cong_chuan", sa.Numeric(5, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("so_ngay_cong_thuc_te", sa.Numeric(5, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("luong_ngay", sa.Numeric(12, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("luong_theo_cong", sa.Numeric(12, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("diem_kpi", sa.Numeric(5, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("he_so_kpi", sa.Numeric(4, 2), nullable=False, server_default="1.00"))
    op.add_column("luong", sa.Column("luong_sau_kpi", sa.Numeric(12, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("muc_luong_dong_bh", sa.Numeric(12, 2), nullable=False, server_default="5000000.00"))
    op.add_column("luong", sa.Column("bh_xa_hoi", sa.Numeric(12, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("bh_y_te", sa.Numeric(12, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("bh_that_nghiep", sa.Numeric(12, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("so_lan_di_muon_khong_duyet", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("luong", sa.Column("so_ngay_tru_di_muon", sa.Numeric(5, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("so_ngay_thieu_check_in_out", sa.Numeric(5, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("so_ngay_nghi_khong_luong", sa.Numeric(5, 2), nullable=False, server_default="0.00"))
    op.add_column("luong", sa.Column("ngay_chot", sa.Date(), nullable=True))
    op.create_unique_constraint("uq_luong_nhanvien_thang_nam", "luong", ["nhan_vien_id", "thang", "nam"])


def downgrade() -> None:
    op.drop_constraint("uq_luong_nhanvien_thang_nam", "luong", type_="unique")
    op.drop_column("luong", "ngay_chot")
    op.drop_column("luong", "so_ngay_nghi_khong_luong")
    op.drop_column("luong", "so_ngay_thieu_check_in_out")
    op.drop_column("luong", "so_ngay_tru_di_muon")
    op.drop_column("luong", "so_lan_di_muon_khong_duyet")
    op.drop_column("luong", "bh_that_nghiep")
    op.drop_column("luong", "bh_y_te")
    op.drop_column("luong", "bh_xa_hoi")
    op.drop_column("luong", "muc_luong_dong_bh")
    op.drop_column("luong", "luong_sau_kpi")
    op.drop_column("luong", "he_so_kpi")
    op.drop_column("luong", "diem_kpi")
    op.drop_column("luong", "luong_theo_cong")
    op.drop_column("luong", "luong_ngay")
    op.drop_column("luong", "so_ngay_cong_thuc_te")
    op.drop_column("luong", "so_ngay_cong_chuan")
    op.alter_column(
        "luong",
        "trang_thai",
        existing_type=mysql.ENUM("Chờ duyệt", "Đã chốt", "Đã thanh toán"),
        type_=mysql.ENUM("Chưa trả", "Đã trả", "Chờ duyệt", "Đã chốt", "Đã thanh toán"),
        existing_nullable=True,
        server_default="Chưa trả",
    )
    op.execute("UPDATE luong SET trang_thai = 'Chưa trả' WHERE trang_thai IN ('Chờ duyệt', 'Đã chốt')")
    op.execute("UPDATE luong SET trang_thai = 'Đã trả' WHERE trang_thai = 'Đã thanh toán'")
    op.alter_column(
        "luong",
        "trang_thai",
        existing_type=mysql.ENUM("Chưa trả", "Đã trả", "Chờ duyệt", "Đã chốt", "Đã thanh toán"),
        type_=mysql.ENUM("Chưa trả", "Đã trả"),
        existing_nullable=True,
        server_default="Chưa trả",
    )
