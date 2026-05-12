from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.v1.endpoints.crud_factory import create_crud_router
from app.models.generated import CongViec

router = APIRouter(prefix="/cong_viec", tags=["cong_viec"])


class CongViecCreate(BaseModel):
	ten_cong_viec: str
	mo_ta: str
	du_an_id: Optional[int] = None
	ngay_bat_dau: str
	han_hoan_thanh: str
	muc_do_uu_tien: Optional[str] = None
	trang_thai: Optional[str] = None
	tai_lieu_cv: Optional[str] = None
	nguoi_giao_id: int
	nguoi_nhan_ids: list[int]
	nguoi_theo_doi_ids: Optional[list[int]] = None


class CongViecUpdate(BaseModel):
	ten_cong_viec: Optional[str] = None
	mo_ta: Optional[str] = None
	du_an_id: Optional[int] = None
	ngay_bat_dau: Optional[str] = None
	han_hoan_thanh: Optional[str] = None
	muc_do_uu_tien: Optional[str] = None
	trang_thai: Optional[str] = None
	tai_lieu_cv: Optional[str] = None
	nguoi_giao_id: Optional[int] = None
	nguoi_nhan_ids: Optional[list[int]] = None
	nguoi_theo_doi_ids: Optional[list[int]] = None


class CongViecProgressUpdate(BaseModel):
	trang_thai: str
	phan_tram: int


@router.get("/danh_sach")
def list_cong_viec(
	q: Optional[str] = None,
	trang_thai: Optional[str] = None,
	sort_by: str = "deadline",
	scope: str = "all",
	nhan_vien_id: Optional[int] = None,
	page: int = 1,
	page_size: int = 20,
	db: Session = Depends(get_db),
) -> dict:
	conditions = []
	params: dict = {}
	resolved_limit = max(page_size, 1)
	resolved_skip = max(page - 1, 0) * resolved_limit

	scope_value = (scope or "all").lower()
	if scope_value == "mine":
		if nhan_vien_id is None:
			raise HTTPException(status_code=400, detail="Missing nhan_vien_id")
		conditions.append("(cv.nguoi_giao_id = :nhan_vien_id OR cvnn.nhan_vien_id = :nhan_vien_id)")
		params["nhan_vien_id"] = nhan_vien_id

	if q:
		conditions.append("(cv.ten_cong_viec LIKE :q OR da.ten_du_an LIKE :q)")
		params["q"] = f"%{q}%"
	if trang_thai:
		conditions.append("cv.trang_thai = :trang_thai")
		params["trang_thai"] = trang_thai

	order_by = "cv.han_hoan_thanh IS NULL, cv.han_hoan_thanh ASC"
	if (sort_by or "").lower() == "status":
		order_by = "cv.trang_thai ASC, cv.han_hoan_thanh IS NULL, cv.han_hoan_thanh ASC"

	where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ""

	query = text(
		f"""
		SELECT
			cv.id,
			cv.ten_cong_viec,
			MAX(cv.mo_ta) AS mo_ta,
			MAX(cv.du_an_id) AS du_an_id,
			MAX(da.ten_du_an) AS ten_du_an,
			MAX(da.phong_ban) AS phong_ban,
			MAX(cv.ngay_bat_dau) AS ngay_bat_dau,
			MAX(cv.han_hoan_thanh) AS han_hoan_thanh,
			MAX(cv.muc_do_uu_tien) AS muc_do_uu_tien,
			MAX(cv.trang_thai) AS trang_thai,
			MAX(cv.trang_thai_duyet) AS trang_thai_duyet,
			MAX(cv.tai_lieu_cv) AS tai_lieu_cv,
			MAX(cv.nguoi_giao_id) AS nguoi_giao_id,
			MAX(nvg.ho_ten) AS nguoi_giao,
			GROUP_CONCAT(DISTINCT nvnn.ho_ten SEPARATOR ', ') AS nguoi_nhan,
			GROUP_CONCAT(DISTINCT cvnn.nhan_vien_id SEPARATOR ',') AS nguoi_nhan_ids
		FROM cong_viec cv
		LEFT JOIN du_an da ON da.id = cv.du_an_id
		LEFT JOIN nhanvien nvg ON nvg.id = cv.nguoi_giao_id
		LEFT JOIN cong_viec_nguoi_nhan cvnn ON cvnn.cong_viec_id = cv.id
		LEFT JOIN nhanvien nvnn ON nvnn.id = cvnn.nhan_vien_id
		{where_sql}
		GROUP BY cv.id, cv.ten_cong_viec
		ORDER BY {order_by}
		LIMIT :limit OFFSET :skip
		"""
	)

	total_query = text(
		f"""
		SELECT COUNT(DISTINCT cv.id)
		FROM cong_viec cv
		LEFT JOIN du_an da ON da.id = cv.du_an_id
		LEFT JOIN cong_viec_nguoi_nhan cvnn ON cvnn.cong_viec_id = cv.id
		{where_sql}
		"""
	)

	params_with_paging = {**params, "limit": resolved_limit, "skip": resolved_skip}
	rows = db.execute(query, params_with_paging).mappings().all()
	total = db.execute(total_query, params).scalar() or 0
	total_pages = (total + resolved_limit - 1) // resolved_limit if resolved_limit else 0

	return {
		"data": [dict(row) for row in rows],
		"total": total,
		"page": page,
		"page_size": resolved_limit,
		"total_pages": total_pages,
	}


@router.put("/{cong_viec_id}/cap_nhat_thong_tin")
def update_cong_viec(
	cong_viec_id: int,
	payload: CongViecUpdate,
	db: Session = Depends(get_db),
) -> dict:
	exists = db.execute(
		text("SELECT COUNT(*) FROM cong_viec WHERE id = :id"),
		{"id": cong_viec_id},
	).scalar()
	if not exists:
		raise HTTPException(status_code=404, detail="Not found")

	current_row = db.execute(
		text(
			"""
			SELECT du_an_id, ten_cong_viec, mo_ta, ngay_bat_dau, han_hoan_thanh,
				muc_do_uu_tien, trang_thai, tai_lieu_cv, nguoi_giao_id
			FROM cong_viec WHERE id = :id
			"""
		),
		{"id": cong_viec_id},
	).mappings().first()
	if not current_row:
		raise HTTPException(status_code=404, detail="Not found")

	update_values = {
		"du_an_id": payload.du_an_id if payload.du_an_id is not None else current_row["du_an_id"],
		"ten_cong_viec": (payload.ten_cong_viec or current_row["ten_cong_viec"]).strip(),
		"mo_ta": (payload.mo_ta or current_row["mo_ta"] or "").strip(),
		"ngay_bat_dau": payload.ngay_bat_dau if payload.ngay_bat_dau is not None else current_row["ngay_bat_dau"],
		"han_hoan_thanh": payload.han_hoan_thanh if payload.han_hoan_thanh is not None else current_row["han_hoan_thanh"],
		"muc_do_uu_tien": payload.muc_do_uu_tien if payload.muc_do_uu_tien is not None else current_row["muc_do_uu_tien"],
		"trang_thai": payload.trang_thai if payload.trang_thai is not None else current_row["trang_thai"],
		"tai_lieu_cv": payload.tai_lieu_cv if payload.tai_lieu_cv is not None else current_row["tai_lieu_cv"],
		"nguoi_giao_id": payload.nguoi_giao_id if payload.nguoi_giao_id is not None else current_row["nguoi_giao_id"],
		"id": cong_viec_id,
	}

	if update_values["ngay_bat_dau"] is not None:
		try:
			date.fromisoformat(str(update_values["ngay_bat_dau"]))
		except ValueError as exc:
			raise HTTPException(status_code=400, detail="Invalid date format") from exc
	if update_values["han_hoan_thanh"] is not None:
		try:
			date.fromisoformat(str(update_values["han_hoan_thanh"]))
		except ValueError as exc:
			raise HTTPException(status_code=400, detail="Invalid date format") from exc
	if update_values["ngay_bat_dau"] and update_values["han_hoan_thanh"]:
		if date.fromisoformat(str(update_values["han_hoan_thanh"])) < date.fromisoformat(str(update_values["ngay_bat_dau"])):
			raise HTTPException(status_code=400, detail="Deadline before start date")

	db.execute(
		text(
			"""
			UPDATE cong_viec
			SET du_an_id = :du_an_id,
				ten_cong_viec = :ten_cong_viec,
				mo_ta = :mo_ta,
				ngay_bat_dau = :ngay_bat_dau,
				han_hoan_thanh = :han_hoan_thanh,
				muc_do_uu_tien = :muc_do_uu_tien,
				trang_thai = :trang_thai,
				tai_lieu_cv = :tai_lieu_cv,
				nguoi_giao_id = :nguoi_giao_id
			WHERE id = :id
			"""
		),
		update_values,
	)

	member_ids = payload.nguoi_nhan_ids if payload.nguoi_nhan_ids is not None else []
	member_ids = list({int(member_id) for member_id in member_ids})
	db.execute(
		text("DELETE FROM cong_viec_nguoi_nhan WHERE cong_viec_id = :id"),
		{"id": cong_viec_id},
	)
	if member_ids:
		db.execute(
			text(
				"""
				INSERT INTO cong_viec_nguoi_nhan (cong_viec_id, nhan_vien_id)
				VALUES (:cong_viec_id, :nhan_vien_id)
				"""
			),
			[
				{"cong_viec_id": cong_viec_id, "nhan_vien_id": member_id}
				for member_id in member_ids
			],
		)

	db.commit()
	return {"status": "ok", "id": cong_viec_id}


@router.post("/tao_moi")
def create_cong_viec(payload: CongViecCreate, db: Session = Depends(get_db)) -> dict:
	if not payload.ten_cong_viec.strip() or not payload.mo_ta.strip():
		raise HTTPException(status_code=400, detail="Missing required fields")
	if not payload.nguoi_nhan_ids:
		raise HTTPException(status_code=400, detail="Missing assignees")

	try:
		ngay_bat_dau = date.fromisoformat(payload.ngay_bat_dau)
		han_hoan_thanh = date.fromisoformat(payload.han_hoan_thanh)
	except ValueError as exc:
		raise HTTPException(status_code=400, detail="Invalid date format") from exc

	if han_hoan_thanh < ngay_bat_dau:
		raise HTTPException(status_code=400, detail="Deadline before start date")

	creator_exists = db.execute(
		text("SELECT COUNT(*) FROM nhanvien WHERE id = :id"),
		{"id": payload.nguoi_giao_id},
	).scalar()
	if not creator_exists:
		raise HTTPException(status_code=400, detail="Nguoi giao not found")

	assignees = list({int(member_id) for member_id in payload.nguoi_nhan_ids})
	followers = [int(member_id) for member_id in (payload.nguoi_theo_doi_ids or [])]
	all_members = list({*assignees, *followers})

	insert_query = text(
		"""
		INSERT INTO cong_viec (
			du_an_id, ten_cong_viec, mo_ta, han_hoan_thanh, muc_do_uu_tien,
			nguoi_giao_id, trang_thai, tai_lieu_cv, ngay_bat_dau
		) VALUES (
			:du_an_id, :ten_cong_viec, :mo_ta, :han_hoan_thanh, :muc_do_uu_tien,
			:nguoi_giao_id, :trang_thai, :tai_lieu_cv, :ngay_bat_dau
		)
		"""
	)

	params = payload.model_dump()
	params["ten_cong_viec"] = params["ten_cong_viec"].strip()
	params["mo_ta"] = params["mo_ta"].strip()
	params["trang_thai"] = params.get("trang_thai") or "Chưa bắt đầu"

	db.execute(insert_query, params)
	cong_viec_id = db.execute(text("SELECT LAST_INSERT_ID()"), {}).scalar()

	if all_members:
		db.execute(
			text(
				"""
				INSERT INTO cong_viec_nguoi_nhan (cong_viec_id, nhan_vien_id)
				VALUES (:cong_viec_id, :nhan_vien_id)
				"""
			),
			[
				{"cong_viec_id": cong_viec_id, "nhan_vien_id": member_id}
				for member_id in all_members
			],
		)

	db.commit()
	return {"id": cong_viec_id}


@router.put("/{cong_viec_id}/cap_nhat_tien_do")
def update_tien_do(
	cong_viec_id: int,
	payload: CongViecProgressUpdate,
	db: Session = Depends(get_db),
) -> dict:
	allowed_status = {
		"Chưa bắt đầu",
		"Đang thực hiện",
		"Đã hoàn thành",
		"Trễ hạn",
	}
	if payload.trang_thai not in allowed_status:
		raise HTTPException(status_code=400, detail="Invalid trang_thai")
	if payload.phan_tram < 0 or payload.phan_tram > 100:
		raise HTTPException(status_code=400, detail="Invalid phan_tram")

	exists = db.execute(
		text("SELECT COUNT(*) FROM cong_viec WHERE id = :id"),
		{"id": cong_viec_id},
	).scalar()
	if not exists:
		raise HTTPException(status_code=404, detail="Not found")

	db.execute(
		text("UPDATE cong_viec SET trang_thai = :trang_thai WHERE id = :id"),
		{"id": cong_viec_id, "trang_thai": payload.trang_thai},
	)
	db.execute(
		text(
			"""
			INSERT INTO cong_viec_tien_do (cong_viec_id, phan_tram)
			VALUES (:cong_viec_id, :phan_tram)
			"""
		),
		{"cong_viec_id": cong_viec_id, "phan_tram": payload.phan_tram},
	)
	db.commit()
	return {"status": "ok"}


crud_router = create_crud_router(CongViec, prefix="", tags=["cong_viec"])
router.include_router(crud_router)
