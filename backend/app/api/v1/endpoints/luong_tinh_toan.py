from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.payroll_service import calculate_payroll, export_payroll_period, list_payroll_records

router = APIRouter(prefix="/luong_tinh_toan", tags=["luong_tinh_toan"])


class LuongTinhToanPayload(BaseModel):
	actor_id: int = Field(gt=0)
	actor_role: str = "Nhân viên"
	target_nhan_vien_id: Optional[int] = None
	thang: int = Field(ge=1, le=12)
	nam: int = Field(ge=2000, le=2100)
	# Backward compatible alias, defaults to target employee.
	nhan_vien_id: Optional[int] = None
	phu_cap: Decimal = Decimal("0")
	thuong: Decimal = Decimal("0")
	phat: Decimal = Decimal("0")
	luu_ket_qua: bool = True
	trang_thai_thanh_toan: str = "Chờ duyệt"
	so_ngay_cong_chuan: Optional[Decimal] = None


@router.post("/tinh_toan")
def tinh_toan_luong(payload: LuongTinhToanPayload, db: Session = Depends(get_db)) -> dict:
	requested_employee_id = payload.target_nhan_vien_id or payload.nhan_vien_id or payload.actor_id
	try:
		result = calculate_payroll(
			db=db,
			actor_id=payload.actor_id,
			actor_role=payload.actor_role,
			thang=payload.thang,
			nam=payload.nam,
			target_employee_id=requested_employee_id,
			phu_cap=payload.phu_cap,
			thuong=payload.thuong,
			phat=payload.phat,
			so_ngay_cong_chuan=payload.so_ngay_cong_chuan,
			trang_thai_thanh_toan=payload.trang_thai_thanh_toan,
			luu_ket_qua=payload.luu_ket_qua,
		)
	except ValueError as exc:
		raise HTTPException(status_code=404, detail=str(exc)) from exc
	return {"data": result}


@router.get("/danh_sach")
def danh_sach_luong(
	actor_id: int,
	actor_role: str = "Nhân viên",
	thang: Optional[int] = None,
	nam: Optional[int] = None,
	search: Optional[str] = None,
	target_nhan_vien_id: Optional[int] = None,
	page: int = 1,
	page_size: int = 20,
	db: Session = Depends(get_db),
) -> dict:
	return list_payroll_records(
		db=db,
		actor_id=actor_id,
		actor_role=actor_role,
		thang=thang,
		nam=nam,
		search=search,
		target_employee_id=target_nhan_vien_id,
		page=page,
		page_size=page_size,
	)


@router.post("/xuat_bang_luong")
def xuat_bang_luong(
	actor_id: int,
	actor_role: str = "Nhân viên",
	thang: int = 1,
	nam: int = 2026,
	db: Session = Depends(get_db),
) -> dict:
	try:
		return export_payroll_period(db=db, actor_id=actor_id, actor_role=actor_role, thang=thang, nam=nam)
	except ValueError as exc:
		raise HTTPException(status_code=403, detail=str(exc)) from exc
