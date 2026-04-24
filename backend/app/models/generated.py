# coding: utf-8
import sqlalchemy as sa
from sqlalchemy.dialects import mysql
from app.db.base import Base

class CauHinhHeThong(Base):
    __tablename__ = "cau_hinh_he_thong"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    ten_cau_hinh = sa.Column('ten_cau_hinh', sa.String(100))
    gia_tri = sa.Column('gia_tri', sa.Text)
    mo_ta = sa.Column('mo_ta', sa.Text)
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))

class ChamCong(Base):
    __tablename__ = "cham_cong"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    nhan_vien_id = sa.Column('nhan_vien_id', sa.Integer)
    ngay = sa.Column('ngay', sa.Date)
    bao_cao = sa.Column('bao_cao', sa.String(255))
    check_in = sa.Column('check_in', sa.Time)
    check_out = sa.Column('check_out', sa.Time)
    loai_cham_cong = sa.Column('loai_cham_cong', sa.String(20), server_default=sa.text("'office'"))
    trang_thai = sa.Column('trang_thai', sa.String(50), server_default=sa.text("'Bình thường'"))
    __table_args__ = (
        sa.UniqueConstraint('nhan_vien_id', 'ngay', name="nhan_vien_id"),
        sa.ForeignKeyConstraint(['nhan_vien_id'], ['nhanvien.id'], name="cham_cong_ibfk_1", ondelete="CASCADE"),
    )

class CongViec(Base):
    __tablename__ = "cong_viec"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    du_an_id = sa.Column('du_an_id', sa.Integer)
    ten_cong_viec = sa.Column('ten_cong_viec', sa.String(255), nullable=False)
    mo_ta = sa.Column('mo_ta', sa.Text)
    han_hoan_thanh = sa.Column('han_hoan_thanh', sa.Date)
    ngay_gia_han = sa.Column('ngay_gia_han', sa.Date)
    muc_do_uu_tien = sa.Column('muc_do_uu_tien', mysql.ENUM('Thấp', 'Trung bình', 'Cao'), server_default=sa.text("'Trung bình'"))
    nguoi_giao_id = sa.Column('nguoi_giao_id', sa.Integer)
    phong_ban_id = sa.Column('phong_ban_id', sa.Integer)
    trang_thai = sa.Column('trang_thai', mysql.ENUM('Chưa bắt đầu', 'Đang thực hiện', 'Đã hoàn thành', 'Trễ hạn'), server_default=sa.text("'Chưa bắt đầu'"))
    trang_thai_duyet = sa.Column('trang_thai_duyet', sa.String(50), server_default=sa.text("'Chưa duyệt'"))
    ly_do_duyet = sa.Column('ly_do_duyet', sa.Text)
    tai_lieu_cv = sa.Column('tai_lieu_cv', sa.String(255))
    file_tai_lieu = sa.Column('file_tai_lieu', sa.String(255))
    nhac_viec = sa.Column('nhac_viec', sa.Integer)
    tinh_trang = sa.Column('tinh_trang', sa.String(50))
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    ngay_bat_dau = sa.Column('ngay_bat_dau', sa.Date)
    ngay_hoan_thanh = sa.Column('ngay_hoan_thanh', sa.Date)
    __table_args__ = (
        sa.ForeignKeyConstraint(['nguoi_giao_id'], ['nhanvien.id'], name="cong_viec_ibfk_1", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(['phong_ban_id'], ['phong_ban.id'], name="cong_viec_ibfk_3", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(['du_an_id'], ['du_an.id'], name="fk_cong_viec_du_an", ondelete="CASCADE", onupdate="CASCADE"),
        sa.Index("nguoi_giao_id", 'nguoi_giao_id'),
        sa.Index("phong_ban_id", 'phong_ban_id'),
        sa.Index("fk_cong_viec_du_an", 'du_an_id'),
    )

class CongViecDanhGia(Base):
    __tablename__ = "cong_viec_danh_gia"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    cong_viec_id = sa.Column('cong_viec_id', sa.Integer)
    nguoi_danh_gia_id = sa.Column('nguoi_danh_gia_id', sa.Integer)
    is_from_worker = sa.Column('is_from_worker', sa.Boolean, nullable=False, server_default=sa.text("'0'"))
    nhan_xet = sa.Column('nhan_xet', sa.Text)
    thoi_gian = sa.Column('thoi_gian', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['cong_viec_id'], ['cong_viec.id'], name="cong_viec_danh_gia_ibfk_1", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(['nguoi_danh_gia_id'], ['nhanvien.id'], name="cong_viec_danh_gia_ibfk_2", ondelete="CASCADE"),
        sa.Index("cong_viec_id", 'cong_viec_id'),
        sa.Index("nguoi_danh_gia_id", 'nguoi_danh_gia_id'),
    )

class CongViecLichSu(Base):
    __tablename__ = "cong_viec_lich_su"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    cong_viec_id = sa.Column('cong_viec_id', sa.Integer)
    nguoi_thay_doi_id = sa.Column('nguoi_thay_doi_id', sa.Integer)
    mo_ta_thay_doi = sa.Column('mo_ta_thay_doi', sa.Text)
    thoi_gian = sa.Column('thoi_gian', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['cong_viec_id'], ['cong_viec.id'], name="cong_viec_lich_su_ibfk_1", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(['nguoi_thay_doi_id'], ['nhanvien.id'], name="cong_viec_lich_su_ibfk_2", ondelete="CASCADE"),
        sa.Index("cong_viec_id", 'cong_viec_id'),
        sa.Index("nguoi_thay_doi_id", 'nguoi_thay_doi_id'),
    )

class CongViecNguoiNhan(Base):
    __tablename__ = "cong_viec_nguoi_nhan"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    cong_viec_id = sa.Column('cong_viec_id', sa.Integer, nullable=False)
    nhan_vien_id = sa.Column('nhan_vien_id', sa.Integer, nullable=False)
    __table_args__ = (
        sa.ForeignKeyConstraint(['cong_viec_id'], ['cong_viec.id'], name="cong_viec_nguoi_nhan_ibfk_1", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(['nhan_vien_id'], ['nhanvien.id'], name="cong_viec_nguoi_nhan_ibfk_2", ondelete="CASCADE"),
        sa.Index("cong_viec_id", 'cong_viec_id'),
        sa.Index("nhan_vien_id", 'nhan_vien_id'),
    )

class CongViecQuyTrinh(Base):
    __tablename__ = "cong_viec_quy_trinh"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    cong_viec_id = sa.Column('cong_viec_id', sa.Integer)
    ten_buoc = sa.Column('ten_buoc', sa.String(255))
    mo_ta = sa.Column('mo_ta', sa.Text)
    trang_thai = sa.Column('trang_thai', mysql.ENUM('Chưa bắt đầu', 'Đang thực hiện', 'Đã hoàn thành'), server_default=sa.text("'Chưa bắt đầu'"))
    ngay_bat_dau = sa.Column('ngay_bat_dau', sa.Date)
    ngay_ket_thuc = sa.Column('ngay_ket_thuc', sa.Date)
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    tai_lieu_link = sa.Column('tai_lieu_link', sa.String(500))
    tai_lieu_file = sa.Column('tai_lieu_file', sa.String(500))
    __table_args__ = (
        sa.ForeignKeyConstraint(['cong_viec_id'], ['cong_viec.id'], name="cong_viec_quy_trinh_ibfk_1", ondelete="CASCADE"),
        sa.Index("cong_viec_id", 'cong_viec_id'),
    )

class CongViecTienDo(Base):
    __tablename__ = "cong_viec_tien_do"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    cong_viec_id = sa.Column('cong_viec_id', sa.Integer)
    phan_tram = sa.Column('phan_tram', sa.Integer)
    thoi_gian_cap_nhat = sa.Column('thoi_gian_cap_nhat', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['cong_viec_id'], ['cong_viec.id'], name="cong_viec_tien_do_ibfk_1", ondelete="CASCADE"),
        sa.Index("cong_viec_id", 'cong_viec_id'),
    )

class DonNghiPhep(Base):
    __tablename__ = "don_nghi_phep"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    nhan_vien_id = sa.Column('nhan_vien_id', sa.Integer, nullable=False)
    loai_phep = sa.Column('loai_phep', sa.String(50), nullable=False)
    ngay_bat_dau = sa.Column('ngay_bat_dau', sa.Date, nullable=False)
    ngay_ket_thuc = sa.Column('ngay_ket_thuc', sa.Date, nullable=False)
    so_ngay = sa.Column('so_ngay', sa.Numeric(4, 1), nullable=False)
    ly_do = sa.Column('ly_do', sa.Text, nullable=False)
    trang_thai = sa.Column('trang_thai', mysql.ENUM('cho_duyet', 'da_duyet', 'tu_choi'), server_default=sa.text("'cho_duyet'"))
    ly_do_tu_choi = sa.Column('ly_do_tu_choi', sa.Text)
    nguoi_duyet_id = sa.Column('nguoi_duyet_id', sa.Integer)
    nguoi_tao_id = sa.Column('nguoi_tao_id', sa.Integer)
    thoi_gian_tao = sa.Column('thoi_gian_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    thoi_gian_duyet = sa.Column('thoi_gian_duyet', mysql.TIMESTAMP())
    ghi_chu = sa.Column('ghi_chu', sa.Text)
    __table_args__ = (
        sa.ForeignKeyConstraint(['nguoi_duyet_id'], ['nhanvien.id'], name="fk_don_nghi_phep_nguoiduyet", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(['nhan_vien_id'], ['nhanvien.id'], name="fk_don_nghi_phep_nhanvien", ondelete="CASCADE"),
        sa.Index("idx_nhan_vien_id", 'nhan_vien_id'),
        sa.Index("idx_trang_thai", 'trang_thai'),
        sa.Index("idx_ngay_bat_dau", 'ngay_bat_dau'),
        sa.Index("idx_nguoi_duyet_id", 'nguoi_duyet_id'),
    )

class DuAn(Base):
    __tablename__ = "du_an"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    ten_du_an = sa.Column('ten_du_an', sa.String(255), nullable=False)
    mo_ta = sa.Column('mo_ta', sa.Text)
    lead_id = sa.Column('lead_id', sa.Integer)
    muc_do_uu_tien = sa.Column('muc_do_uu_tien', sa.String(50))
    ngay_bat_dau = sa.Column('ngay_bat_dau', sa.Date)
    ngay_ket_thuc = sa.Column('ngay_ket_thuc', sa.Date)
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    nhom_du_an = sa.Column('nhom_du_an', sa.String(100))
    phong_ban = sa.Column('phong_ban', sa.String(255))
    trang_thai_duan = sa.Column('trang_thai_duan', sa.String(100))
    __table_args__ = (
        sa.ForeignKeyConstraint(['lead_id'], ['nhanvien.id'], name="fk_duan_lead", ondelete="SET NULL", onupdate="CASCADE"),
        sa.Index("fk_duan_lead", 'lead_id'),
    )

class FileDinhKem(Base):
    __tablename__ = "file_dinh_kem"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    cong_viec_id = sa.Column('cong_viec_id', sa.Integer)
    tien_do_id = sa.Column('tien_do_id', sa.Integer)
    duong_dan_file = sa.Column('duong_dan_file', sa.String(255))
    mo_ta = sa.Column('mo_ta', sa.Text)
    thoi_gian_upload = sa.Column('thoi_gian_upload', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['cong_viec_id'], ['cong_viec.id'], name="file_dinh_kem_ibfk_1", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(['tien_do_id'], ['cong_viec_tien_do.id'], name="file_dinh_kem_ibfk_2", ondelete="CASCADE"),
        sa.Index("cong_viec_id", 'cong_viec_id'),
        sa.Index("tien_do_id", 'tien_do_id'),
    )

class LichSuCongPhep(Base):
    __tablename__ = "lich_su_cong_phep"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    nhan_vien_id = sa.Column('nhan_vien_id', sa.Integer, nullable=False)
    nam = sa.Column('nam', sa.Integer, nullable=False)
    thang = sa.Column('thang', sa.Integer)
    so_ngay_cong = sa.Column('so_ngay_cong', sa.Numeric(4, 1), nullable=False)
    loai_cong = sa.Column('loai_cong', mysql.ENUM('dau_nam', 'hang_thang'), nullable=False)
    ly_do = sa.Column('ly_do', sa.Text)
    ngay_cong = sa.Column('ngay_cong', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['nhan_vien_id'], ['nhanvien.id'], name="fk_lich_su_cong_phep", ondelete="CASCADE"),
        sa.Index("idx_nhan_vien_nam", 'nhan_vien_id', 'nam'),
    )

class LichTrinh(Base):
    __tablename__ = "lich_trinh"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    tieu_de = sa.Column('tieu_de', sa.String(255), nullable=False)
    ngay_bat_dau = sa.Column('ngay_bat_dau', sa.Date, nullable=False)
    ngay_ket_thuc = sa.Column('ngay_ket_thuc', sa.Date)
    mo_ta = sa.Column('mo_ta', sa.Text)
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))

class Luong(Base):
    __tablename__ = "luong"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    nhan_vien_id = sa.Column('nhan_vien_id', sa.Integer)
    thang = sa.Column('thang', sa.Integer)
    nam = sa.Column('nam', sa.Integer)
    luong_co_ban = sa.Column('luong_co_ban', sa.Numeric(12, 2))
    phu_cap = sa.Column('phu_cap', sa.Numeric(12, 2), server_default=sa.text("'0.00'"))
    thuong = sa.Column('thuong', sa.Numeric(12, 2), server_default=sa.text("'0.00'"))
    phat = sa.Column('phat', sa.Numeric(12, 2), server_default=sa.text("'0.00'"))
    bao_hiem = sa.Column('bao_hiem', sa.Numeric(12, 2), server_default=sa.text("'0.00'"))
    thue = sa.Column('thue', sa.Numeric(12, 2), server_default=sa.text("'0.00'"))
    luong_thuc_te = sa.Column('luong_thuc_te', sa.Numeric(12, 2))
    ghi_chu = sa.Column('ghi_chu', sa.Text)
    trang_thai = sa.Column('trang_thai', mysql.ENUM('Chưa trả', 'Đã trả'), server_default=sa.text("'Chưa trả'"))
    ngay_tra_luong = sa.Column('ngay_tra_luong', sa.Date)
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['nhan_vien_id'], ['nhanvien.id'], name="luong_ibfk_1", ondelete="CASCADE"),
        sa.Index("nhan_vien_id", 'nhan_vien_id'),
    )

class LuongCauHinh(Base):
    __tablename__ = "luong_cau_hinh"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    ten_cau_hinh = sa.Column('ten_cau_hinh', sa.String(100))
    gia_tri = sa.Column('gia_tri', sa.String(100))
    mo_ta = sa.Column('mo_ta', sa.Text)
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))

class LuuKpi(Base):
    __tablename__ = "luu_kpi"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    nhan_vien_id = sa.Column('nhan_vien_id', sa.Integer)
    thang = sa.Column('thang', sa.Integer)
    nam = sa.Column('nam', sa.Integer)
    chi_tieu = sa.Column('chi_tieu', sa.Text)
    ket_qua = sa.Column('ket_qua', sa.Text)
    diem_kpi = sa.Column('diem_kpi', sa.Float)
    ghi_chu = sa.Column('ghi_chu', sa.Text)
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['nhan_vien_id'], ['nhanvien.id'], name="luu_kpi_ibfk_1", ondelete="CASCADE"),
        sa.Index("nhan_vien_id", 'nhan_vien_id'),
    )

class NgayNghiLe(Base):
    __tablename__ = "ngay_nghi_le"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    ten_ngay_le = sa.Column('ten_ngay_le', sa.String(200), nullable=False)
    ngay_bat_dau = sa.Column('ngay_bat_dau', sa.Date, nullable=False)
    ngay_ket_thuc = sa.Column('ngay_ket_thuc', sa.Date, nullable=False)
    lap_lai_hang_nam = sa.Column('lap_lai_hang_nam', sa.Boolean, server_default=sa.text("'0'"))
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.Index("idx_ngay_bat_dau", 'ngay_bat_dau'),
        sa.Index("idx_ngay_ket_thuc", 'ngay_ket_thuc'),
    )

class NgayPhepNam(Base):
    __tablename__ = "ngay_phep_nam"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    nhan_vien_id = sa.Column('nhan_vien_id', sa.Integer, nullable=False)
    nam = sa.Column('nam', sa.Integer, nullable=False)
    tong_ngay_phep = sa.Column('tong_ngay_phep', sa.Numeric(4, 1), server_default=sa.text("'12.0'"))
    ngay_phep_da_dung = sa.Column('ngay_phep_da_dung', sa.Numeric(4, 1), server_default=sa.text("'0.0'"))
    ngay_phep_con_lai = sa.Column('ngay_phep_con_lai', sa.Numeric(4, 1), server_default=sa.text("'12.0'"))
    ngay_phep_nam_truoc = sa.Column('ngay_phep_nam_truoc', sa.Numeric(4, 1), server_default=sa.text("'0.0'"))
    da_cong_phep_dau_nam = sa.Column('da_cong_phep_dau_nam', sa.Boolean, server_default=sa.text("'0'"))
    ngay_cap_nhat = sa.Column('ngay_cap_nhat', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.UniqueConstraint('nhan_vien_id', 'nam', name="uk_nhanvien_nam"),
        sa.ForeignKeyConstraint(['nhan_vien_id'], ['nhanvien.id'], name="fk_ngay_phep_nhanvien", ondelete="CASCADE"),
    )

class NhanSuLichSu(Base):
    __tablename__ = "nhan_su_lich_su"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    nhan_vien_id = sa.Column('nhan_vien_id', sa.Integer)
    loai_thay_doi = sa.Column('loai_thay_doi', sa.String(100))
    gia_tri_cu = sa.Column('gia_tri_cu', sa.Text)
    gia_tri_moi = sa.Column('gia_tri_moi', sa.Text)
    nguoi_thay_doi_id = sa.Column('nguoi_thay_doi_id', sa.Integer)
    ghi_chu = sa.Column('ghi_chu', sa.Text)
    thoi_gian = sa.Column('thoi_gian', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['nhan_vien_id'], ['nhanvien.id'], name="nhan_su_lich_su_ibfk_1", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(['nguoi_thay_doi_id'], ['nhanvien.id'], name="nhan_su_lich_su_ibfk_2", ondelete="SET NULL"),
        sa.Index("nhan_vien_id", 'nhan_vien_id'),
        sa.Index("nguoi_thay_doi_id", 'nguoi_thay_doi_id'),
    )

class Nhanvien(Base):
    __tablename__ = "nhanvien"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    ho_ten = sa.Column('ho_ten', sa.String(100), nullable=False)
    email = sa.Column('email', sa.String(100), nullable=False)
    mat_khau = sa.Column('mat_khau', sa.String(255), nullable=False)
    so_dien_thoai = sa.Column('so_dien_thoai', sa.String(20))
    gioi_tinh = sa.Column('gioi_tinh', mysql.ENUM('Nam', 'Nữ', 'Khác'))
    ngay_sinh = sa.Column('ngay_sinh', sa.Date)
    phong_ban_id = sa.Column('phong_ban_id', sa.Integer)
    chuc_vu = sa.Column('chuc_vu', sa.String(100))
    luong_co_ban = sa.Column('luong_co_ban', sa.Numeric(12, 2), server_default=sa.text("'0.00'"))
    trang_thai_lam_viec = sa.Column(
        'trang_thai_lam_viec',
        mysql.ENUM('Đang làm', 'Tạm nghỉ', 'Nghỉ việc'),
        server_default=sa.text("'Đang làm'"),
    )
    vai_tro = sa.Column(
        'vai_tro',
        mysql.ENUM('Admin', 'Quản lý', 'Nhân viên'),
        server_default=sa.text("'Nhân viên'"),
    )
    ngay_vao_lam = sa.Column('ngay_vao_lam', sa.Date)
    avatar_url = sa.Column('avatar_url', sa.String(255))
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.UniqueConstraint('email', name="email"),
        sa.ForeignKeyConstraint(['phong_ban_id'], ['phong_ban.id'], name="nhanvien_ibfk_1", ondelete="SET NULL"),
        sa.Index("phong_ban_id", 'phong_ban_id'),
    )

class NhanvienQuyen(Base):
    __tablename__ = "nhanvien_quyen"
    nhanvien_id = sa.Column('nhanvien_id', sa.Integer, primary_key=True, nullable=False)
    quyen_id = sa.Column('quyen_id', sa.Integer, primary_key=True, nullable=False)
    __table_args__ = (
        sa.Index("quyen_id", 'quyen_id'),
    )

class NhomTaiLieu(Base):
    __tablename__ = "nhom_tai_lieu"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    ten_nhom = sa.Column('ten_nhom', sa.String(255), nullable=False)
    mo_ta = sa.Column('mo_ta', sa.Text)
    icon = sa.Column('icon', sa.String(50), server_default=sa.text("'fa-folder'"))
    mau_sac = sa.Column('mau_sac', sa.String(20), server_default=sa.text("'#3b82f6'"))
    nguoi_tao_id = sa.Column('nguoi_tao_id', sa.Integer)
    ngay_tao = sa.Column('ngay_tao', sa.Date, server_default=sa.text("CURRENT_TIMESTAMP"))
    ngay_cap_nhat = sa.Column('ngay_cap_nhat', sa.Date, server_default=sa.text("CURRENT_TIMESTAMP"))
    trang_thai = sa.Column('trang_thai', mysql.ENUM('Hoạt động', 'Đã xóa'), server_default=sa.text("'Hoạt động'"))
    thu_tu = sa.Column('thu_tu', sa.Integer, server_default=sa.text("'0'"))
    doi_tuong_xem = sa.Column('doi_tuong_xem', mysql.ENUM('Tất cả', 'Giám đốc và Trưởng phòng', 'Chỉ nhân viên'), server_default=sa.text("'Tất cả'"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['nguoi_tao_id'], ['nhanvien.id'], name="nhom_tai_lieu_ibfk_1", ondelete="SET NULL"),
        sa.Index("nguoi_tao_id", 'nguoi_tao_id'),
        sa.Index("idx_trang_thai", 'trang_thai'),
        sa.Index("idx_thu_tu", 'thu_tu'),
    )

class PhanQuyenChucNang(Base):
    __tablename__ = "phan_quyen_chuc_nang"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    vai_tro = sa.Column('vai_tro', mysql.ENUM('Admin', 'Quản lý', 'Nhân viên', 'Trưởng nhóm', 'Nhân viên cấp cao'))
    chuc_nang = sa.Column('chuc_nang', sa.String(100))
    co_quyen = sa.Column('co_quyen', sa.Boolean, server_default=sa.text("'0'"))

class PhongBan(Base):
    __tablename__ = "phong_ban"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    ten_phong = sa.Column('ten_phong', sa.String(100), nullable=False)
    truong_phong_id = sa.Column('truong_phong_id', sa.Integer)
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['truong_phong_id'], ['nhanvien.id'], name="fk_truong_phong", ondelete="SET NULL"),
        sa.Index("fk_truong_phong", 'truong_phong_id'),
    )

class QuyTrinhNguoiNhan(Base):
    __tablename__ = "quy_trinh_nguoi_nhan"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    step_id = sa.Column('step_id', sa.Integer)
    nhan_id = sa.Column('nhan_id', sa.Integer)
    __table_args__ = (
        sa.ForeignKeyConstraint(['step_id'], ['cong_viec_quy_trinh.id'], name="quy_trinh_nguoi_nhan_ibfk_1", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(['nhan_id'], ['nhanvien.id'], name="quy_trinh_nguoi_nhan_ibfk_2"),
        sa.Index("nhan_id", 'nhan_id'),
        sa.Index("quy_trinh_nguoi_nhan_ibfk_1", 'step_id'),
    )

class Quyen(Base):
    __tablename__ = "quyen"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    ma_quyen = sa.Column('ma_quyen', sa.String(100), nullable=False)
    ten_quyen = sa.Column('ten_quyen', sa.String(255), nullable=False)
    nhom_quyen = sa.Column('nhom_quyen', sa.String(100))
    __table_args__ = (
        sa.UniqueConstraint('ma_quyen', name="ma_quyen"),
    )

class TaiLieu(Base):
    __tablename__ = "tai_lieu"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    nhom_tai_lieu_id = sa.Column('nhom_tai_lieu_id', sa.Integer)
    ten_tai_lieu = sa.Column('ten_tai_lieu', sa.String(255), nullable=False)
    loai_tai_lieu = sa.Column('loai_tai_lieu', sa.String(100))
    mo_ta = sa.Column('mo_ta', sa.Text)
    file_name = sa.Column('file_name', sa.String(255), nullable=False)
    file_path = sa.Column('file_path', sa.String(500), nullable=False)
    file_size = sa.Column('file_size', sa.BigInteger, nullable=False)
    file_type = sa.Column('file_type', sa.String(255))
    nguoi_tao_id = sa.Column('nguoi_tao_id', sa.Integer, nullable=False)
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), server_default=sa.text("CURRENT_TIMESTAMP"))
    ngay_cap_nhat = sa.Column('ngay_cap_nhat', mysql.TIMESTAMP(), server_default=sa.text("CURRENT_TIMESTAMP"))
    trang_thai = sa.Column('trang_thai', sa.String(50), server_default=sa.text("'Hoạt động'"))
    luot_xem = sa.Column('luot_xem', sa.Integer, server_default=sa.text("'0'"))
    luot_tai = sa.Column('luot_tai', sa.Integer, server_default=sa.text("'0'"))
    doi_tuong_xem = sa.Column('doi_tuong_xem', mysql.ENUM('Tất cả', 'Giám đốc và Trưởng phòng', 'Chỉ nhân viên'), server_default=sa.text("'Tất cả'"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['nguoi_tao_id'], ['nhanvien.id'], name="fk_tai_lieu_nguoi_tao", ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(['nhom_tai_lieu_id'], ['nhom_tai_lieu.id'], name="tai_lieu_ibfk_1", ondelete="SET NULL"),
        sa.Index("fk_tai_lieu_nguoi_tao", 'nguoi_tao_id'),
        sa.Index("nhom_tai_lieu_id", 'nhom_tai_lieu_id'),
    )

class ThongBao(Base):
    __tablename__ = "thong_bao"
    id = sa.Column('id', sa.Integer, primary_key=True, nullable=False, autoincrement=True)
    tieu_de = sa.Column('tieu_de', sa.String(255))
    noi_dung = sa.Column('noi_dung', sa.Text)
    nguoi_nhan_id = sa.Column('nguoi_nhan_id', sa.Integer)
    loai_thong_bao = sa.Column('loai_thong_bao', sa.Text)
    duong_dan = sa.Column('duong_dan', sa.String(500))
    da_doc = sa.Column('da_doc', sa.Boolean, server_default=sa.text("'0'"))
    ngay_doc = sa.Column('ngay_doc', mysql.TIMESTAMP())
    ngay_tao = sa.Column('ngay_tao', mysql.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        sa.ForeignKeyConstraint(['nguoi_nhan_id'], ['nhanvien.id'], name="thong_bao_ibfk_1", ondelete="CASCADE"),
        sa.Index("nguoi_nhan_id", 'nguoi_nhan_id'),
    )

