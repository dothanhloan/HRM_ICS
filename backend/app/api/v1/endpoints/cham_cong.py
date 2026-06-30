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
BAO_CAO_MAX_LEN = 255

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


class ChamCongBaoCaoPayload(BaseModel):
	actor_id: int
	cham_cong_id: int
	noi_dung: str


class ChamCongBaoCaoReviewPayload(BaseModel):
	actor_id: int
	ly_do: Optional[str] = None


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


def _normalize_bao_cao(data: dict) -> dict:
	"""Map short keys to canonical keys for internal usage."""
	if not isinstance(data, dict):
		return {}
	result = dict(data)
	if "n" in result and "note" not in result:
		result["note"] = result.get("n")
	if "ci" in result and "check_in_location" not in result:
		ci = result.get("ci") or {}
		result["check_in_location"] = {
			"lat": ci.get("lat", ci.get("la")),
			"lng": ci.get("lng", ci.get("ln")),
			"address": ci.get("address", ci.get("a")),
		}
	if "co" in result and "check_out_location" not in result:
		co = result.get("co") or {}
		result["check_out_location"] = {
			"lat": co.get("lat", co.get("la")),
			"lng": co.get("lng", co.get("ln")),
			"address": co.get("address", co.get("a")),
		}
	if "r" in result and "report" not in result and isinstance(result.get("r"), dict):
		report = dict(result["r"])
		result["report"] = {
			"content": report.get("c"),
			"status": report.get("s"),
			"submitted_at": report.get("sa"),
			"submitted_by": report.get("sb"),
			"reviewed_at": report.get("ra"),
			"reviewed_by": report.get("rb"),
			"review_note": report.get("rn"),
		}
	return result


def _compact_bao_cao(data: dict) -> dict:
	"""Convert canonical keys to short keys to fit varchar(255)."""
	result = {}
	note = data.get("note")
	if note:
		result["n"] = str(note)
	check_in_location = data.get("check_in_location")
	if isinstance(check_in_location, dict):
		lat = check_in_location.get("lat")
		lng = check_in_location.get("lng")
		try:
			lat = round(float(lat), 6) if lat is not None else None
		except (TypeError, ValueError):
			lat = None
		try:
			lng = round(float(lng), 6) if lng is not None else None
		except (TypeError, ValueError):
			lng = None
		result["ci"] = {
			"la": lat,
			"ln": lng,
			"a": check_in_location.get("address"),
		}
	check_out_location = data.get("check_out_location")
	if isinstance(check_out_location, dict):
		lat = check_out_location.get("lat")
		lng = check_out_location.get("lng")
		try:
			lat = round(float(lat), 6) if lat is not None else None
		except (TypeError, ValueError):
			lat = None
		try:
			lng = round(float(lng), 6) if lng is not None else None
		except (TypeError, ValueError):
			lng = None
		result["co"] = {
			"la": lat,
			"ln": lng,
			"a": check_out_location.get("address"),
		}
	report = data.get("report")
	if isinstance(report, dict):
		result["r"] = {
			"c": report.get("content"),
			"s": report.get("status"),
			"sa": report.get("submitted_at"),
			"sb": report.get("submitted_by"),
			"ra": report.get("reviewed_at"),
			"rb": report.get("reviewed_by"),
			"rn": report.get("review_note"),
		}
	return result


def _dump_bao_cao_limited(data: dict) -> str:
	compact = _compact_bao_cao(data)

	def _dumps(value: dict) -> str:
		return json.dumps(value, ensure_ascii=False, separators=(",", ":"))

	payload = _dumps(compact)
	if len(payload) <= BAO_CAO_MAX_LEN:
		return payload

	report = compact.get("r")
	if isinstance(report, dict) and report.get("c"):
		report["c"] = str(report.get("c"))[:120]
	if isinstance(report, dict) and report.get("rn"):
		report["rn"] = str(report.get("rn"))[:80]
	payload = _dumps(compact)
	if len(payload) <= BAO_CAO_MAX_LEN:
		return payload

	compact.pop("ci", None)
	compact.pop("co", None)
	payload = _dumps(compact)
	if len(payload) <= BAO_CAO_MAX_LEN:
		return payload

	if compact.get("n"):
		compact["n"] = str(compact["n"])[:50]
	if isinstance(report, dict) and report.get("c"):
		report["c"] = str(report.get("c"))[:60]
	payload = _dumps(compact)
	if len(payload) <= BAO_CAO_MAX_LEN:
		return payload

	raise HTTPException(
		status_code=400,
		detail="Noi dung bao cao qua dai, vui long rut gon noi dung.",
	)


def _is_admin(actor_id: int, db: Session) -> bool:
	if actor_id <= 0:
		return False
	row = db.execute(
		text("SELECT vai_tro FROM nhanvien WHERE id = :id"),
		{"id": actor_id},
	).mappings().first()
	if row and "admin" in (row.get("vai_tro") or "").lower():
		return True
	permission = db.execute(
		text(
			"""
			SELECT 1
			FROM nhanvien_quyen nq
			JOIN quyen q ON q.id = nq.quyen_id
			WHERE nq.nhanvien_id = :id
			  AND q.ma_quyen IN ('ADMIN', 'ROLE_ADMIN')
			LIMIT 1
			"""
		),
		{"id": actor_id},
	).first()
	return permission is not None


def _merge_bao_cao(
	existing: Optional[str],
	note: Optional[str],
	location_key: str,
	location: Optional[dict],
) -> str:
	data = _normalize_bao_cao(_parse_bao_cao(existing))
	if note and note.strip():
		data["note"] = note.strip()
	if location is not None:
		data[location_key] = location
	return _dump_bao_cao_limited(data)


def _resolve_status(check_in_time: Optional[time], check_out_time: Optional[time]) -> str:
	check_in_time = _normalize_time(check_in_time)
	check_out_time = _normalize_time(check_out_time)
	if not check_in_time:
		return "Bình thường"
	if check_out_time and check_out_time < WORK_END:
		return "Thiếu giờ"
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

	bao_cao = _normalize_bao_cao(_parse_bao_cao(row.get("bao_cao")))
	report = bao_cao.get("report") or {}
	return {
		**row,
		"bao_cao": bao_cao.get("note"),
		"check_in_location": bao_cao.get("check_in_location"),
		"check_out_location": bao_cao.get("check_out_location"),
		"bao_cao_noi_dung": report.get("content"),
		"bao_cao_trang_thai": report.get("status"),
		"bao_cao_gui_luc": report.get("submitted_at"),
		"bao_cao_nguoi_gui": report.get("submitted_by"),
		"bao_cao_duyet_luc": report.get("reviewed_at"),
		"bao_cao_nguoi_duyet": report.get("reviewed_by"),
		"bao_cao_ly_do": report.get("review_note"),
		"trang_thai_hien_tai": status,
		"so_gio_lam": _calculate_hours(check_in_time, check_out_time),
	}


@router.post("/bao_cao")
def gui_bao_cao(payload: ChamCongBaoCaoPayload, db: Session = Depends(get_db)) -> dict:
	noi_dung = (payload.noi_dung or "").strip()
	if payload.actor_id <= 0 or payload.cham_cong_id <= 0:
		raise HTTPException(status_code=400, detail="Invalid payload")
	if not noi_dung:
		raise HTTPException(status_code=400, detail="Noi dung bao cao la bat buoc")

	row = db.execute(
		text(
			"""
			SELECT id, nhan_vien_id, bao_cao
			FROM cham_cong
			WHERE id = :id
			LIMIT 1
			"""
		),
		{"id": payload.cham_cong_id},
	).mappings().first()
	if not row:
		raise HTTPException(status_code=404, detail="Khong tim thay ban ghi cham cong")

	is_admin = _is_admin(payload.actor_id, db)
	if not is_admin and int(row["nhan_vien_id"]) != payload.actor_id:
		raise HTTPException(status_code=403, detail="Ban khong co quyen gui bao cao")

	bao_cao_data = _normalize_bao_cao(_parse_bao_cao(row.get("bao_cao")))
	bao_cao_data["report"] = {
		"content": noi_dung,
		"status": "PENDING",
		"submitted_at": datetime.utcnow().isoformat(),
		"submitted_by": payload.actor_id,
		"reviewed_at": None,
		"reviewed_by": None,
		"review_note": None,
	}

	db.execute(
		text("UPDATE cham_cong SET bao_cao = :bao_cao WHERE id = :id"),
		{"bao_cao": _dump_bao_cao_limited(bao_cao_data), "id": payload.cham_cong_id},
	)
	db.commit()
	return {"status": "ok", "message": "Gui bao cao thanh cong"}


@router.post("/bao_cao/{cham_cong_id}/duyet")
def duyet_bao_cao(
	cham_cong_id: int,
	payload: ChamCongBaoCaoReviewPayload,
	db: Session = Depends(get_db),
) -> dict:
	if not _is_admin(payload.actor_id, db):
		raise HTTPException(status_code=403, detail="Ban khong co quyen duyet bao cao")

	row = db.execute(
		text("SELECT id, bao_cao FROM cham_cong WHERE id = :id LIMIT 1"),
		{"id": cham_cong_id},
	).mappings().first()
	if not row:
		raise HTTPException(status_code=404, detail="Khong tim thay ban ghi cham cong")

	bao_cao_data = _normalize_bao_cao(_parse_bao_cao(row.get("bao_cao")))
	report = bao_cao_data.get("report")
	if not report:
		raise HTTPException(status_code=400, detail="Ban ghi chua co bao cao")

	report["status"] = "APPROVED"
	report["reviewed_at"] = datetime.utcnow().isoformat()
	report["reviewed_by"] = payload.actor_id
	report["review_note"] = (payload.ly_do or "").strip() or None
	bao_cao_data["report"] = report

	db.execute(
		text("UPDATE cham_cong SET bao_cao = :bao_cao WHERE id = :id"),
		{"bao_cao": _dump_bao_cao_limited(bao_cao_data), "id": cham_cong_id},
	)
	db.commit()
	return {"status": "ok", "message": "Da duyet bao cao"}


@router.post("/bao_cao/{cham_cong_id}/tu_choi")
def tu_choi_bao_cao(
	cham_cong_id: int,
	payload: ChamCongBaoCaoReviewPayload,
	db: Session = Depends(get_db),
) -> dict:
	if not _is_admin(payload.actor_id, db):
		raise HTTPException(status_code=403, detail="Ban khong co quyen tu choi bao cao")

	row = db.execute(
		text("SELECT id, bao_cao FROM cham_cong WHERE id = :id LIMIT 1"),
		{"id": cham_cong_id},
	).mappings().first()
	if not row:
		raise HTTPException(status_code=404, detail="Khong tim thay ban ghi cham cong")

	bao_cao_data = _normalize_bao_cao(_parse_bao_cao(row.get("bao_cao")))
	report = bao_cao_data.get("report")
	if not report:
		raise HTTPException(status_code=400, detail="Ban ghi chua co bao cao")

	report["status"] = "REJECTED"
	report["reviewed_at"] = datetime.utcnow().isoformat()
	report["reviewed_by"] = payload.actor_id
	report["review_note"] = (payload.ly_do or "").strip() or None
	bao_cao_data["report"] = report

	db.execute(
		text("UPDATE cham_cong SET bao_cao = :bao_cao WHERE id = :id"),
		{"bao_cao": _dump_bao_cao_limited(bao_cao_data), "id": cham_cong_id},
	)
	db.commit()
	return {"status": "ok", "message": "Da tu choi bao cao"}


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
			  nhanvien.ho_ten,
			  nhanvien.ngay_vao_lam,
			  nhanvien.avatar_url,
			  phong_ban.ten_phong AS phong_ban
			FROM cham_cong
			LEFT JOIN nhanvien ON nhanvien.id = cham_cong.nhan_vien_id
			LEFT JOIN phong_ban ON phong_ban.id = nhanvien.phong_ban_id
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
		raise HTTPException(
			status_code=400,
			detail="Check-out không khả dụng, bạn chưa check-in",
		)
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
