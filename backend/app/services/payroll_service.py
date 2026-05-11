from __future__ import annotations

from datetime import date
from decimal import Decimal
from math import floor
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.generated import Luong
from app.services.hrm_access import (
    get_standard_work_days,
    is_admin,
    is_manager,
    load_actor_context,
    resolve_target_employee_id,
)
from app.services.kpi_service import kpi_score_to_coefficient, calculate_kpi


def _month_range(nam: int, thang: int) -> tuple[date, date]:
    if thang == 12:
        return date(nam, thang, 1), date(nam + 1, 1, 1)
    return date(nam, thang, 1), date(nam, thang + 1, 1)


def _payment_status_to_db(status: str) -> str:
    normalized = (status or "").strip().lower()
    if normalized == "da thanh toan" or normalized == "đã thanh toán":
        return "Đã trả"
    return "Chưa trả"


def _estimate_basic_salary(vai_tro: Optional[str], chuc_vu: Optional[str]) -> Decimal:
    role = (vai_tro or "").strip().lower()
    position = (chuc_vu or "").strip().lower()
    if "admin" in role:
        return Decimal("30000000")
    if "giám đốc" in position or "giam doc" in position:
        return Decimal("25000000")
    if "trưởng phòng" in position or "truong phong" in position:
        return Decimal("18000000")
    if "nhân viên" in position or "nhan vien" in position:
        return Decimal("12000000")
    return Decimal("8000000")


def calculate_payroll(
    db: Session,
    actor_id: int,
    actor_role: str,
    thang: int,
    nam: int,
    target_employee_id: Optional[int],
    phu_cap: Decimal,
    thuong: Decimal,
    phat: Decimal,
    so_ngay_cong_chuan: Optional[Decimal] = None,
    trang_thai_thanh_toan: str = "Chờ duyệt",
    luu_ket_qua: bool = True,
) -> dict:
    employee_id = resolve_target_employee_id(db, actor_id, target_employee_id, actor_role)
    employee = db.execute(
        text(
            """
            SELECT id, ho_ten, luong_co_ban, vai_tro, chuc_vu, phong_ban_id
            FROM nhanvien
            WHERE id = :id
            LIMIT 1
            """
        ),
        {"id": employee_id},
    ).mappings().first()
    if not employee:
        raise ValueError("Nhan vien khong ton tai")

    basic_salary = Decimal(str(employee.get("luong_co_ban") or 0))
    if basic_salary <= 0:
        basic_salary = _estimate_basic_salary(employee.get("vai_tro"), employee.get("chuc_vu"))

    standard_work_days = so_ngay_cong_chuan or get_standard_work_days(db)
    if standard_work_days <= 0:
        standard_work_days = Decimal("26")

    start_date, end_date = _month_range(nam, thang)

    attendance_rows = db.execute(
        text(
            """
            SELECT ngay, check_in, check_out, trang_thai
            FROM cham_cong
            WHERE nhan_vien_id = :nhan_vien_id
              AND ngay >= :start_date
              AND ngay < :end_date
            """
        ),
        {"nhan_vien_id": employee_id, "start_date": start_date, "end_date": end_date},
    ).mappings().all()

    valid_attendance_days = 0
    late_unapproved = 0
    missing_check_actions = 0
    for row in attendance_rows:
        check_in = row.get("check_in")
        check_out = row.get("check_out")
        if check_in and check_out:
            valid_attendance_days += 1
        if not check_in or not check_out:
            missing_check_actions += 1
        if check_in and getattr(check_in, "hour", 0) * 60 + getattr(check_in, "minute", 0) > 8 * 60 + 6:
            status = (row.get("trang_thai") or "").strip().lower()
            if "duyet giai trinh" not in status and "được duyệt" not in status:
                late_unapproved += 1

    late_deduct_days = floor(late_unapproved / 3)

    unpaid_leave_days = db.execute(
        text(
            """
            SELECT COALESCE(SUM(so_ngay), 0)
            FROM don_nghi_phep
            WHERE nhan_vien_id = :nhan_vien_id
              AND trang_thai = 'da_duyet'
              AND ngay_bat_dau >= :start_date
              AND ngay_bat_dau < :end_date
              AND LOWER(COALESCE(ghi_chu, '')) LIKE '%khong luong%'
            """
        ),
        {"nhan_vien_id": employee_id, "start_date": start_date, "end_date": end_date},
    ).scalar() or 0

    kpi_record = db.execute(
        text(
            """
            SELECT diem_kpi
            FROM luu_kpi
            WHERE nhan_vien_id = :nhan_vien_id
              AND thang = :thang
              AND nam = :nam
            ORDER BY id DESC
            LIMIT 1
            """
        ),
        {"nhan_vien_id": employee_id, "thang": thang, "nam": nam},
    ).mappings().first()

    if not kpi_record:
        kpi_record = calculate_kpi(
            db=db,
            actor_id=actor_id,
            actor_role=actor_role,
            thang=thang,
            nam=nam,
            target_employee_id=employee_id,
            ghi_chu="Auto-generated for payroll",
            luu_ket_qua=True,
        )
        kpi_score = Decimal(str(kpi_record["diem_kpi"]))
    else:
        kpi_score = Decimal(str(kpi_record.get("diem_kpi") or 0))

    kpi_factor = kpi_score_to_coefficient(float(kpi_score))

    actual_work_days = Decimal(str(valid_attendance_days)) - Decimal(str(late_deduct_days)) - Decimal(str(unpaid_leave_days))
    if actual_work_days < 0:
        actual_work_days = Decimal("0")

    gross_salary = (basic_salary / standard_work_days) * actual_work_days
    net_salary = gross_salary * kpi_factor + Decimal(str(phu_cap)) + Decimal(str(thuong)) - Decimal(str(phat))

    db_payment_status = _payment_status_to_db(trang_thai_thanh_toan)

    if luu_ket_qua:
        existing = (
            db.query(Luong)
            .filter(Luong.nhan_vien_id == employee_id)
            .filter(Luong.thang == thang)
            .filter(Luong.nam == nam)
            .first()
        )
        note = (
            f"Cycle={thang:02d}/{nam}; Present={valid_attendance_days}; LateDeduct={late_deduct_days}; "
            f"Missing={missing_check_actions}; UnpaidLeave={float(unpaid_leave_days):.1f}; KpiFactor={kpi_factor}"
        )
        if existing:
            existing.luong_co_ban = basic_salary
            existing.phu_cap = Decimal(str(phu_cap))
            existing.thuong = Decimal(str(thuong))
            existing.phat = Decimal(str(phat))
            existing.luong_thuc_te = net_salary.quantize(Decimal("0.01"))
            existing.ghi_chu = note
            existing.trang_thai = db_payment_status
        else:
            db.add(
                Luong(
                    nhan_vien_id=employee_id,
                    thang=thang,
                    nam=nam,
                    luong_co_ban=basic_salary,
                    phu_cap=Decimal(str(phu_cap)),
                    thuong=Decimal(str(thuong)),
                    phat=Decimal(str(phat)),
                    luong_thuc_te=net_salary.quantize(Decimal("0.01")),
                    ghi_chu=note,
                    trang_thai=db_payment_status,
                )
            )
        db.commit()

    return {
        "nhan_vien_id": employee_id,
        "nhan_vien_ten": employee.get("ho_ten"),
        "billing_cycle": f"{thang:02d}/{nam}",
        "luong_co_ban": float(basic_salary),
        "so_ngay_cong_chuan": float(standard_work_days),
        "so_ngay_cong_thuc_te": float(actual_work_days),
        "he_so_kpi": float(kpi_factor),
        "kpi_score": float(kpi_score),
        "phu_cap": float(Decimal(str(phu_cap))),
        "thuong": float(Decimal(str(thuong))),
        "phat": float(Decimal(str(phat))),
        "thuc_linh": float(net_salary.quantize(Decimal("0.01"))),
        "trang_thai_thanh_toan": trang_thai_thanh_toan,
        "chi_tiet_khau_tru": {
            "so_lan_di_muon_khong_duyet": late_unapproved,
            "so_ngay_tru_di_muon": late_deduct_days,
            "so_ngay_thieu_check_in_out": missing_check_actions,
            "so_ngay_nghi_khong_luong": float(unpaid_leave_days),
            "so_ngay_cham_cong_hop_le": valid_attendance_days,
            "tong_ngay_co_ban_ghi_cham_cong": len(attendance_rows),
        },
    }


def list_payroll_records(
    db: Session,
    actor_id: int,
    actor_role: str,
    thang: Optional[int] = None,
    nam: Optional[int] = None,
    search: Optional[str] = None,
    target_employee_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    context = load_actor_context(db, actor_id, actor_role)
    resolved_target = target_employee_id
    if not is_admin(context.actor_role) and not is_manager(context.actor_role):
        resolved_target = context.actor_id
    elif resolved_target is not None:
        resolved_target = resolve_target_employee_id(db, context.actor_id, resolved_target, context.actor_role)

    where_clauses = []
    params: dict[str, object] = {}
    if thang is not None:
        where_clauses.append("l.thang = :thang")
        params["thang"] = thang
    if nam is not None:
        where_clauses.append("l.nam = :nam")
        params["nam"] = nam
    if search:
        where_clauses.append("LOWER(nv.ho_ten) LIKE :search")
        params["search"] = f"%{search.strip().lower()}%"
    if resolved_target is not None:
        where_clauses.append("l.nhan_vien_id = :target_employee_id")
        params["target_employee_id"] = resolved_target
    elif not is_admin(context.actor_role) and is_manager(context.actor_role):
        where_clauses.append("nv.phong_ban_id = :department_id")
        params["department_id"] = context.actor_department_id

    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    limit = max(page_size, 1)
    offset = max(page - 1, 0) * limit

    rows = db.execute(
        text(
            f"""
            SELECT
              l.id,
              l.nhan_vien_id,
              l.thang,
              l.nam,
              l.luong_co_ban,
              l.phu_cap,
              l.thuong,
              l.phat,
              l.bao_hiem,
              l.thue,
              l.luong_thuc_te,
              l.trang_thai,
              l.ngay_tra_luong,
              l.ngay_tao,
                            COALESCE((
                                SELECT k.diem_kpi
                                FROM luu_kpi k
                                WHERE k.nhan_vien_id = l.nhan_vien_id
                                    AND k.thang = l.thang
                                    AND k.nam = l.nam
                                ORDER BY k.id DESC
                                LIMIT 1
                            ), 0) AS kpi_score,
              nv.ho_ten,
              nv.chuc_vu,
              nv.phong_ban_id,
              pb.ten_phong
            FROM luong l
            LEFT JOIN nhanvien nv ON nv.id = l.nhan_vien_id
            LEFT JOIN phong_ban pb ON pb.id = nv.phong_ban_id
            WHERE {where_sql}
            ORDER BY l.nam DESC, l.thang DESC, l.id DESC
            LIMIT :limit OFFSET :offset
            """
        ),
        {**params, "limit": limit, "offset": offset},
    ).mappings().all()

    total = db.execute(
        text(
            f"""
            SELECT COUNT(*)
            FROM luong l
            LEFT JOIN nhanvien nv ON nv.id = l.nhan_vien_id
            WHERE {where_sql}
            """
        ),
        params,
    ).scalar() or 0

    data = []
    for row in rows:
        item = dict(row)
        kpi_score = float(item.get("kpi_score") or 0)
        item["kpi_score"] = kpi_score
        item["he_so_kpi"] = float(kpi_score_to_coefficient(kpi_score))
        data.append(item)

    return {
        "data": data,
        "total": total,
        "page": page,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 0,
    }


def export_payroll_period(
    db: Session,
    actor_id: int,
    actor_role: str,
    thang: int,
    nam: int,
) -> dict:
    context = load_actor_context(db, actor_id, actor_role)
    if not is_admin(context.actor_role):
        raise ValueError("Chi admin moi co quyen xuat bang luong")

    employees = db.execute(
        text(
            """
            SELECT id
            FROM nhanvien
            WHERE trang_thai_lam_viec = 'Đang làm'
            """
        )
    ).mappings().all()

    generated = []
    for employee in employees:
        generated.append(
            calculate_payroll(
                db=db,
                actor_id=actor_id,
                actor_role=actor_role,
                thang=thang,
                nam=nam,
                target_employee_id=int(employee["id"]),
                phu_cap=Decimal("0"),
                thuong=Decimal("0"),
                phat=Decimal("0"),
                so_ngay_cong_chuan=None,
                trang_thai_thanh_toan="Chờ duyệt",
                luu_ket_qua=True,
            )
        )

    return {
        "thang": thang,
        "nam": nam,
        "so_bang_luong_da_tao": len(generated),
        "data": generated,
    }
