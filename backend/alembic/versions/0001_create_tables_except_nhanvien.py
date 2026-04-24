"""Create tables except nhanvien

Revision ID: 0001_create_tables_except_nhanvien
Revises: 
Create Date: 2026-04-05
"""
from pathlib import Path
from alembic import op

revision = '0001_create_tables_except_nhanvien'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    sql_path = Path(__file__).resolve().parents[1] / 'sql' / 'schema_only_no_nhanvien.sql'
    sql_text = sql_path.read_text(encoding='utf-8')
    statements = [stmt.strip() for stmt in sql_text.split(';') if stmt.strip()]
    for statement in statements:
        lowered = statement.lower()
        if lowered.startswith('create database') or lowered.startswith('use '):
            continue
        op.execute(statement)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS `thong_bao`;")
    op.execute("DROP TABLE IF EXISTS `tai_lieu`;")
    op.execute("DROP TABLE IF EXISTS `quyen`;")
    op.execute("DROP TABLE IF EXISTS `quy_trinh_nguoi_nhan`;")
    op.execute("DROP TABLE IF EXISTS `phong_ban`;")
    op.execute("DROP TABLE IF EXISTS `phan_quyen_chuc_nang`;")
    op.execute("DROP TABLE IF EXISTS `nhom_tai_lieu`;")
    op.execute("DROP TABLE IF EXISTS `nhanvien_quyen`;")
    op.execute("DROP TABLE IF EXISTS `nhan_su_lich_su`;")
    op.execute("DROP TABLE IF EXISTS `ngay_phep_nam`;")
    op.execute("DROP TABLE IF EXISTS `ngay_nghi_le`;")
    op.execute("DROP TABLE IF EXISTS `luu_kpi`;")
    op.execute("DROP TABLE IF EXISTS `luong_cau_hinh`;")
    op.execute("DROP TABLE IF EXISTS `luong`;")
    op.execute("DROP TABLE IF EXISTS `lich_trinh`;")
    op.execute("DROP TABLE IF EXISTS `lich_su_cong_phep`;")
    op.execute("DROP TABLE IF EXISTS `file_dinh_kem`;")
    op.execute("DROP TABLE IF EXISTS `du_an`;")
    op.execute("DROP TABLE IF EXISTS `don_nghi_phep`;")
    op.execute("DROP TABLE IF EXISTS `cong_viec_tien_do`;")
    op.execute("DROP TABLE IF EXISTS `cong_viec_quy_trinh`;")
    op.execute("DROP TABLE IF EXISTS `cong_viec_nguoi_nhan`;")
    op.execute("DROP TABLE IF EXISTS `cong_viec_lich_su`;")
    op.execute("DROP TABLE IF EXISTS `cong_viec_danh_gia`;")
    op.execute("DROP TABLE IF EXISTS `cong_viec`;")
    op.execute("DROP TABLE IF EXISTS `cham_cong`;")
    op.execute("DROP TABLE IF EXISTS `cau_hinh_he_thong`;")
