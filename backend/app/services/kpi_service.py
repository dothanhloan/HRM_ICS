from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from math import floor
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.generated import LuuKpi
from app.services.hrm_access import (
    get_standard_work_days,
    is_admin,
    is_manager,
    load_actor_context,
    resolve_target_employee_id,
)


@dataclass
class KpiWeights:
    completion_rate: Decimal = Decimal("0.4")
    on_time_rate: Decimal = Decimal("0.4")
    workload_score: Decimal = Decimal("0.2")


def _month_range(nam: int, thang: int) -> tuple[date, date]:
    if thang == 12:
        return date(nam, thang, 1), date(nam + 1, 1, 1)
    return date(nam, thang, 1), date(nam, thang + 1, 1)


def _load_weight(db: Session, key: str, default: Decimal) -> Decimal:
    value = db.execute(
        text(
            """
            SELECT gia_tri
            FROM luong_cau_hinh
            WHERE LOWER(COALESCE(ten_cau_hinh, '')) = :key
            ORDER BY id DESC
            LIMIT 1
            """
        ),
        {"key": key.lower()},
    ).scalar()
    if value is None:
        return default
    try:
        resolved = Decimal(str(value))
        return resolved if resolved >= 0 else default
    except Exception:
        return default


def load_kpi_weights(db: Session) -> KpiWeights:
    weights = KpiWeights(
        completion_rate=_load_weight(db, "kpi_completion_weight", Decimal("0.4")),
        on_time_rate=_load_weight(db, "kpi_ontime_weight", Decimal("0.4")),
        workload_score=_load_weight(db, "kpi_workload_weight", Decimal("0.2")),
    )
    total = weights.completion_rate + weights.on_time_rate + weights.workload_score
    if total == 0:
        return KpiWeights()
    return KpiWeights(
        completion_rate=(weights.completion_rate / total).quantize(Decimal("0.0001")),
        on_time_rate=(weights.on_time_rate / total).quantize(Decimal("0.0001")),
        workload_score=(weights.workload_score / total).quantize(Decimal("0.0001")),
    )


def kpi_score_to_level(score: float) -> str:
    if score >= 90:
        return "XUAT_SAC"
    if score >= 80:
        return "DAT_TOT"
    if score >= 70:
        return "DAT"
    return "CAN_CAI_THIEN"


def _is_approved_late_explanation(status: Optional[str]) -> bool:
    value = (status or "").strip().lower()
    approved_markers = ["duyet giai trinh", "được duyệt", "da duyet", "đã duyệt"]
    return any(marker in value for marker in approved_markers)


def _load_employee_profile(db: Session, employee_id: int) -> dict:
    row = db.execute(
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
    return dict(row) if row else {}


def calculate_kpi(db: Session, actor_id: int, actor_role: str, thang: int, nam: int, target_employee_id: Optional[int], ghi_chu: Optional[str] = None, luu_ket_qua: bool = True) -> dict:
    employee_id = resolve_target_employee_id(db, actor_id, target_employee_id, actor_role)
    employee = _load_employee_profile(db, employee_id)
    if not employee:
        raise ValueError("Nhan vien khong ton tai")

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

    late_unapproved = 0
    missing_check_actions = 0
    for row in attendance_rows:
        check_in = row.get("check_in")
        check_out = row.get("check_out")
        if check_in and getattr(check_in, "hour", 0) * 60 + getattr(check_in, "minute", 0) > 8 * 60 + 6:
            if not _is_approved_late_explanation(row.get("trang_thai")):
                late_unapproved += 1
        if not check_in or not check_out:
            missing_check_actions += 1

    assigned_tasks = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM cong_viec_nguoi_nhan cvnn
            JOIN cong_viec cv ON cv.id = cvnn.cong_viec_id
            WHERE cvnn.nhan_vien_id = :nhan_vien_id
              AND (
                (cv.ngay_bat_dau >= :start_date AND cv.ngay_bat_dau < :end_date)
                OR (cv.han_hoan_thanh >= :start_date AND cv.han_hoan_thanh < :end_date)
              )
            """
        ),
        {"nhan_vien_id": employee_id, "start_date": start_date, "end_date": end_date},
    ).scalar() or 0

    completed_tasks = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM cong_viec_nguoi_nhan cvnn
            JOIN cong_viec cv ON cv.id = cvnn.cong_viec_id
            WHERE cvnn.nhan_vien_id = :nhan_vien_id
              AND cv.trang_thai IN ('Đã hoàn thành', 'Da hoan thanh')
              AND COALESCE(cv.ngay_hoan_thanh, cv.han_hoan_thanh, cv.ngay_bat_dau) >= :start_date
              AND COALESCE(cv.ngay_hoan_thanh, cv.han_hoan_thanh, cv.ngay_bat_dau) < :end_date
            """
        ),
        {"nhan_vien_id": employee_id, "start_date": start_date, "end_date": end_date},
    ).scalar() or 0

    completed_on_time = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM cong_viec_nguoi_nhan cvnn
            JOIN cong_viec cv ON cv.id = cvnn.cong_viec_id
            WHERE cvnn.nhan_vien_id = :nhan_vien_id
              AND cv.trang_thai IN ('Đã hoàn thành', 'Da hoan thanh')
              AND cv.han_hoan_thanh IS NOT NULL
              AND COALESCE(cv.ngay_hoan_thanh, cv.han_hoan_thanh) <= cv.han_hoan_thanh
              AND COALESCE(cv.ngay_hoan_thanh, cv.han_hoan_thanh, cv.ngay_bat_dau) >= :start_date
              AND COALESCE(cv.ngay_hoan_thanh, cv.han_hoan_thanh, cv.ngay_bat_dau) < :end_date
            """
        ),
        {"nhan_vien_id": employee_id, "start_date": start_date, "end_date": end_date},
    ).scalar() or 0

    team_size = db.execute(
        text("SELECT COUNT(*) FROM nhanvien WHERE phong_ban_id = :department_id AND trang_thai_lam_viec = 'Đang làm'"),
        {"department_id": employee.get("phong_ban_id")},
    ).scalar() or 0

    team_avg_tasks = db.execute(
        text(
            """
            SELECT AVG(task_count) FROM (
                SELECT COUNT(cvnn.id) AS task_count
                FROM nhanvien n
                LEFT JOIN cong_viec_nguoi_nhan cvnn ON cvnn.nhan_vien_id = n.id
                LEFT JOIN cong_viec cv ON cv.id = cvnn.cong_viec_id
                    AND ((cv.ngay_bat_dau >= :start_date AND cv.ngay_bat_dau < :end_date)
                    OR (cv.han_hoan_thanh >= :start_date AND cv.han_hoan_thanh < :end_date))
                WHERE n.phong_ban_id = :department_id
                  AND n.trang_thai_lam_viec = 'Đang làm'
                GROUP BY n.id
            ) AS team_tasks
            """
        ),
        {"department_id": employee.get("phong_ban_id"), "start_date": start_date, "end_date": end_date},
    ).scalar() or 0

    workload_score = float(assigned_tasks / team_avg_tasks) if team_avg_tasks else 0.0
    workload_score = min(max(workload_score, 0.0), 1.0)

    completion_rate = float(completed_tasks / assigned_tasks) if assigned_tasks else 0.0
    ontime_rate = float(completed_on_time / completed_tasks) if completed_tasks else 0.0

    weights = load_kpi_weights(db)
    final_kpi = (
        Decimal(str(completion_rate)) * weights.completion_rate
        + Decimal(str(ontime_rate)) * weights.on_time_rate
        + Decimal(str(workload_score)) * weights.workload_score
    ) * Decimal("100")
    final_kpi = final_kpi.quantize(Decimal("0.01"))

    late_group_deduct_days = floor(late_unapproved / 3)
    kpi_coefficient = kpi_score_to_coefficient(float(final_kpi))

    payload = {
        "nhan_vien_id": employee_id,
        "nhan_vien_ten": employee.get("ho_ten"),
        "phong_ban_id": employee.get("phong_ban_id"),
        "thang": thang,
        "nam": nam,
        "tong_task_duoc_giao": int(assigned_tasks),
        "tong_task_hoan_thanh": int(completed_tasks),
        "tong_task_dung_han": int(completed_on_time),
        "trung_binh_task_team": float(team_avg_tasks or 0),
        "ty_le_hoan_thanh": round(completion_rate * 100, 2),
        "ty_le_dung_han": round(ontime_rate * 100, 2),
        "diem_khoi_luong": round(workload_score * 100, 2),
        "diem_kpi": float(final_kpi),
        "he_so_kpi": float(kpi_coefficient),
        "he_so_luong": float(kpi_coefficient),
        "xep_loai": kpi_score_to_level(float(final_kpi)),
        "trong_so": {
            "completion_rate": float(weights.completion_rate),
            "on_time_rate": float(weights.on_time_rate),
            "workload_score": float(weights.workload_score),
        },
        "chi_tiet": {
            "so_lan_di_muon_khong_duyet": late_unapproved,
            "so_ngay_tru_theo_di_muon": late_group_deduct_days,
            "so_ngay_thieu_check_in_out": missing_check_actions,
            "assigned_tasks": int(assigned_tasks),
            "completed_tasks": int(completed_tasks),
            "completed_on_time": int(completed_on_time),
            "team_avg_tasks": float(team_avg_tasks or 0),
            "attendance_records": len(attendance_rows),
            "standard_work_days": float(get_standard_work_days(db)),
        },
    }

    if luu_ket_qua:
        existing = (
            db.query(LuuKpi)
            .filter(LuuKpi.nhan_vien_id == employee_id)
            .filter(LuuKpi.thang == thang)
            .filter(LuuKpi.nam == nam)
            .first()
        )
        note = ghi_chu or ""
        summary = (
            f"Completion={completion_rate:.4f}; OnTime={ontime_rate:.4f}; "
            f"Workload={workload_score:.4f}; KPI={float(final_kpi):.2f}"
        )
        if existing:
            existing.phong_ban_id = employee.get("phong_ban_id")
            existing.tong_task_duoc_giao = int(assigned_tasks)
            existing.tong_task_hoan_thanh = int(completed_tasks)
            existing.tong_task_dung_han = int(completed_on_time)
            existing.trung_binh_task_team = Decimal(str(team_avg_tasks or 0)).quantize(Decimal("0.01"))
            existing.ty_le_hoan_thanh = Decimal(str(completion_rate * 100)).quantize(Decimal("0.01"))
            existing.ty_le_dung_han = Decimal(str(ontime_rate * 100)).quantize(Decimal("0.01"))
            existing.diem_khoi_luong = Decimal(str(workload_score * 100)).quantize(Decimal("0.01"))
            existing.trong_so_hoan_thanh = weights.completion_rate
            existing.trong_so_dung_han = weights.on_time_rate
            existing.trong_so_khoi_luong = weights.workload_score
            existing.chi_tieu = summary
            existing.ket_qua = f"KPI score {float(final_kpi):.2f}; coefficient {float(kpi_coefficient):.4f}"
            existing.diem_kpi = float(final_kpi)
            existing.he_so_luong = kpi_coefficient
            existing.xep_loai = kpi_score_to_level(float(final_kpi))
            existing.trang_thai = "DA_TINH"
            existing.ghi_chu = note
        else:
            db.add(
                LuuKpi(
                    nhan_vien_id=employee_id,
                    phong_ban_id=employee.get("phong_ban_id"),
                    thang=thang,
                    nam=nam,
                    tong_task_duoc_giao=int(assigned_tasks),
                    tong_task_hoan_thanh=int(completed_tasks),
                    tong_task_dung_han=int(completed_on_time),
                    trung_binh_task_team=Decimal(str(team_avg_tasks or 0)).quantize(Decimal("0.01")),
                    ty_le_hoan_thanh=Decimal(str(completion_rate * 100)).quantize(Decimal("0.01")),
                    ty_le_dung_han=Decimal(str(ontime_rate * 100)).quantize(Decimal("0.01")),
                    diem_khoi_luong=Decimal(str(workload_score * 100)).quantize(Decimal("0.01")),
                    trong_so_hoan_thanh=weights.completion_rate,
                    trong_so_dung_han=weights.on_time_rate,
                    trong_so_khoi_luong=weights.workload_score,
                    chi_tieu=summary,
                    ket_qua=f"KPI score {float(final_kpi):.2f}; coefficient {float(kpi_coefficient):.4f}",
                    diem_kpi=float(final_kpi),
                    he_so_luong=kpi_coefficient,
                    xep_loai=kpi_score_to_level(float(final_kpi)),
                    trang_thai="DA_TINH",
                    ghi_chu=note,
                )
            )
        db.commit()

    return payload


def kpi_score_to_coefficient(score: float) -> Decimal:
    if score >= 90:
        return Decimal("1.2")
    if score >= 80:
        return Decimal("1.0")
    if score >= 70:
        return Decimal("0.9")
    return Decimal("0.7")


def run_kpi_period(db: Session, actor_id: int, actor_role: str, thang: int, nam: int) -> dict:
    context = load_actor_context(db, actor_id, actor_role)
    if not is_admin(context.actor_role):
        raise ValueError("Chi admin moi co quyen chay KPI thang")

    employee_rows = db.execute(
        text(
            """
            SELECT id
            FROM nhanvien
            WHERE trang_thai_lam_viec = 'Đang làm'
            """
        )
    ).mappings().all()

    generated = []
    for employee in employee_rows:
        generated.append(
            calculate_kpi(
                db=db,
                actor_id=actor_id,
                actor_role=actor_role,
                thang=thang,
                nam=nam,
                target_employee_id=int(employee["id"]),
                ghi_chu="Auto-generated KPI period",
                luu_ket_qua=True,
            )
        )

    return {
        "thang": thang,
        "nam": nam,
        "so_bang_kpi_da_tao": len(generated),
        "data": generated,
    }


def list_kpi_records(
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
    if not is_admin(context.actor_role):
        resolved_target = context.actor_id
    elif resolved_target is not None:
        resolved_target = resolve_target_employee_id(db, context.actor_id, resolved_target, context.actor_role)

    where_clauses = []
    params: dict[str, object] = {}
    if thang is not None:
        where_clauses.append("kpi.thang = :thang")
        params["thang"] = thang
    if nam is not None:
        where_clauses.append("kpi.nam = :nam")
        params["nam"] = nam
    if search:
        where_clauses.append("LOWER(nv.ho_ten) LIKE :search")
        params["search"] = f"%{search.strip().lower()}%"
    if resolved_target is not None:
        where_clauses.append("kpi.nhan_vien_id = :target_employee_id")
        params["target_employee_id"] = resolved_target

    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    limit = max(page_size, 1)
    offset = max(page - 1, 0) * limit

    rows = db.execute(
        text(
            f"""
            SELECT
              kpi.id,
              kpi.nhan_vien_id,
              kpi.phong_ban_id AS kpi_phong_ban_id,
              kpi.thang,
              kpi.nam,
              kpi.tong_task_duoc_giao,
              kpi.tong_task_hoan_thanh,
              kpi.tong_task_dung_han,
              kpi.trung_binh_task_team,
              kpi.ty_le_hoan_thanh,
              kpi.ty_le_dung_han,
              kpi.diem_khoi_luong,
              kpi.trong_so_hoan_thanh,
              kpi.trong_so_dung_han,
              kpi.trong_so_khoi_luong,
              kpi.chi_tieu,
              kpi.ket_qua,
              kpi.diem_kpi,
              kpi.he_so_luong,
              kpi.xep_loai,
              kpi.trang_thai,
              kpi.ghi_chu,
              kpi.ngay_tao,
              kpi.ngay_tinh,
              kpi.ngay_cap_nhat,
              nv.ho_ten,
              nv.chuc_vu,
              nv.phong_ban_id,
              pb.ten_phong
            FROM luu_kpi kpi
            LEFT JOIN nhanvien nv ON nv.id = kpi.nhan_vien_id
            LEFT JOIN phong_ban pb ON pb.id = nv.phong_ban_id
            WHERE {where_sql}
            ORDER BY kpi.nam DESC, kpi.thang DESC, kpi.id DESC
            LIMIT :limit OFFSET :offset
            """
        ),
        {**params, "limit": limit, "offset": offset},
    ).mappings().all()

    total = db.execute(
        text(
            f"""
            SELECT COUNT(*)
            FROM luu_kpi kpi
            LEFT JOIN nhanvien nv ON nv.id = kpi.nhan_vien_id
            WHERE {where_sql}
            """
        ),
        params,
    ).scalar() or 0

    data = []
    for row in rows:
        item = dict(row)
        item["he_so_kpi"] = float(item.get("he_so_luong") or kpi_score_to_coefficient(float(item.get("diem_kpi") or 0)))
        for key in [
            "trung_binh_task_team",
            "ty_le_hoan_thanh",
            "ty_le_dung_han",
            "diem_khoi_luong",
            "trong_so_hoan_thanh",
            "trong_so_dung_han",
            "trong_so_khoi_luong",
            "he_so_luong",
        ]:
            if item.get(key) is not None:
                item[key] = float(item[key])
        data.append(item)

    return {
        "data": data,
        "total": total,
        "page": page,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 0,
    }
