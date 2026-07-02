from __future__ import annotations

from calendar import monthrange
from datetime import date, time, timedelta
import json
from decimal import Decimal, ROUND_HALF_UP
from math import floor
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.generated import Luong
from app.services.hrm_access import (
    has_permission_group,
    is_admin,
    load_actor_context,
    resolve_target_employee_id,
)
from app.services.kpi_service import calculate_kpi, kpi_score_to_coefficient

MONEY = Decimal("0.01")
INSURANCE_BASE_DEFAULT = Decimal("5100000")
SOCIAL_INSURANCE_RATE = Decimal("0.08")
HEALTH_INSURANCE_RATE = Decimal("0.015")
UNEMPLOYMENT_INSURANCE_RATE = Decimal("0.01")
INSURANCE_WORKDAY_THRESHOLD = Decimal("14")
PIT_FIXED_DEDUCTION = Decimal("535500")
PERSONAL_DEDUCTION = Decimal("11000000")
PIT_BRACKETS = [
    (Decimal("5000000"), Decimal("0.05")),
    (Decimal("10000000"), Decimal("0.10")),
    (Decimal("18000000"), Decimal("0.15")),
    (Decimal("32000000"), Decimal("0.20")),
    (Decimal("52000000"), Decimal("0.25")),
    (Decimal("80000000"), Decimal("0.30")),
    (None, Decimal("0.35")),
]


def _money(value: Decimal) -> Decimal:
    return Decimal(value).quantize(MONEY, rounding=ROUND_HALF_UP)


def _month_range(nam: int, thang: int) -> tuple[date, date]:
    if thang == 12:
        return date(nam, thang, 1), date(nam + 1, 1, 1)
    return date(nam, thang, 1), date(nam, thang + 1, 1)


def _normalize_text(value: object) -> str:
    return (str(value or "")).strip().lower()


def _normalize_time(value: object) -> Optional[time]:
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


def _attendance_report_status(value: object) -> str:
    if not value:
        return ""
    try:
        data = json.loads(str(value))
    except (TypeError, json.JSONDecodeError):
        return ""
    if not isinstance(data, dict):
        return ""
    report = data.get("report") or data.get("r") or {}
    if not isinstance(report, dict):
        return ""
    return _normalize_text(report.get("status") or report.get("s"))


def _attendance_report_approved(value: object) -> bool:
    return _attendance_report_status(value) == "approved"

def _normalize_payroll_status(status: str) -> str:
    normalized = _normalize_text(status)
    if normalized in {"da thanh toan", "đã thanh toán", "da tra", "đã trả"}:
        return "Đã thanh toán"
    if normalized in {"da chot", "đã chốt", "chot", "chốt"}:
        return "Đã chốt"
    return "Chờ duyệt"

def _estimate_basic_salary(vai_tro: Optional[str], chuc_vu: Optional[str]) -> Decimal:
    role = _normalize_text(vai_tro)
    position = _normalize_text(chuc_vu)
    if "admin" in role:
        return Decimal("30000000")
    if "giám đốc" in position or "giam doc" in position:
        return Decimal("25000000")
    if "trưởng phòng" in position or "truong phong" in position:
        return Decimal("18000000")
    if "nhân viên" in position or "nhan vien" in position:
        return Decimal("12000000")
    return Decimal("8000000")

def _is_holiday(db: Session, current_date: date) -> bool:
    return bool(
        db.execute(
            text(
                """
                SELECT 1
                FROM ngay_nghi_le
                WHERE :current_date BETWEEN ngay_bat_dau AND ngay_ket_thuc
                   OR (lap_lai_hang_nam = 1
                       AND MONTH(ngay_bat_dau) <= MONTH(:current_date)
                       AND MONTH(ngay_ket_thuc) >= MONTH(:current_date)
                       AND DAY(ngay_bat_dau) <= DAY(:current_date)
                       AND DAY(ngay_ket_thuc) >= DAY(:current_date))
                LIMIT 1
                """
            ),
            {"current_date": current_date},
        ).scalar()
    )


def _standard_work_days(db: Session, nam: int, thang: int, override: Optional[Decimal]) -> Decimal:
    if override and Decimal(str(override)) > 0:
        return Decimal(str(override))

    days = Decimal("0")
    for day in range(1, monthrange(nam, thang)[1] + 1):
        current_date = date(nam, thang, day)
        if current_date.weekday() >= 5:
            continue
        if _is_holiday(db, current_date):
            continue
        days += Decimal("1")
    return days if days > 0 else Decimal("24")


def _approved_leave_days(db: Session, employee_id: int, start_date: date, end_date: date) -> Decimal:
    value = db.execute(
        text(
            """
            SELECT COALESCE(SUM(so_ngay), 0)
            FROM don_nghi_phep
            WHERE nhan_vien_id = :employee_id
              AND trang_thai = 'da_duyet'
              AND ngay_bat_dau < :end_date
              AND ngay_ket_thuc >= :start_date
            """
        ),
        {"employee_id": employee_id, "start_date": start_date, "end_date": end_date},
    ).scalar() or 0
    return Decimal(str(value))


def _available_annual_leave(db: Session, employee_id: int, nam: int) -> Decimal:
    value = db.execute(
        text(
            """
            SELECT ngay_phep_con_lai
            FROM ngay_phep_nam
            WHERE nhan_vien_id = :employee_id AND nam = :nam
            LIMIT 1
            """
        ),
        {"employee_id": employee_id, "nam": nam},
    ).scalar()
    if value is None:
        return Decimal("1")
    return max(Decimal(str(value)), Decimal("0"))


def _pit_taxable_income_from_basic_salary(basic_salary: Decimal) -> Decimal:
    taxable_base = Decimal(str(basic_salary)) - PIT_FIXED_DEDUCTION
    if taxable_base <= PERSONAL_DEDUCTION:
        return Decimal("0")
    return taxable_base - PERSONAL_DEDUCTION


def _personal_income_tax(taxable_income: Decimal) -> Decimal:
    remaining_income = max(Decimal(str(taxable_income)), Decimal("0"))
    if remaining_income <= 0:
        return Decimal("0")

    tax = Decimal("0")
    lower_bound = Decimal("0")
    for upper_bound, rate in PIT_BRACKETS:
        if upper_bound is None:
            taxable_at_bracket = remaining_income
        else:
            bracket_size = upper_bound - lower_bound
            taxable_at_bracket = min(remaining_income, bracket_size)

        if taxable_at_bracket <= 0:
            break

        tax += taxable_at_bracket * rate
        remaining_income -= taxable_at_bracket

        if upper_bound is not None:
            lower_bound = upper_bound

    return tax


def calculate_payroll(
    db: Session,
    actor_id: int,
    actor_role: str,
    thang: int,
    nam: int,
    target_employee_id: Optional[int],
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

    standard_work_days = _standard_work_days(db, nam, thang, so_ngay_cong_chuan)
    start_date, end_date = _month_range(nam, thang)

    attendance_rows = db.execute(
        text(
            """
            SELECT ngay, check_in, check_out, trang_thai, bao_cao
            FROM cham_cong
            WHERE nhan_vien_id = :employee_id
              AND ngay >= :start_date
              AND ngay < :end_date
            """
        ),
        {"employee_id": employee_id, "start_date": start_date, "end_date": end_date},
    ).mappings().all()

    valid_attendance_days = Decimal("0")
    late_unapproved = 0
    missing_check_days = Decimal("0")
    for row in attendance_rows:
        check_in = _normalize_time(row.get("check_in"))
        check_out = _normalize_time(row.get("check_out"))
        explanation_approved = _attendance_report_approved(row.get("bao_cao"))
        has_attendance_action = bool(check_in or check_out)

        if check_in and check_out:
            valid_attendance_days += Decimal("1")
        elif has_attendance_action:
            if explanation_approved:
                valid_attendance_days += Decimal("1")
            else:
                missing_check_days += Decimal("1")

        if check_in and check_in > time(8, 6) and not explanation_approved:
            late_unapproved += 1

    approved_leave_days = _approved_leave_days(db, employee_id, start_date, end_date)
    available_leave_days = _available_annual_leave(db, employee_id, nam)
    paid_leave_days = min(approved_leave_days, available_leave_days)
    unpaid_leave_days = max(approved_leave_days - available_leave_days, Decimal("0"))
    late_deduct_days = Decimal(str(floor(late_unapproved / 3)))

    actual_work_days = valid_attendance_days + paid_leave_days - late_deduct_days - unpaid_leave_days
    actual_work_days = min(max(actual_work_days, Decimal("0")), standard_work_days)

    kpi_record = db.execute(
        text(
            """
            SELECT diem_kpi, he_so_luong
            FROM luu_kpi
            WHERE nhan_vien_id = :employee_id AND thang = :thang AND nam = :nam
            ORDER BY id DESC
            LIMIT 1
            """
        ),
        {"employee_id": employee_id, "thang": thang, "nam": nam},
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
        kpi_factor = Decimal(
            str(
                kpi_record.get("he_so_luong")
                or kpi_record.get("he_so_kpi")
                or kpi_score_to_coefficient(float(kpi_score))
            )
        )
    else:
        kpi_score = Decimal(str(kpi_record.get("diem_kpi") or 0))
        kpi_factor = Decimal(
            str(kpi_record.get("he_so_luong") or kpi_score_to_coefficient(float(kpi_score)))
        )

    daily_salary = basic_salary / standard_work_days
    work_based_salary = daily_salary * actual_work_days
    salary_after_kpi = work_based_salary * kpi_factor

    insurance_base = INSURANCE_BASE_DEFAULT
    if actual_work_days >= INSURANCE_WORKDAY_THRESHOLD:
        social_insurance = insurance_base * SOCIAL_INSURANCE_RATE
        health_insurance = insurance_base * HEALTH_INSURANCE_RATE
        unemployment_insurance = insurance_base * UNEMPLOYMENT_INSURANCE_RATE
    else:
        social_insurance = health_insurance = unemployment_insurance = Decimal("0")
    insurance_deduction = social_insurance + health_insurance + unemployment_insurance

    taxable_income = _pit_taxable_income_from_basic_salary(basic_salary)
    tax = _personal_income_tax(taxable_income)
    net_salary = salary_after_kpi - insurance_deduction - tax

    payroll_status = _normalize_payroll_status(trang_thai_thanh_toan)
    today = date.today()
    note = (
        f"Cycle={thang:02d}/{nam}; Standard={standard_work_days}; Present={valid_attendance_days}; "
        f"PaidLeave={paid_leave_days}; UnpaidLeave={unpaid_leave_days}; "
        f"Late={late_unapproved}; LateDeduct={late_deduct_days}; Missing={missing_check_days}; KpiFactor={kpi_factor}; "
        f"TaxableIncome={_money(taxable_income)}; PitFixedDeduction={PIT_FIXED_DEDUCTION}; Formula=salary_after_kpi-insurance-tax"
    )

    if luu_ket_qua:
        existing = (
            db.query(Luong)
            .filter(Luong.nhan_vien_id == employee_id)
            .filter(Luong.thang == thang)
            .filter(Luong.nam == nam)
            .first()
        )
        payroll = existing or Luong(nhan_vien_id=employee_id, thang=thang, nam=nam)
        payroll.luong_co_ban = _money(basic_salary)
        payroll.bao_hiem = _money(insurance_deduction)
        payroll.thue = _money(tax)
        payroll.luong_thuc_te = _money(net_salary)
        payroll.so_ngay_cong_chuan = standard_work_days
        payroll.so_ngay_cong_thuc_te = actual_work_days
        payroll.luong_ngay = _money(daily_salary)
        payroll.luong_theo_cong = _money(work_based_salary)
        payroll.diem_kpi = kpi_score
        payroll.he_so_kpi = kpi_factor
        payroll.luong_sau_kpi = _money(salary_after_kpi)
        payroll.muc_luong_dong_bh = _money(insurance_base)
        payroll.bh_xa_hoi = _money(social_insurance)
        payroll.bh_y_te = _money(health_insurance)
        payroll.bh_that_nghiep = _money(unemployment_insurance)
        payroll.so_lan_di_muon_khong_duyet = late_unapproved
        payroll.so_ngay_tru_di_muon = late_deduct_days
        payroll.so_ngay_thieu_check_in_out = missing_check_days
        payroll.so_ngay_nghi_khong_luong = unpaid_leave_days
        payroll.ghi_chu = note
        payroll.trang_thai = payroll_status
        payroll.ngay_chot = today if payroll_status in {"Đã chốt", "Đã thanh toán"} else None
        payroll.ngay_tra_luong = today if payroll_status == "Đã thanh toán" else None
        if not existing:
            db.add(payroll)
        db.commit()

    return {
        "nhan_vien_id": employee_id,
        "nhan_vien_ten": employee.get("ho_ten"),
        "billing_cycle": f"{thang:02d}/{nam}",
        "luong_co_ban": float(_money(basic_salary)),
        "so_ngay_cong_chuan": float(standard_work_days),
        "so_ngay_cong_thuc_te": float(actual_work_days),
        "luong_ngay": float(_money(daily_salary)),
        "luong_theo_cong": float(_money(work_based_salary)),
        "kpi_score": float(kpi_score),
        "he_so_kpi": float(kpi_factor),
        "luong_sau_kpi": float(_money(salary_after_kpi)),
        "muc_luong_dong_bh": float(_money(insurance_base)),
        "bh_xa_hoi": float(_money(social_insurance)),
        "bh_y_te": float(_money(health_insurance)),
        "bh_that_nghiep": float(_money(unemployment_insurance)),
        "bao_hiem": float(_money(insurance_deduction)),
        "thue": float(_money(tax)),
        "thuc_linh": float(_money(net_salary)),
        "trang_thai_thanh_toan": payroll_status,
        "chi_tiet_khau_tru": {
            "so_lan_di_muon_khong_duyet": late_unapproved,
            "so_ngay_tru_di_muon": float(late_deduct_days),
            "so_ngay_thieu_check_in_out": float(missing_check_days),
            "so_ngay_nghi_khong_luong": float(unpaid_leave_days),
            "so_ngay_nghi_co_luong": float(paid_leave_days),
        },
    }


def list_payroll_records(
    db: Session,
    actor_id: int,
    actor_role: str,
    thang: Optional[int] = None,
    nam: Optional[int] = None,
    search: Optional[str] = None,
    payroll_status: Optional[str] = None,
    issue: Optional[str] = None,
    department_id: Optional[int] = None,
    target_employee_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    context = load_actor_context(db, actor_id, actor_role)
    payroll_manager = has_permission_group(db, context.actor_id, ["luong", "salary", "payroll"])
    resolved_target = target_employee_id
    if not payroll_manager:
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
    if payroll_status:
        where_clauses.append("l.trang_thai = :payroll_status")
        params["payroll_status"] = payroll_status
    if department_id is not None and payroll_manager:
        where_clauses.append("nv.phong_ban_id = :department_id")
        params["department_id"] = department_id
    if issue:
        normalized_issue = issue.strip().lower()
        if normalized_issue == "late":
            where_clauses.append("l.so_lan_di_muon_khong_duyet > 0")
        elif normalized_issue == "missing_check":
            where_clauses.append("l.so_ngay_thieu_check_in_out > 0")
        elif normalized_issue == "unpaid_leave":
            where_clauses.append("l.so_ngay_nghi_khong_luong > 0")
        elif normalized_issue == "low_kpi":
            where_clauses.append("l.diem_kpi < 70")
        elif normalized_issue == "zero_salary":
            where_clauses.append("l.luong_thuc_te <= 0")
        elif normalized_issue == "no_insurance":
            where_clauses.append("l.bao_hiem <= 0")
    if resolved_target is not None:
        where_clauses.append("l.nhan_vien_id = :target_employee_id")
        params["target_employee_id"] = resolved_target
    if not payroll_manager:
        where_clauses.append("l.trang_thai IN ('Đã chốt', 'Đã thanh toán')")

    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    limit = max(page_size, 1)
    offset = max(page - 1, 0) * limit

    rows = db.execute(
        text(
            f"""
            SELECT
              l.id, l.nhan_vien_id, l.thang, l.nam, l.luong_co_ban,
              l.so_ngay_cong_chuan, l.so_ngay_cong_thuc_te, l.luong_ngay,
              l.luong_theo_cong,
              COALESCE((
                SELECT k.diem_kpi
                FROM luu_kpi k
                WHERE k.nhan_vien_id = l.nhan_vien_id
                  AND k.thang = l.thang
                  AND k.nam = l.nam
                ORDER BY k.id DESC
                LIMIT 1
              ), l.diem_kpi) AS kpi_score,
              COALESCE((
                SELECT k.he_so_luong
                FROM luu_kpi k
                WHERE k.nhan_vien_id = l.nhan_vien_id
                  AND k.thang = l.thang
                  AND k.nam = l.nam
                ORDER BY k.id DESC
                LIMIT 1
              ), l.he_so_kpi) AS he_so_kpi,
              l.luong_sau_kpi,
              l.muc_luong_dong_bh, l.bh_xa_hoi, l.bh_y_te, l.bh_that_nghiep,
              l.bao_hiem, l.thue, l.luong_thuc_te,
              l.so_lan_di_muon_khong_duyet, l.so_ngay_tru_di_muon,
              l.so_ngay_thieu_check_in_out, l.so_ngay_nghi_khong_luong,
              l.trang_thai, l.ngay_chot, l.ngay_tra_luong, l.ngay_tao,
              nv.ho_ten, nv.chuc_vu, nv.phong_ban_id, pb.ten_phong
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

    return {
        "data": [dict(row) for row in rows],
        "total": total,
        "page": page,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 0,
    }


def approve_payroll_record(
    db: Session,
    actor_id: int,
    actor_role: str,
    payroll_id: int,
) -> dict:
    context = load_actor_context(db, actor_id, actor_role)
    if not has_permission_group(db, context.actor_id, ["luong", "salary", "payroll"]):
        raise ValueError("Khong co quyen duyet bang luong")

    payroll = db.query(Luong).filter(Luong.id == payroll_id).first()
    if not payroll:
        raise ValueError("Bang luong khong ton tai")

    payroll.trang_thai = "Đã chốt"
    payroll.ngay_chot = date.today()
    db.commit()
    return {"id": payroll.id, "trang_thai": payroll.trang_thai, "ngay_chot": payroll.ngay_chot}


def export_payroll_period(
    db: Session,
    actor_id: int,
    actor_role: str,
    thang: int,
    nam: int,
) -> dict:
    context = load_actor_context(db, actor_id, actor_role)
    if not has_permission_group(db, context.actor_id, ["luong", "salary", "payroll"]):
        raise ValueError("Khong co quyen xuat bang luong")

    employees = db.execute(
        text(
            """
            SELECT id
            FROM nhanvien
            WHERE trang_thai_lam_viec = 'Đang làm'
               OR trang_thai_lam_viec IS NULL
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
                so_ngay_cong_chuan=None,
                trang_thai_thanh_toan="Chờ duyệt",
                luu_ket_qua=True,
            )
        )

    return {"thang": thang, "nam": nam, "so_bang_luong_da_tao": len(generated), "data": generated}

