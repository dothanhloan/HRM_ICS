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
	nguoi_thay_doi_id: Optional[int] = None


class CongViecQuyTrinhUpdate(BaseModel):
	cong_viec_id: Optional[int] = None
	ten_buoc: Optional[str] = None
	mo_ta: Optional[str] = None
	trang_thai: Optional[str] = None
	ngay_bat_dau: Optional[str] = None
	ngay_ket_thuc: Optional[str] = None
	tai_lieu_link: Optional[str] = None
	tai_lieu_file: Optional[str] = None
	nguoi_nhan_ids: Optional[list[int]] = None
	nguoi_thay_doi_id: Optional[int] = None

router = create_crud_router(CongViecQuyTrinh, prefix='/cong_viec_quy_trinh', tags=['cong_viec_quy_trinh'])


def _add_task_history(db: Session, cong_viec_id: int, nguoi_thay_doi_id: Optional[int], message: str) -> None:
	db.execute(
		text(
			'''
			INSERT INTO cong_viec_lich_su (cong_viec_id, nguoi_thay_doi_id, mo_ta_thay_doi)
			VALUES (:cong_viec_id, :nguoi_thay_doi_id, :mo_ta_thay_doi)
			'''
		),
		{
			'cong_viec_id': cong_viec_id,
			'nguoi_thay_doi_id': nguoi_thay_doi_id,
			'mo_ta_thay_doi': message,
		},
	)


def _normalize_value(value) -> str:
	if value is None or value == '':
		return '(chưa có)'
	if isinstance(value, date):
		return value.isoformat()
	return str(value)


def _unique_positive_ids(values) -> list[int]:
	result: list[int] = []
	seen: set[int] = set()
	for value in values or []:
		try:
			item_id = int(value)
		except (TypeError, ValueError):
			continue
		if item_id <= 0 or item_id in seen:
			continue
		seen.add(item_id)
		result.append(item_id)
	return result


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

	_add_task_history(
		db,
		payload.cong_viec_id,
		payload.nguoi_thay_doi_id,
		f'Thêm bước quy trình/công việc con "{step_params["ten_buoc"]}"',
	)
	db.commit()
	return {'status': 'ok', 'id': step_id}


@router.put('/{step_id}/cap_nhat')
def update_step(step_id: int, payload: CongViecQuyTrinhUpdate, db: Session = Depends(get_db)) -> dict:
	current = db.execute(
		text(
			'''
			SELECT id, cong_viec_id, ten_buoc, mo_ta, trang_thai, ngay_bat_dau, ngay_ket_thuc,
				   tai_lieu_link, tai_lieu_file
			FROM cong_viec_quy_trinh
			WHERE id = :id
			'''
		),
		{'id': step_id},
	).mappings().first()
	if not current:
		raise HTTPException(status_code=404, detail='Step not found')

	next_values = {
		'cong_viec_id': payload.cong_viec_id if payload.cong_viec_id is not None else current['cong_viec_id'],
		'ten_buoc': (payload.ten_buoc if payload.ten_buoc is not None else current['ten_buoc'] or '').strip(),
		'mo_ta': (payload.mo_ta if payload.mo_ta is not None else current['mo_ta'] or '').strip() or None,
		'trang_thai': payload.trang_thai if payload.trang_thai is not None else current['trang_thai'],
		'ngay_bat_dau': payload.ngay_bat_dau if payload.ngay_bat_dau is not None else current['ngay_bat_dau'],
		'ngay_ket_thuc': payload.ngay_ket_thuc if payload.ngay_ket_thuc is not None else current['ngay_ket_thuc'],
		'tai_lieu_link': (payload.tai_lieu_link if payload.tai_lieu_link is not None else current['tai_lieu_link'] or '').strip() or None,
		'tai_lieu_file': (payload.tai_lieu_file if payload.tai_lieu_file is not None else current['tai_lieu_file'] or '').strip() or None,
		'id': step_id,
	}
	if not next_values['ten_buoc']:
		raise HTTPException(status_code=400, detail='Missing step name')

	if next_values['ngay_bat_dau']:
		try:
			date.fromisoformat(str(next_values['ngay_bat_dau']))
		except ValueError as exc:
			raise HTTPException(status_code=400, detail='Invalid start date') from exc
	if next_values['ngay_ket_thuc']:
		try:
			date.fromisoformat(str(next_values['ngay_ket_thuc']))
		except ValueError as exc:
			raise HTTPException(status_code=400, detail='Invalid end date') from exc
	if next_values['ngay_bat_dau'] and next_values['ngay_ket_thuc']:
		if date.fromisoformat(str(next_values['ngay_ket_thuc'])) < date.fromisoformat(str(next_values['ngay_bat_dau'])):
			raise HTTPException(status_code=400, detail='Deadline before start date')

	db.execute(
		text(
			'''
			UPDATE cong_viec_quy_trinh
			SET cong_viec_id = :cong_viec_id,
				ten_buoc = :ten_buoc,
				mo_ta = :mo_ta,
				trang_thai = :trang_thai,
				ngay_bat_dau = :ngay_bat_dau,
				ngay_ket_thuc = :ngay_ket_thuc,
				tai_lieu_link = :tai_lieu_link,
				tai_lieu_file = :tai_lieu_file
			WHERE id = :id
			'''
		),
		next_values,
	)

	if payload.nguoi_nhan_ids is not None:
		recipients = _unique_positive_ids(payload.nguoi_nhan_ids)
		db.execute(text('DELETE FROM quy_trinh_nguoi_nhan WHERE step_id = :step_id'), {'step_id': step_id})
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

	changes: list[str] = []
	labels = {
		'ten_buoc': 'tên bước',
		'mo_ta': 'mô tả',
		'trang_thai': 'trạng thái',
		'ngay_bat_dau': 'ngày bắt đầu',
		'ngay_ket_thuc': 'ngày kết thúc',
		'tai_lieu_link': 'link tài liệu',
		'tai_lieu_file': 'file đính kèm',
	}
	for key, label in labels.items():
		if _normalize_value(current[key]) != _normalize_value(next_values[key]):
			changes.append(label)
	if payload.nguoi_nhan_ids is not None:
		changes.append('người nhận bước')
	change_text = ', '.join(changes) if changes else 'không có thay đổi dữ liệu'
	_add_task_history(
		db,
		int(next_values['cong_viec_id']),
		payload.nguoi_thay_doi_id,
		f'Cập nhật bước quy trình/công việc con "{next_values["ten_buoc"]}": {change_text}',
	)
	db.commit()
	return {'status': 'ok', 'id': step_id}


@router.delete('/{step_id}/xoa')
def delete_step(step_id: int, nguoi_thay_doi_id: Optional[int] = None, db: Session = Depends(get_db)) -> None:
	current = db.execute(
		text('SELECT id, cong_viec_id, ten_buoc FROM cong_viec_quy_trinh WHERE id = :id'),
		{'id': step_id},
	).mappings().first()
	if not current:
		raise HTTPException(status_code=404, detail='Step not found')

	_add_task_history(
		db,
		int(current['cong_viec_id']),
		nguoi_thay_doi_id,
		f'Xóa bước quy trình/công việc con "{current["ten_buoc"] or step_id}"',
	)
	db.execute(text('DELETE FROM cong_viec_quy_trinh WHERE id = :id'), {'id': step_id})
	db.commit()
	return None
