from app.api.v1.endpoints import auth
from app.api.v1.endpoints import cau_hinh_he_thong
from app.api.v1.endpoints import cham_cong
from app.api.v1.endpoints import cong_viec
from app.api.v1.endpoints import cong_viec_lich_su
from app.api.v1.endpoints import cong_viec_nguoi_nhan
from app.api.v1.endpoints import cong_viec_quy_trinh
from app.api.v1.endpoints import cong_viec_tien_do
from app.api.v1.endpoints import don_nghi_phep
from app.api.v1.endpoints import du_an
from app.api.v1.endpoints import file_dinh_kem
from app.api.v1.endpoints import lich_su_cong_phep
from app.api.v1.endpoints import luong
from app.api.v1.endpoints import luong_cau_hinh
from app.api.v1.endpoints import luong_tinh_toan
from app.api.v1.endpoints import luu_kpi
from app.api.v1.endpoints import kpi_tinh_toan
from app.api.v1.endpoints import ngay_nghi_le
from app.api.v1.endpoints import ngay_phep_nam
from app.api.v1.endpoints import nhan_su_lich_su
from app.api.v1.endpoints import nhanvien_admin
from app.api.v1.endpoints import nhanvien_quyen
from app.api.v1.endpoints import phan_quyen_chuc_nang
from app.api.v1.endpoints import phong_ban
from app.api.v1.endpoints import quy_trinh_nguoi_nhan
from app.api.v1.endpoints import quyen
from app.api.v1.endpoints import thong_bao

from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(cau_hinh_he_thong.router)
api_router.include_router(cham_cong.router)
api_router.include_router(cong_viec.router)
api_router.include_router(cong_viec_lich_su.router)
api_router.include_router(cong_viec_nguoi_nhan.router)
api_router.include_router(cong_viec_quy_trinh.router)
api_router.include_router(cong_viec_tien_do.router)
api_router.include_router(don_nghi_phep.router)
api_router.include_router(du_an.router)
api_router.include_router(file_dinh_kem.router)
api_router.include_router(lich_su_cong_phep.router)
api_router.include_router(luong.router)
api_router.include_router(luong_cau_hinh.router)
api_router.include_router(luong_tinh_toan.router)
api_router.include_router(luu_kpi.router)
api_router.include_router(kpi_tinh_toan.router)
api_router.include_router(ngay_nghi_le.router)
api_router.include_router(ngay_phep_nam.router)
api_router.include_router(nhan_su_lich_su.router)
api_router.include_router(nhanvien_admin.router)
api_router.include_router(nhanvien_quyen.router)
api_router.include_router(phan_quyen_chuc_nang.router)
api_router.include_router(phong_ban.router)
api_router.include_router(quy_trinh_nguoi_nhan.router)
api_router.include_router(quyen.router)
api_router.include_router(thong_bao.router)
