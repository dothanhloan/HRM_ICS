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


@router.get('/duoc_giao/danh_sach')
def list_assigned_steps(nhan_vien_id: int, db: Session = Depends(get_db)) -> dict:
	rows = db.execute(
		text(
			'''
			SELECT
				cqt.id,
				cqt.cong_viec_id,
				cqt.ten_buoc,
				cqt.mo_ta,
				cqt.trang_thai,
				cqt.ngay_bat_dau,
				cqt.ngay_ket_thuc,
				cqt.tai_lieu_link,
				cqt.tai_lieu_file,
				cv.ten_cong_viec,
				cv.mo_ta AS cong_viec_mo_ta,
				cv.du_an_id,
				da.ten_du_an,
				cv.ngay_bat_dau AS cong_viec_ngay_bat_dau,
				cv.han_hoan_thanh AS cong_viec_han_hoan_thanh,
				cv.muc_do_uu_tien AS cong_viec_muc_do_uu_tien,
				cv.trang_thai AS cong_viec_trang_thai,
				cv.trang_thai_duyet AS cong_viec_trang_thai_duyet,
				cv.tai_lieu_cv AS cong_viec_tai_lieu_cv,
				cv.nguoi_giao_id AS cong_viec_nguoi_giao_id,
				GROUP_CONCAT(DISTINCT nv.ho_ten SEPARATOR ', ') AS nguoi_nhan,
				(
					SELECT GROUP_CONCAT(DISTINCT cvnn.nhan_vien_id SEPARATOR ',')
					FROM cong_viec_nguoi_nhan cvnn
					WHERE cvnn.cong_viec_id = cv.id
				) AS cong_viec_nguoi_nhan_ids,
				(
					SELECT GROUP_CONCAT(DISTINCT nvcn.ho_ten SEPARATOR ', ')
					FROM cong_viec_nguoi_nhan cvnn
					JOIN nhanvien nvcn ON nvcn.id = cvnn.nhan_vien_id
					WHERE cvnn.cong_viec_id = cv.id
				) AS cong_viec_nguoi_nhan,
				GROUP_CONCAT(DISTINCT nv.ho_ten SEPARATOR ', ') AS buoc_nguoi_nhan,
				GROUP_CONCAT(DISTINCT qtnn.nhan_id SEPARATOR ',') AS nguoi_nhan_ids
			FROM cong_viec_quy_trinh cqt
			JOIN quy_trinh_nguoi_nhan mine
			  ON mine.step_id = cqt.id
			 AND mine.nhan_id = :nhan_vien_id
			JOIN cong_viec cv ON cv.id = cqt.cong_viec_id
			LEFT JOIN du_an da ON da.id = cv.du_an_id
			LEFT JOIN quy_trinh_nguoi_nhan qtnn ON qtnn.step_id = cqt.id
			LEFT JOIN nhanvien nv ON nv.id = qtnn.nhan_id
			GROUP BY cqt.id, cqt.cong_viec_id, cqt.ten_buoc, cqt.mo_ta, cqt.trang_thai,
				cqt.ngay_bat_dau, cqt.ngay_ket_thuc, cqt.tai_lieu_link, cqt.tai_lieu_file,
				cv.ten_cong_viec, cv.mo_ta, cv.du_an_id, da.ten_du_an, cv.ngay_bat_dau,
				cv.han_hoan_thanh, cv.muc_do_uu_tien, cv.trang_thai, cv.trang_thai_duyet,
				cv.tai_lieu_cv, cv.nguoi_giao_id
			ORDER BY cqt.ngay_ket_thuc IS NULL, cqt.ngay_ket_thuc ASC, cqt.id DESC
			'''
		),
		{'nhan_vien_id': nhan_vien_id},
	).mappings().all()
	return {'data': [dict(row) for row in rows], 'total': len(rows)}


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

def _is_admin(nhan_vien_id: Optional[int], db: Session) -> bool:
	if nhan_vien_id is None:
		return False
	row = db.execute(
		text('SELECT vai_tro FROM nhanvien WHERE id = :id'),
		{'id': nhan_vien_id},
	).mappings().first()
	return bool(row and 'admin' in (row.get('vai_tro') or '').lower())

def _get_step_access(step_id: int, actor_id: Optional[int], db: Session):
	if actor_id is None:
		return None
	return db.execute(
		text(
			'''
			SELECT
				cqt.id,
				cqt.cong_viec_id,
				da.lead_id,
				EXISTS (
					SELECT 1
					FROM cong_viec_nguoi_nhan cvnn
					WHERE cvnn.cong_viec_id = cqt.cong_viec_id
					  AND cvnn.nhan_vien_id = :actor_id
				) AS is_task_assignee,
				EXISTS (
					SELECT 1
					FROM quy_trinh_nguoi_nhan qtnn
					WHERE qtnn.step_id = cqt.id
					  AND qtnn.nhan_id = :actor_id
				) AS is_step_assignee
			FROM cong_viec_quy_trinh cqt
			JOIN cong_viec cv ON cv.id = cqt.cong_viec_id
			JOIN du_an da ON da.id = cv.du_an_id
			WHERE cqt.id = :step_id
			'''
		),
		{'step_id': step_id, 'actor_id': actor_id},
	).mappings().first()

def _assert_task_manager(cong_viec_id: int, actor_id: Optional[int], db: Session) -> None:
	row = db.execute(
		text(
			'''
			SELECT
				da.lead_id,
				EXISTS (
					SELECT 1
					FROM cong_viec_nguoi_nhan cvnn
					WHERE cvnn.cong_viec_id = cv.id
					  AND cvnn.nhan_vien_id = :actor_id
				) AS is_task_assignee
			FROM cong_viec cv
			JOIN du_an da ON da.id = cv.du_an_id
			WHERE cv.id = :cong_viec_id
			'''
		),
		{'cong_viec_id': cong_viec_id, 'actor_id': actor_id},
	).mappings().first()
	if not row:
		raise HTTPException(status_code=404, detail='Task not found')
	if _is_admin(actor_id, db) or int(row['lead_id'] or 0) == int(actor_id or 0) or row['is_task_assignee']:
		return
	raise HTTPException(status_code=403, detail='Chi leader du an hoac nguoi duoc giao cong viec moi duoc quan ly buoc cong viec')

def _assert_step_assignee_or_leader(step_id: int, actor_id: Optional[int], db: Session) -> None:
	access = _get_step_access(step_id, actor_id, db)
	if not access:
		raise HTTPException(status_code=404, detail='Step not found')
	if _is_admin(actor_id, db) or int(access['lead_id'] or 0) == int(actor_id or 0):
		return
	if access['is_step_assignee'] or access['is_task_assignee']:
		return
	raise HTTPException(status_code=403, detail='Chi nguoi duoc giao moi duoc cap nhat buoc cong viec')


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
	_assert_task_manager(payload.cong_viec_id, payload.nguoi_thay_doi_id, db)

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
		'trang_thai': payload.trang_thai or 'ChÆ°a báº¯t Ä‘áº§u',
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
	if payload.nguoi_nhan_ids is not None or payload.cong_viec_id is not None:
		_assert_task_manager(int(current['cong_viec_id']), payload.nguoi_thay_doi_id, db)
	else:
		_assert_step_assignee_or_leader(step_id, payload.nguoi_thay_doi_id, db)

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

	progress = db.execute(
		text(
			'''
			SELECT
				COUNT(*) AS total_steps,
				SUM(
					CASE
						WHEN LOWER(COALESCE(trang_thai, '')) LIKE '%hoÃ n thÃ nh%'
						  OR LOWER(COALESCE(trang_thai, '')) LIKE '%hoan thanh%'
						  OR LOWER(COALESCE(trang_thai, '')) IN ('completed', 'done')
						THEN 1
						ELSE 0
					END
				) AS completed_steps,
				SUM(
					CASE
						WHEN LOWER(COALESCE(trang_thai, '')) LIKE '%Ä‘ang%'
						  OR LOWER(COALESCE(trang_thai, '')) LIKE '%dang%'
						  OR LOWER(COALESCE(trang_thai, '')) IN ('in_progress', 'doing')
						THEN 1
						ELSE 0
					END
				) AS in_progress_steps
			FROM cong_viec_quy_trinh
			WHERE cong_viec_id = :cong_viec_id
			'''
		),
		{'cong_viec_id': next_values['cong_viec_id']},
	).mappings().first()
	if progress and int(progress['total_steps'] or 0) > 0:
		total_steps = int(progress['total_steps'] or 0)
		completed_steps = int(progress['completed_steps'] or 0)
		in_progress_steps = int(progress['in_progress_steps'] or 0)
		if completed_steps == total_steps:
			next_task_status = '\u0110ang th\u1ef1c hi\u1ec7n'
			next_approval_status = 'Ch\u1edd duy\u1ec7t'
		elif completed_steps > 0 or in_progress_steps > 0:
			next_task_status = '\u0110ang th\u1ef1c hi\u1ec7n'
			next_approval_status = 'Ch\u01b0a duy\u1ec7t'
		else:
			next_task_status = 'Ch\u01b0a b\u1eaft \u0111\u1ea7u'
			next_approval_status = 'Ch\u01b0a duy\u1ec7t'
		db.execute(
			text(
				'''
				UPDATE cong_viec
				SET trang_thai = :trang_thai,
					trang_thai_duyet = :trang_thai_duyet,
					ngay_hoan_thanh = NULL
				WHERE id = :id
				  AND LOWER(COALESCE(trang_thai_duyet, '')) NOT IN ('\u0111\u00e3 duy\u1ec7t', 'da duyet', 'approved')
				'''
			),
			{
				'id': next_values['cong_viec_id'],
				'trang_thai': next_task_status,
				'trang_thai_duyet': next_approval_status,
			},
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
	_assert_task_manager(int(current['cong_viec_id']), nguoi_thay_doi_id, db)

	_add_task_history(
		db,
		int(current['cong_viec_id']),
		nguoi_thay_doi_id,
		f'Xóa bước quy trình/công việc con "{current["ten_buoc"] or step_id}"',
	)
	db.execute(text('DELETE FROM cong_viec_quy_trinh WHERE id = :id'), {'id': step_id})
	db.commit()
	return None

