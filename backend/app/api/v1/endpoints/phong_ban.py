from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.v1.endpoints.crud_factory import create_crud_router
from app.models.generated import PhongBan

router = APIRouter(prefix="/phong_ban", tags=["phong_ban"])


@router.get("/danh_sach")
def list_phong_ban(
	q: Optional[str] = None,
	page: int = 1,
	page_size: int = 20,
	db: Session = Depends(get_db),
) -> dict:
	conditions = []
	params: dict = {}
	resolved_limit = max(page_size, 1)
	resolved_skip = max(page - 1, 0) * resolved_limit

	if q:
		conditions.append("(pb.ten_phong LIKE :q OR nv.ho_ten LIKE :q)")
		params["q"] = f"%{q}%"

	where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ""

	query = text(
		f"""
		SELECT
			pb.id,
			pb.ten_phong,
			pb.truong_phong_id,
			nv.ho_ten AS truong_phong,
			(SELECT COUNT(*) FROM nhanvien nv2 WHERE nv2.phong_ban_id = pb.id) AS so_nhan_vien
		FROM phong_ban pb
		LEFT JOIN nhanvien nv ON nv.id = pb.truong_phong_id
		{where_sql}
		ORDER BY pb.id DESC
		LIMIT :limit OFFSET :skip
		"""
	)

	total_query = text(
		f"""
		SELECT COUNT(*)
		FROM phong_ban pb
		LEFT JOIN nhanvien nv ON nv.id = pb.truong_phong_id
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


@router.post("/tao_moi", status_code=201)
def create_phong_ban(payload: dict, db: Session = Depends(get_db)) -> dict:
	ten_phong = (payload.get("ten_phong") or "").strip()
	if not ten_phong:
		raise HTTPException(status_code=400, detail="Ten phong ban la bat buoc")

	duplicate = db.execute(
		text("SELECT id FROM phong_ban WHERE LOWER(ten_phong) = LOWER(:ten_phong) LIMIT 1"),
		{"ten_phong": ten_phong},
	).fetchone()
	if duplicate:
		raise HTTPException(status_code=409, detail="Ten phong ban da ton tai")

	item = PhongBan(
		ten_phong=ten_phong,
		truong_phong_id=payload.get("truong_phong_id"),
	)
	db.add(item)
	db.commit()
	db.refresh(item)
	return {"id": item.id, "ten_phong": item.ten_phong}


@router.put("/{phong_ban_id}/cap_nhat")
def update_phong_ban(phong_ban_id: int, payload: dict, db: Session = Depends(get_db)) -> dict:
	item = db.get(PhongBan, phong_ban_id)
	if not item:
		raise HTTPException(status_code=404, detail="Phong ban khong ton tai")

	ten_phong = (payload.get("ten_phong") or "").strip()
	if not ten_phong:
		raise HTTPException(status_code=400, detail="Ten phong ban la bat buoc")

	duplicate = db.execute(
		text(
			"SELECT id FROM phong_ban WHERE LOWER(ten_phong) = LOWER(:ten_phong) AND id <> :id LIMIT 1"
		),
		{"ten_phong": ten_phong, "id": phong_ban_id},
	).fetchone()
	if duplicate:
		raise HTTPException(status_code=409, detail="Ten phong ban da ton tai")

	item.ten_phong = ten_phong
	item.truong_phong_id = payload.get("truong_phong_id")
	db.commit()
	db.refresh(item)
	return {"id": item.id, "ten_phong": item.ten_phong}


def _count_employees(db: Session, phong_ban_id: int) -> int:
	result = db.execute(
		text("SELECT COUNT(*) FROM nhanvien WHERE phong_ban_id = :phong_ban_id"),
		{"phong_ban_id": phong_ban_id},
	).scalar()
	return int(result or 0)


def _transfer_employees(db: Session, phong_ban_id: int, transfer_id: int) -> None:
	db.execute(
		text(
			"UPDATE nhanvien SET phong_ban_id = :transfer_id WHERE phong_ban_id = :phong_ban_id"
		),
		{"transfer_id": transfer_id, "phong_ban_id": phong_ban_id},
	)


@router.delete("/{phong_ban_id}/xoa", status_code=204)
def delete_phong_ban(
	phong_ban_id: int,
	payload: Optional[dict] = None,
	db: Session = Depends(get_db),
) -> None:
	item = db.get(PhongBan, phong_ban_id)
	if not item:
		raise HTTPException(status_code=404, detail="Phong ban khong ton tai")

	transfer_id = (payload or {}).get("transfer_id")
	employee_count = _count_employees(db, phong_ban_id)
	if employee_count > 0 and not transfer_id:
		raise HTTPException(
			status_code=409,
			detail={"message": "Phong ban con nhan vien", "employee_count": employee_count},
		)
	if employee_count > 0 and transfer_id:
		_transfer_employees(db, phong_ban_id, int(transfer_id))

	db.delete(item)
	db.commit()
	return None


crud_router = create_crud_router(PhongBan, prefix="", tags=["phong_ban"])
router.include_router(crud_router)
