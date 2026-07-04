from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.v1.endpoints.crud_factory import create_crud_router
from app.models.generated import DuAn

router = APIRouter(prefix="/du_an", tags=["du_an"])


class DuAnCreate(BaseModel):
	ten_du_an: str
	mo_ta: str
	ngay_bat_dau: str
	ngay_ket_thuc: str
	lead_id: int
	nhom_du_an: Optional[str] = None
	phong_ban: Optional[str] = None
	muc_do_uu_tien: Optional[str] = None
	trang_thai_duan: Optional[str] = None


class DuAnUpdate(BaseModel):
	ten_du_an: Optional[str] = None
	mo_ta: Optional[str] = None
	ngay_bat_dau: Optional[str] = None
	ngay_ket_thuc: Optional[str] = None
	lead_id: Optional[int] = None
	nhom_du_an: Optional[str] = None
	phong_ban: Optional[str] = None
	muc_do_uu_tien: Optional[str] = None
	trang_thai_duan: Optional[str] = None


@router.get("/danh_sach")
def list_du_an(
	q: Optional[str] = None,
	trang_thai: Optional[str] = None,
	muc_do_uu_tien: Optional[str] = None,
	lead_id: Optional[int] = None,
	actor: str = "admin",
	nhan_vien_id: Optional[int] = None,
	page: int = 1,
	page_size: int = 20,
	db: Session = Depends(get_db),
) -> dict:
	conditions = []
	params: dict = {}
	resolved_limit = max(page_size, 1)
	resolved_skip = max(page - 1, 0) * resolved_limit

	if q:
		conditions.append("(d.ten_du_an LIKE :q OR nv.ho_ten LIKE :q)")
		params["q"] = f"%{q}%"
	if trang_thai:
		normalized = str(trang_thai).strip().lower()
		status_map = {
			"chua bat dau": "Chưa bắt đầu",
			"chưa bắt đầu": "Chưa bắt đầu",
			"dang thuc hien": "Đang thực hiện",
			"đang thực hiện": "Đang thực hiện",
			"da hoan thanh": "Đã hoàn thành",
			"đã hoàn thành": "Đã hoàn thành",
			"tre han": "Trễ hạn",
			"trễ hạn": "Trễ hạn",
			"ngung hoat dong": "Ngừng hoạt động",
			"ngừng hoạt động": "Ngừng hoạt động",
		}
		conditions.append("d.trang_thai_duan = :trang_thai")
		params["trang_thai"] = status_map.get(normalized, trang_thai)
	if muc_do_uu_tien:
		conditions.append("d.muc_do_uu_tien = :muc_do_uu_tien")
		params["muc_do_uu_tien"] = muc_do_uu_tien
	if lead_id:
		conditions.append("d.lead_id = :lead_id")
		params["lead_id"] = lead_id

	actor_value = (actor or "").lower()
	if actor_value == "employee":
		if nhan_vien_id is None:
			raise HTTPException(status_code=400, detail="Missing nhan_vien_id")
		conditions.append(
			"""
			(
				d.lead_id = :nhan_vien_id
				OR EXISTS (
					SELECT 1
					FROM cong_viec cv
					JOIN cong_viec_nguoi_nhan cvnn ON cvnn.cong_viec_id = cv.id
					WHERE cv.du_an_id = d.id
					  AND cvnn.nhan_vien_id = :nhan_vien_id
				)
			)
			"""
		)
		params["nhan_vien_id"] = nhan_vien_id

	where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ""

	query = text(
		f"""
		SELECT
			d.id,
			d.ten_du_an,
			d.mo_ta,
			d.nhom_du_an,
			d.phong_ban,
			d.muc_do_uu_tien,
			d.trang_thai_duan,
			d.ngay_bat_dau,
			d.ngay_ket_thuc,
			d.lead_id,
			nv.ho_ten AS lead_name,
			CASE WHEN d.lead_id IS NULL THEN 0 ELSE 1 END AS so_thanh_vien
		FROM du_an d
		LEFT JOIN nhanvien nv ON nv.id = d.lead_id
		{where_sql}
		ORDER BY d.id DESC
		LIMIT :limit OFFSET :skip
		"""
	)

	total_query = text(
		f"""
		SELECT COUNT(DISTINCT d.id)
		FROM du_an d
		LEFT JOIN nhanvien nv ON nv.id = d.lead_id
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


@router.get("/{du_an_id}/chi_tiet")
def get_du_an_detail(du_an_id: int, db: Session = Depends(get_db)) -> dict:
	row = db.execute(
		text(
			"""
			SELECT id, ten_du_an, mo_ta, lead_id, muc_do_uu_tien, ngay_bat_dau, ngay_ket_thuc,
				   nhom_du_an, phong_ban, trang_thai_duan
			FROM du_an
			WHERE id = :id
			"""
		),
		{"id": du_an_id},
	).mappings().first()
	if not row:
		raise HTTPException(status_code=404, detail="Not found")

	return dict(row)


@router.post("/tao_moi")
def create_du_an(payload: DuAnCreate, db: Session = Depends(get_db)) -> dict:
	if not payload.ten_du_an.strip() or not payload.mo_ta.strip():
		raise HTTPException(status_code=400, detail="Missing required fields")
	if not payload.ngay_bat_dau or not payload.ngay_ket_thuc:
		raise HTTPException(status_code=400, detail="Missing project dates")

	lead_exists = db.execute(
		text("SELECT COUNT(*) FROM nhanvien WHERE id = :id"),
		{"id": payload.lead_id},
	).scalar()
	if not lead_exists:
		raise HTTPException(status_code=400, detail="Leader not found")

	insert_query = text(
		"""
		INSERT INTO du_an (
		  ten_du_an, mo_ta, lead_id, muc_do_uu_tien, ngay_bat_dau, ngay_ket_thuc,
		  nhom_du_an, phong_ban, trang_thai_duan
		) VALUES (
		  :ten_du_an, :mo_ta, :lead_id, :muc_do_uu_tien, :ngay_bat_dau, :ngay_ket_thuc,
		  :nhom_du_an, :phong_ban, :trang_thai_duan
		)
		"""
	)

	params = payload.model_dump()
	params["ten_du_an"] = params["ten_du_an"].strip()
	params["mo_ta"] = params["mo_ta"].strip()

	db.execute(insert_query, params)
	project_id = db.execute(text("SELECT LAST_INSERT_ID()"), {}).scalar()
	db.commit()

	return {"id": project_id}


@router.put("/{du_an_id}/cap_nhat")
def update_du_an(du_an_id: int, payload: DuAnUpdate, db: Session = Depends(get_db)) -> dict:
	exists = db.execute(
		text("SELECT COUNT(*) FROM du_an WHERE id = :id"),
		{"id": du_an_id},
	).scalar()
	if not exists:
		raise HTTPException(status_code=404, detail="Not found")

	data = {k: v for k, v in payload.model_dump().items() if v is not None}

	if "ten_du_an" in data and not str(data["ten_du_an"]).strip():
		raise HTTPException(status_code=400, detail="Invalid ten_du_an")
	if "mo_ta" in data and not str(data["mo_ta"]).strip():
		raise HTTPException(status_code=400, detail="Invalid mo_ta")

	if data:
		set_clause = ", ".join([f"{key} = :{key}" for key in data.keys()])
		data["id"] = du_an_id
		db.execute(text(f"UPDATE du_an SET {set_clause} WHERE id = :id"), data)

	db.commit()
	return {"status": "ok"}


@router.delete("/{du_an_id}/xoa")
def delete_du_an(du_an_id: int, force: bool = False, db: Session = Depends(get_db)) -> dict:
	row = db.execute(
		text("SELECT id, trang_thai_duan FROM du_an WHERE id = :id"),
		{"id": du_an_id},
	).mappings().first()
	if not row:
		raise HTTPException(status_code=404, detail="Not found")

	if (row.get("trang_thai_duan") or "").lower() == "\u0111ang th\u1ef1c hi\u1ec7n" and not force:
		raise HTTPException(status_code=400, detail="Du an dang hoat dong, can xac nhan")

	db.execute(
		text("UPDATE du_an SET trang_thai_duan = '\u004e\u0067\u1eeb\u006e\u0067 \u0068\u006f\u1ea1\u0074 \u0111\u1ed9\u006e\u0067' WHERE id = :id"),
		{"id": du_an_id},
	)
	db.commit()
	return {"status": "ok"}

crud_router = create_crud_router(DuAn, prefix="", tags=["du_an"])
router.include_router(crud_router)
