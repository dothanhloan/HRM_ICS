from datetime import date, datetime
from decimal import Decimal
from typing import Optional

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session, aliased

from app.api.deps import get_db
from app.api.v1.endpoints.crud_factory import create_crud_router
from app.models.generated import DonNghiPhep, NgayPhepNam, Nhanvien, PhongBan

router = APIRouter(prefix="/don_nghi_phep", tags=["don_nghi_phep"])
crud_router = create_crud_router(DonNghiPhep, prefix="", tags=["don_nghi_phep"])


def _to_dict(obj: DonNghiPhep) -> dict:
	mapper = sa.inspect(obj).mapper
	return {attr.key: getattr(obj, attr.key) for attr in mapper.column_attrs}


def _parse_date(value: str, field: str) -> date:
	if not value or not value.strip():
		raise HTTPException(status_code=400, detail=f"Missing {field}")
	try:
		return date.fromisoformat(value)
	except ValueError as exc:
		raise HTTPException(status_code=400, detail=f"Invalid {field}") from exc


def _calculate_days(start: date, end: date) -> Decimal:
	diff = (end - start).days + 1
	return Decimal(str(max(diff, 0)))


def _is_admin(nhan_vien_id: int, db: Session) -> bool:
	if not nhan_vien_id:
		return False
	row = db.execute(
		text("SELECT vai_tro FROM nhanvien WHERE id = :id"),
		{"id": nhan_vien_id},
	).mappings().first()
	if row and (row.get("vai_tro") or "").lower().find("admin") >= 0:
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
		{"id": nhan_vien_id},
	).first()
	return permission is not None


class LeaveSubmitPayload(BaseModel):
	nhan_vien_id: int
	loai_phep: str
	ngay_bat_dau: str
	ngay_ket_thuc: str
	ly_do: str
	ghi_chu: Optional[str] = None
	nguoi_tao_id: Optional[int] = None


class LeaveDecisionPayload(BaseModel):
	nguoi_duyet_id: int
	action: str
	ly_do_tu_choi: Optional[str] = None


@router.post("/gui_don", status_code=201)
def submit_leave(payload: LeaveSubmitPayload, db: Session = Depends(get_db)) -> dict:
	if not payload.loai_phep.strip() or not payload.ly_do.strip():
		raise HTTPException(status_code=400, detail="Missing required fields")

	start_date = _parse_date(payload.ngay_bat_dau, "ngay_bat_dau")
	end_date = _parse_date(payload.ngay_ket_thuc, "ngay_ket_thuc")
	if end_date < start_date:
		raise HTTPException(status_code=400, detail="Invalid date range")

	so_ngay = _calculate_days(start_date, end_date)
	item = DonNghiPhep(
		nhan_vien_id=payload.nhan_vien_id,
		loai_phep=payload.loai_phep.strip(),
		ngay_bat_dau=start_date,
		ngay_ket_thuc=end_date,
		so_ngay=so_ngay,
		ly_do=payload.ly_do.strip(),
		trang_thai="cho_duyet",
		nguoi_tao_id=payload.nguoi_tao_id or payload.nhan_vien_id,
		ghi_chu=payload.ghi_chu.strip() if payload.ghi_chu else None,
	)
	db.add(item)
	db.commit()
	db.refresh(item)
	return {"data": _to_dict(item)}


@router.get("/danh_sach")
def list_leave_requests(
	nhan_vien_id: Optional[int] = None,
	trang_thai: Optional[str] = None,
	page: int = 1,
	page_size: int = 20,
	actor_id: Optional[int] = None,
	db: Session = Depends(get_db),
) -> dict:
	if actor_id is not None and not _is_admin(actor_id, db):
		if nhan_vien_id is None:
			nhan_vien_id = actor_id
		elif nhan_vien_id != actor_id:
			raise HTTPException(status_code=403, detail="Forbidden")

	resolved_limit = max(page_size, 1)
	resolved_skip = max(page - 1, 0) * resolved_limit

	nv = aliased(Nhanvien)
	nd = aliased(Nhanvien)
	pb = aliased(PhongBan)
	query = (
		db.query(
			DonNghiPhep,
			nv.ho_ten.label("nhan_vien_ten"),
			nv.email.label("nhan_vien_email"),
			nv.avatar_url.label("nhan_vien_avatar"),
			pb.ten_phong.label("phong_ban"),
			nd.ho_ten.label("nguoi_duyet_ten"),
		)
		.outerjoin(nv, nv.id == DonNghiPhep.nhan_vien_id)
		.outerjoin(pb, pb.id == nv.phong_ban_id)
		.outerjoin(nd, nd.id == DonNghiPhep.nguoi_duyet_id)
	)

	if trang_thai:
		query = query.filter(DonNghiPhep.trang_thai == trang_thai)
	if nhan_vien_id is not None:
		query = query.filter(DonNghiPhep.nhan_vien_id == nhan_vien_id)

	total = (
		query.with_entities(func.count(DonNghiPhep.id)).scalar()
		or 0
	)
	rows = (
		query.order_by(DonNghiPhep.thoi_gian_tao.desc())
		.offset(resolved_skip)
		.limit(resolved_limit)
		.all()
	)
	data = []
	for item, nhan_vien_ten, nhan_vien_email, nhan_vien_avatar, phong_ban, nguoi_duyet_ten in rows:
		row = _to_dict(item)
		row["nhan_vien_ten"] = nhan_vien_ten
		row["nhan_vien_email"] = nhan_vien_email
		row["nhan_vien_avatar"] = nhan_vien_avatar
		row["phong_ban"] = phong_ban
		row["nguoi_duyet_ten"] = nguoi_duyet_ten
		data.append(row)

	total_pages = (total + resolved_limit - 1) // resolved_limit if resolved_limit else 0

	return {
		"data": data,
		"total": total,
		"page": page,
		"page_size": resolved_limit,
		"total_pages": total_pages,
	}


@router.get("/thong_ke_ngay_phep")
def leave_day_stats(
	nam: int,
	actor_id: int,
	db: Session = Depends(get_db),
) -> dict:
	if not _is_admin(actor_id, db):
		raise HTTPException(status_code=403, detail="Forbidden")

	rows = db.execute(
		text(
			"""
			SELECT
			  nv.id,
			  nv.ho_ten,
			  nv.email,
			  nv.avatar_url,
			  nv.ngay_vao_lam,
			  pb.ten_phong AS phong_ban,
			  COALESCE(npn.tong_ngay_phep, 12.0) AS tong_ngay_phep,
			  COALESCE(npn.ngay_phep_da_dung, 0.0) AS ngay_phep_da_dung,
			  COALESCE(npn.ngay_phep_con_lai, 12.0) AS ngay_phep_con_lai,
			  COALESCE(npn.ngay_phep_nam_truoc, 0.0) AS ngay_phep_nam_truoc
			FROM nhanvien nv
			LEFT JOIN phong_ban pb ON pb.id = nv.phong_ban_id
			LEFT JOIN ngay_phep_nam npn ON npn.nhan_vien_id = nv.id AND npn.nam = :nam
			ORDER BY nv.ho_ten ASC
			"""
		),
		{"nam": nam},
	).mappings().all()

	data = []
	for row in rows:
		tong = float(row.get("tong_ngay_phep") or 0)
		da_dung = float(row.get("ngay_phep_da_dung") or 0)
		con_lai = float(row.get("ngay_phep_con_lai") or 0)
		nam_truoc = float(row.get("ngay_phep_nam_truoc") or 0)
		data.append(
			{
				"id": row.get("id"),
				"ho_ten": row.get("ho_ten"),
				"email": row.get("email"),
				"avatar_url": row.get("avatar_url"),
				"ngay_vao_lam": row.get("ngay_vao_lam"),
				"phong_ban": row.get("phong_ban"),
				"tong_ngay_phep": tong,
				"ngay_phep_da_dung": da_dung,
				"ngay_phep_con_lai": con_lai,
				"ngay_phep_nam_truoc": nam_truoc,
				"ngay_phep_trong_nam": max(tong - nam_truoc, 0),
			}
		)

	return {
		"data": data,
		"summary": {
			"tong_ngay_phep": sum(item["tong_ngay_phep"] for item in data),
			"ngay_phep_da_dung": sum(item["ngay_phep_da_dung"] for item in data),
			"ngay_phep_con_lai": sum(item["ngay_phep_con_lai"] for item in data),
			"ngay_phep_nam_truoc": sum(item["ngay_phep_nam_truoc"] for item in data),
			"nhan_vien": len(data),
		},
		"nam": nam,
	}


@router.post("/{don_id}/duyet")
def approve_leave(don_id: int, payload: LeaveDecisionPayload, db: Session = Depends(get_db)) -> dict:
	if not _is_admin(payload.nguoi_duyet_id, db):
		raise HTTPException(status_code=403, detail="Forbidden")

	item = db.get(DonNghiPhep, don_id)
	if not item:
		raise HTTPException(status_code=404, detail="Not found")
	if item.trang_thai != "cho_duyet":
		raise HTTPException(status_code=400, detail="Invalid status")

	action = payload.action.strip().lower()
	if action not in {"duyet", "tu_choi"}:
		raise HTTPException(status_code=400, detail="Invalid action")

	now = datetime.utcnow()
	if action == "tu_choi":
		if not payload.ly_do_tu_choi or not payload.ly_do_tu_choi.strip():
			raise HTTPException(status_code=400, detail="Missing rejection reason")
		item.trang_thai = "tu_choi"
		item.ly_do_tu_choi = payload.ly_do_tu_choi.strip()
		item.nguoi_duyet_id = payload.nguoi_duyet_id
		item.thoi_gian_duyet = now
		db.commit()
		db.refresh(item)
		return {"data": _to_dict(item)}

	year = item.ngay_bat_dau.year
	balance = (
		db.query(NgayPhepNam)
		.filter(NgayPhepNam.nhan_vien_id == item.nhan_vien_id)
		.filter(NgayPhepNam.nam == year)
		.first()
	)
	if not balance:
		balance = NgayPhepNam(
			nhan_vien_id=item.nhan_vien_id,
			nam=year,
			tong_ngay_phep=Decimal("12.0"),
			ngay_phep_da_dung=Decimal("0.0"),
			ngay_phep_con_lai=Decimal("12.0"),
			ngay_phep_nam_truoc=Decimal("0.0"),
			da_cong_phep_dau_nam=False,
		)
		db.add(balance)
		db.flush()

	so_ngay = Decimal(str(item.so_ngay))
	con_lai = Decimal(str(balance.ngay_phep_con_lai or 0))
	tru_phep = min(so_ngay, con_lai)
	if so_ngay > con_lai:
		khong_luong = so_ngay - con_lai
		note = f"Nghi khong luong {khong_luong} ngay"
		if item.ghi_chu:
			item.ghi_chu = f"{item.ghi_chu} | {note}"
		else:
			item.ghi_chu = note

	balance.ngay_phep_da_dung = Decimal(str(balance.ngay_phep_da_dung or 0)) + tru_phep
	balance.ngay_phep_con_lai = max(Decimal("0"), con_lai - tru_phep)

	item.trang_thai = "da_duyet"
	item.nguoi_duyet_id = payload.nguoi_duyet_id
	item.thoi_gian_duyet = now
	db.commit()
	db.refresh(item)

	return {"data": _to_dict(item)}


router.include_router(crud_router)
