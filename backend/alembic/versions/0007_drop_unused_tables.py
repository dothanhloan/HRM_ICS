"""Drop unused tables: lich_trinh, tai_lieu, nhom_tai_lieu

Revision ID: 0007_drop_unused_tables
Revises: 0006_update_payroll_insurance_base
Create Date: 2026-06-12
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_drop_unused_tables"
down_revision = "0006_update_payroll_insurance_base"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS tai_lieu")
    op.execute("DROP TABLE IF EXISTS nhom_tai_lieu")
    op.execute("DROP TABLE IF EXISTS lich_trinh")


def downgrade() -> None:
    # Recreate tables if needed for rollback
    op.create_table(
        'lich_trinh',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('tieu_de', sa.String(255), nullable=False),
        sa.Column('ngay_bat_dau', sa.Date(), nullable=False),
        sa.Column('ngay_ket_thuc', sa.Date(), nullable=True),
        sa.Column('mo_ta', sa.Text(), nullable=True),
        sa.Column('ngay_tao', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )

    op.create_table(
        'nhom_tai_lieu',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('ten_nhom', sa.String(255), nullable=False),
        sa.Column('mo_ta', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(50), nullable=True, server_default='fa-folder'),
        sa.Column('mau_sac', sa.String(20), nullable=True, server_default='#3b82f6'),
        sa.Column('nguoi_tao_id', sa.Integer(), nullable=True),
        sa.Column('ngay_tao', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('ngay_cap_nhat', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('trang_thai', sa.Enum('Hoáº¡t Ä‘á»™ng', 'ÄÃ£ xÃ³a'), server_default='Hoáº¡t Ä‘á»™ng', nullable=True),
        sa.Column('thu_tu', sa.Integer(), server_default='0', nullable=True),
        sa.Column('doi_tuong_xem', sa.Enum('Táº¥t cáº£', 'GiÃ¡m Ä‘á»‘c vÃ  TrÆ°á»Ÿng phÃ²ng', 'Chá»‰ nhÃ¢n viÃªn'), server_default='Táº¥t cáº£', nullable=True),
        sa.ForeignKeyConstraint(['nguoi_tao_id'], ['nhanvien.id'], name='nhom_tai_lieu_ibfk_1', ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_trang_thai', 'trang_thai'),
        sa.Index('idx_thu_tu', 'thu_tu'),
        sa.Index('nguoi_tao_id', 'nguoi_tao_id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )

    op.create_table(
        'tai_lieu',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nhom_tai_lieu_id', sa.Integer(), nullable=True),
        sa.Column('ten_tai_lieu', sa.String(255), nullable=False),
        sa.Column('loai_tai_lieu', sa.String(100), nullable=True),
        sa.Column('mo_ta', sa.Text(), nullable=True),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('file_type', sa.String(255), nullable=True),
        sa.Column('nguoi_tao_id', sa.Integer(), nullable=False),
        sa.Column('ngay_tao', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('ngay_cap_nhat', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('trang_thai', sa.String(50), server_default='Hoáº¡t Ä‘á»™ng', nullable=True),
        sa.Column('luot_xem', sa.Integer(), server_default='0', nullable=True),
        sa.Column('luot_tai', sa.Integer(), server_default='0', nullable=True),
        sa.Column('doi_tuong_xem', sa.Enum('Táº¥t cáº£', 'GiÃ¡m Ä‘á»‘c vÃ  TrÆ°á»Ÿng phÃ²ng', 'Chá»‰ nhÃ¢n viÃªn'), server_default='Táº¥t cáº£', nullable=True),
        sa.ForeignKeyConstraint(['nguoi_tao_id'], ['nhanvien.id'], name='fk_tai_lieu_nguoi_tao', ondelete='RESTRICT', onupdate='CASCADE'),
        sa.ForeignKeyConstraint(['nhom_tai_lieu_id'], ['nhom_tai_lieu.id'], name='tai_lieu_ibfk_1', ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('fk_tai_lieu_nguoi_tao', 'nguoi_tao_id'),
        sa.Index('nhom_tai_lieu_id', 'nhom_tai_lieu_id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
