import json
from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.v1.endpoints.crud_factory import create_crud_router
from app.models.generated import ChamCong

router = APIRouter(prefix="/cham_cong", tags=["cham_cong"])

WORK_START = time(8, 0, 0)
WORK_LATE = time(8, 6, 0)
WORK_END = time(17, 0, 0)


class ChamCongCheckPayload(BaseModel):
	nhan_vien_id: int
	vi_tri: Optional[str] = None
	vi_do: Optional[float] = None
	kinh_do: Optional[float] = None
	bao_cao: Optional[str] = None
	loai_cham_cong: Optional[str] = None


def _ensure_location(payload: ChamCongCheckPayload) -> dict:
	if (payload.loai_cham_cong or "").lower() == "wfh":
		return {}
	has_coords = payload.vi_do is not None and payload.kinh_do is not None
	has_address = bool(payload.vi_tri and payload.vi_tri.strip())
	if not has_coords and not has_address:
		raise HTTPException(status_code=400, detail="Missing location")
	return {
		"lat": payload.vi_do,
		"lng": payload.kinh_do,
		"address": payload.vi_tri.strip() if payload.vi_tri else None,
	}


def _extract_location(payload: ChamCongCheckPayload) -> Optional[dict]:
	has_coords = payload.vi_do is not None and payload.kinh_do is not None
	has_address = bool(payload.vi_tri and payload.vi_tri.strip())
	if not has_coords and not has_address:
		return None
	return {
		"lat": payload.vi_do,
		"lng": payload.kinh_do,
		"address": payload.vi_tri.strip() if payload.vi_tri else None,
	}


def _parse_bao_cao(value: Optional[str]) -> dict:
	if not value:
		return {}
	try:
		parsed = json.loads(value)
		if isinstance(parsed, dict):
			return parsed
	except json.JSONDecodeError:
		pass
	return {"note": value}


def _merge_bao_cao(
	existing: Optional[str],
	note: Optional[str],
	location_key: str,
	location: Optional[dict],
) -> str:
	data = _parse_bao_cao(existing)
	if note and note.strip():
		data["note"] = note.strip()
	if location is not None:
		data[location_key] = location
	return json.dumps(data, ensure_ascii=False)


def _resolve_status(check_in_time: Optional[time], check_out_time: Optional[time]) -> str:
	check_in_time = _normalize_time(check_in_time)
	if not check_in_time:
		return "Bình thường"
	return "Đi trễ" if check_in_time > WORK_LATE else "Đúng giờ"


def _calculate_hours(check_in_time: Optional[time], check_out_time: Optional[time]) -> Optional[float]:
	check_in_time = _normalize_time(check_in_time)
	check_out_time = _normalize_time(check_out_time)
	if not check_in_time:
		return None
	if not check_out_time:
		return 0.0
	start_dt = datetime.combine(date.today(), check_in_time)
	end_dt = datetime.combine(date.today(), check_out_time)
	seconds = (end_dt - start_dt).total_seconds()
	if seconds <= 0:
		return 0.0
	return round(seconds / 3600, 2)


def _normalize_time(value: Optional[object]) -> Optional[time]:
	if value is None:
		return None
	if isinstance(value, time):
		return value
	if isinstance(value, timedelta):
		total_seconds = int(value.total_seconds())
		hours = (total_seconds // 3600) % 24
		minutes = (total_seconds % 3600) // 60
		seconds = total_seconds % 60
		return time(hour=hours, minute=minutes, second=seconds)
	return None


def _decorate_row(row: dict) -> dict:
	today = date.today()
	check_in_time = row.get("check_in")
	check_out_time = row.get("check_out")
	base_status = row.get("trang_thai") or "Bình thường"
	status = base_status
	if row.get("ngay") and row.get("ngay") < today:
		if not check_in_time or not check_out_time:
			status = "Không có mặt"
	elif row.get("ngay") == today:
		if not check_in_time and check_out_time:
			status = "Không có mặt"

	bao_cao = _parse_bao_cao(row.get("bao_cao"))
	return {
		**row,
		"bao_cao": bao_cao.get("note"),
		"check_in_location": bao_cao.get("check_in_location"),
		"check_out_location": bao_cao.get("check_out_location"),
		"trang_thai_hien_tai": status,
		"so_gio_lam": _calculate_hours(check_in_time, check_out_time),
	}


@router.get("/hom_nay")
def get_hom_nay(nhan_vien_id: int, db: Session = Depends(get_db)) -> dict:
	today = date.today()
	row = db.execute(
		text(
			"""
			SELECT id, nhan_vien_id, ngay, bao_cao, check_in, check_out, loai_cham_cong, trang_thai
			FROM cham_cong
			WHERE nhan_vien_id = :nhan_vien_id AND ngay = :ngay
			"""
		),
		{"nhan_vien_id": nhan_vien_id, "ngay": today},
	).mappings().first()

	return {"data": _decorate_row(dict(row)) if row else None}


@router.get("/lich_su")
def list_lich_su(
	nhan_vien_id: Optional[int] = None,
	tu_ngay: Optional[str] = None,
	den_ngay: Optional[str] = None,
	page: int = 1,
	page_size: int = 10,
	db: Session = Depends(get_db),
) -> dict:
	conditions = []
	params: dict = {}
	if nhan_vien_id is not None:
		conditions.append("cham_cong.nhan_vien_id = :nhan_vien_id")
		params["nhan_vien_id"] = nhan_vien_id
	if tu_ngay:
		conditions.append("cham_cong.ngay >= :tu_ngay")
		params["tu_ngay"] = tu_ngay
	if den_ngay:
		conditions.append("cham_cong.ngay <= :den_ngay")
		params["den_ngay"] = den_ngay
	where_sql = " AND ".join(conditions) if conditions else "1=1"
	limit = max(page_size, 1)
	offset = max(page - 1, 0) * limit

	rows = db.execute(
		text(
			f"""
			SELECT
			  cham_cong.id,
			  cham_cong.nhan_vien_id,
			  cham_cong.ngay,
			  cham_cong.bao_cao,
			  cham_cong.check_in,
			  cham_cong.check_out,
			  cham_cong.loai_cham_cong,
			  cham_cong.trang_thai,
			  nhanvien.ho_ten
			FROM cham_cong
			LEFT JOIN nhanvien ON nhanvien.id = cham_cong.nhan_vien_id
			WHERE {where_sql}
			ORDER BY cham_cong.ngay DESC, cham_cong.id DESC
			LIMIT :limit OFFSET :offset
			"""
		),
		{**params, "limit": limit, "offset": offset},
	).mappings().all()

	total = db.execute(
		text(
			f"""
			SELECT COUNT(*) FROM cham_cong
			WHERE {where_sql}
			"""
		),
		params,
	).scalar() or 0

	return {
		"data": [_decorate_row(dict(row)) for row in rows],
		"total": total,
		"page": page,
		"page_size": limit,
	}


@router.post("/check_in")
def check_in(payload: ChamCongCheckPayload, db: Session = Depends(get_db)) -> dict:
	if payload.nhan_vien_id <= 0:
		raise HTTPException(status_code=400, detail="Invalid nhan_vien_id")

	employee_exists = db.execute(
		text("SELECT COUNT(*) FROM nhanvien WHERE id = :id"),
		{"id": payload.nhan_vien_id},
	).scalar()
	if not employee_exists:
		raise HTTPException(status_code=404, detail="Nhan vien not found")

	today = date.today()
	now_time = datetime.now().time().replace(microsecond=0)
	location = _ensure_location(payload)

	row = db.execute(
		text(
			"""
			SELECT id, check_in, check_out, bao_cao, trang_thai
			FROM cham_cong
			WHERE nhan_vien_id = :nhan_vien_id AND ngay = :ngay
			"""
		),
		{"nhan_vien_id": payload.nhan_vien_id, "ngay": today},
	).mappings().first()

	status = _resolve_status(now_time, row["check_out"] if row else None)
	bao_cao = _merge_bao_cao(
		row["bao_cao"] if row else None,
		payload.bao_cao,
		"check_in_location",
		location,
	)

	if row:
		if row["check_in"]:
			raise HTTPException(status_code=400, detail="Da check-in")
		db.execute(
			text(
				"""
				UPDATE cham_cong
				SET check_in = :check_in, trang_thai = :trang_thai, bao_cao = :bao_cao
				WHERE id = :id
				"""
			),
			{
				"check_in": now_time,
				"trang_thai": status,
				"bao_cao": bao_cao,
				"id": row["id"],
			},
		)
	else:
		db.execute(
			text(
				"""
				INSERT INTO cham_cong (
				  nhan_vien_id, ngay, check_in, loai_cham_cong, trang_thai, bao_cao
				) VALUES (
				  :nhan_vien_id, :ngay, :check_in, :loai_cham_cong, :trang_thai, :bao_cao
				)
				"""
			),
			{
				"nhan_vien_id": payload.nhan_vien_id,
				"ngay": today,
				"check_in": now_time,
				"loai_cham_cong": payload.loai_cham_cong or "office",
				"trang_thai": status,
				"bao_cao": bao_cao,
			},
		)
	db.commit()

	return {"status": "ok", "trang_thai": status, "check_in": now_time}


@router.post("/check_out")
def check_out(payload: ChamCongCheckPayload, db: Session = Depends(get_db)) -> dict:
	if payload.nhan_vien_id <= 0:
		raise HTTPException(status_code=400, detail="Invalid nhan_vien_id")

	today = date.today()
	now_time = datetime.now().time().replace(microsecond=0)
	location = _extract_location(payload)

	row = db.execute(
		text(
			"""
			SELECT id, check_in, check_out, bao_cao
			FROM cham_cong
			WHERE nhan_vien_id = :nhan_vien_id AND ngay = :ngay
			"""
		),
		{"nhan_vien_id": payload.nhan_vien_id, "ngay": today},
	).mappings().first()

	if not row or not row["check_in"]:
		raise HTTPException(status_code=400, detail="Chua check-in")
	if row["check_out"]:
		raise HTTPException(status_code=400, detail="Da check-out")

	status = _resolve_status(row["check_in"], now_time)
	bao_cao = _merge_bao_cao(
		row["bao_cao"],
		payload.bao_cao,
		"check_out_location",
		location,
	)

	db.execute(
		text(
			"""
			UPDATE cham_cong
			SET check_out = :check_out, trang_thai = :trang_thai, bao_cao = :bao_cao
			WHERE id = :id
			"""
		),
		{
			"check_out": now_time,
			"trang_thai": status,
			"bao_cao": bao_cao,
			"id": row["id"],
		},
	)
	db.commit()

	return {
		"status": "ok",
		"trang_thai": status,
		"check_out": now_time,
		"so_gio_lam": _calculate_hours(row["check_in"], now_time),
	}


crud_router = create_crud_router(ChamCong, prefix="", tags=["cham_cong"])
router.include_router(crud_router)
