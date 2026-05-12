from datetime import date
from typing import Optional

from fastapi import Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.v1.endpoints.crud_factory import create_crud_router
from app.models.generated import CongViecQuyTrinh


class CongViecQuyTrinhCreate(BaseModel):
	cong_viec_id: int
	ten_buoc: str
	mo_ta: Optional[str] = None
	trang_thai: Optional[str] = None
	ngay_bat_dau: Optional[str] = None
	ngay_ket_thuc: Optional[str] = None
	tai_lieu_link: Optional[str] = None
	tai_lieu_file: Optional[str] = None
	nguoi_nhan_ids: Optional[list[int]] = None

router = create_crud_router(CongViecQuyTrinh, prefix='/cong_viec_quy_trinh', tags=['cong_viec_quy_trinh'])


@router.post('/tao_moi')
def create_step(payload: CongViecQuyTrinhCreate, db: Session = Depends(get_db)) -> dict:
	if not payload.ten_buoc.strip():
		raise HTTPException(status_code=400, detail='Missing step name')

	cong_viec_exists = db.execute(
		text('SELECT COUNT(*) FROM cong_viec WHERE id = :id'),
		{'id': payload.cong_viec_id},
	).scalar()
	if not cong_viec_exists:
		raise HTTPException(status_code=404, detail='Task not found')

	if payload.ngay_bat_dau:
		try:
			date.fromisoformat(payload.ngay_bat_dau)
		except ValueError as exc:
			raise HTTPException(status_code=400, detail='Invalid start date') from exc
	if payload.ngay_ket_thuc:
		try:
			date.fromisoformat(payload.ngay_ket_thuc)
		except ValueError as exc:
			raise HTTPException(status_code=400, detail='Invalid end date') from exc
	if payload.ngay_bat_dau and payload.ngay_ket_thuc:
		if date.fromisoformat(payload.ngay_ket_thuc) < date.fromisoformat(payload.ngay_bat_dau):
			raise HTTPException(status_code=400, detail='Deadline before start date')

	step_params = {
		'cong_viec_id': payload.cong_viec_id,
		'ten_buoc': payload.ten_buoc.strip(),
		'mo_ta': (payload.mo_ta or '').strip() or None,
		'trang_thai': payload.trang_thai or 'Chưa bắt đầu',
		'ngay_bat_dau': payload.ngay_bat_dau,
		'ngay_ket_thuc': payload.ngay_ket_thuc,
		'tai_lieu_link': (payload.tai_lieu_link or '').strip() or None,
		'tai_lieu_file': (payload.tai_lieu_file or '').strip() or None,
	}
	db.execute(
		text(
			'''
			INSERT INTO cong_viec_quy_trinh (
				cong_viec_id, ten_buoc, mo_ta, trang_thai, ngay_bat_dau, ngay_ket_thuc, tai_lieu_link, tai_lieu_file
			) VALUES (
				:cong_viec_id, :ten_buoc, :mo_ta, :trang_thai, :ngay_bat_dau, :ngay_ket_thuc, :tai_lieu_link, :tai_lieu_file
			)
			'''
		),
		step_params,
	)
	step_id = db.execute(text('SELECT LAST_INSERT_ID()')).scalar()

	recipients = list({int(item_id) for item_id in (payload.nguoi_nhan_ids or []) if int(item_id) > 0})
	if recipients:
		db.execute(
			text(
				'''
				INSERT INTO quy_trinh_nguoi_nhan (step_id, nhan_id)
				VALUES (:step_id, :nhan_id)
				'''
			),
			[{'step_id': step_id, 'nhan_id': item_id} for item_id in recipients],
		)

	db.commit()
	return {'status': 'ok', 'id': step_id}
