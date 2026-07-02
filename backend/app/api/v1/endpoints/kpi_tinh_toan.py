from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.services.hrm_access import has_permission_group

from app.api.deps import get_db
from app.services.kpi_service import calculate_kpi, list_kpi_records, run_kpi_period

router = APIRouter(prefix="/kpi_tinh_toan", tags=["kpi_tinh_toan"])


class KpiTinhToanPayload(BaseModel):
	actor_id: int = Field(gt=0)
	actor_role: str = "Nhân viên"
	target_nhan_vien_id: Optional[int] = None
	thang: int = Field(ge=1, le=12)
	nam: int = Field(ge=2000, le=2100)
	# Backward compatible alias, defaults to target employee.
	nhan_vien_id: Optional[int] = None
	luu_ket_qua: bool = True
	ghi_chu: Optional[str] = None

class KpiChayThangPayload(BaseModel):
	actor_id: int = Field(gt=0)
	actor_role: str = "Nhan vien"
	thang: int = Field(ge=1, le=12)
	nam: int = Field(ge=2000, le=2100)


@router.post("/tinh_toan")
def tinh_toan_kpi(payload: KpiTinhToanPayload, db: Session = Depends(get_db)) -> dict:
	requested_employee_id = payload.target_nhan_vien_id or payload.nhan_vien_id or payload.actor_id
	if not has_permission_group(db, payload.actor_id, ["luong", "salary", "payroll"]):
		requested_employee_id = payload.actor_id
	try:
		result = calculate_kpi(
			db=db,
			actor_id=payload.actor_id,
			actor_role=payload.actor_role,
			thang=payload.thang,
			nam=payload.nam,
			target_employee_id=requested_employee_id,
			ghi_chu=payload.ghi_chu,
			luu_ket_qua=payload.luu_ket_qua,
		)
	except ValueError as exc:
		raise HTTPException(status_code=404, detail=str(exc)) from exc
	return {"data": result}


@router.get("/danh_sach")
def danh_sach_kpi(
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
	return list_kpi_records(
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

@router.post("/chay_thang")
def chay_kpi_thang(
    payload: KpiChayThangPayload,
    db: Session = Depends(get_db),
) -> dict:
    try:
        return run_kpi_period(
            db=db,
            actor_id=payload.actor_id,
            actor_role=payload.actor_role,
            thang=payload.thang,
            nam=payload.nam,
        )
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
