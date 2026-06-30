import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const getDefaultKpiPeriod = () => {
	const now = new Date();
	const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	return {
		month: String(previousMonth.getMonth() + 1),
		year: String(previousMonth.getFullYear()),
	};
};

function KpiCalculatorPage({ user, isAdmin, isManager }) {
	const defaultPeriod = getDefaultKpiPeriod();
	const [month, setMonth] = useState(defaultPeriod.month);
	const [year, setYear] = useState(defaultPeriod.year);
	const [search, setSearch] = useState("");
	const [rows, setRows] = useState([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [status, setStatus] = useState({ type: "", message: "" });

	const canManage = isAdmin;
	const actorRole = user?.vai_tro || "Nhân viên";

	const fetchData = async () => {
		if (!user?.id) {
			return;
		}
		setLoading(true);
		setStatus({ type: "", message: "" });
		try {
			const params = new URLSearchParams({
				actor_id: String(user.id),
				actor_role: actorRole,
				thang: month,
				nam: year,
				page: String(page),
				page_size: String(pageSize),
			});
			if (canManage && search.trim()) {
				params.set("search", search.trim());
			}
			const response = await fetch(`${API_BASE}/api/v1/kpi_tinh_toan/danh_sach?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Không thể tải dữ liệu KPI");
			}
			setRows(data.data || []);
			setTotal(data.total || 0);
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id, actorRole, month, year, page, canManage]);

	const runMonthlyKpi = async () => {
		setActionLoading(true);
		setStatus({ type: "", message: "" });
		try {
			const response = await fetch(`${API_BASE}/api/v1/kpi_tinh_toan/chay_thang`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					actor_id: user.id,
					actor_role: actorRole,
					thang: Number(month),
					nam: Number(year),
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Không thể chạy KPI tháng");
			}
			setStatus({
				type: "success",
				message: `Đã chạy KPI cho ${data.so_bang_kpi_da_tao || 0} nhân sự.`,
			});
			await fetchData();
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		} finally {
			setActionLoading(false);
		}
	};

	const calculateMyKpi = async () => {
		setActionLoading(true);
		setStatus({ type: "", message: "" });
		try {
			const response = await fetch(`${API_BASE}/api/v1/kpi_tinh_toan/tinh_toan`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					actor_id: user.id,
					actor_role: actorRole,
					target_nhan_vien_id: user.id,
					thang: Number(month),
					nam: Number(year),
					luu_ket_qua: true,
					ghi_chu: "User-generated KPI period",
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tinh KPI ca nhan");
			}
			setStatus({ type: "success", message: "Da tinh va luu KPI ca nhan." });
			await fetchData();
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		} finally {
			setActionLoading(false);
		}
	};

	const totalPages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total, pageSize]);
	const pageLabel = `${String(month).padStart(2, "0")}/${year}`;
	const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

	const visibleTitle = isAdmin
		? "KPI toàn công ty"
		: isManager
			? "KPI team của tôi"
			: "KPI cá nhân";

	return (
		<section className="admin-section payroll-page">
			<div className="payroll-hero kpi-hero">
				<div className="payroll-hero-content">
					<h2>{visibleTitle}</h2>
					<p>Xem KPI theo tháng/năm; admin có thể chạy KPI tháng để test chức năng</p>
				</div>
			</div>

			<div className="payroll-card">
				<div className="admin-section-header">
					<div>
						<h3>Bộ lọc KPI</h3>
						<p>{isAdmin ? "Admin xem tất cả và lọc theo tên" : "Chỉ xem dữ liệu được phân quyền"}</p>
					</div>
					<div className="header-actions">
						<div className="admin-actions task-filters">
							{canManage ? (
								<input
									type="search"
									placeholder="Lọc theo tên nhân viên..."
									value={search}
									onChange={(event) => setSearch(event.target.value)}
								/>
							) : null}
							<input
								type="number"
								min="1"
								max="12"
								value={month}
								onChange={(event) => {
									setPage(1);
									setMonth(event.target.value);
								}}
							/>
							<input
								type="number"
								min="2000"
								max="2100"
								value={year}
								onChange={(event) => {
									setPage(1);
									setYear(event.target.value);
								}}
							/>
							<button type="button" onClick={() => fetchData()} disabled={loading}>
								{loading ? "Đang tải..." : "Làm mới"}
							</button>
							{canManage ? (
								<button type="button" onClick={runMonthlyKpi} disabled={actionLoading}>
									{actionLoading ? "Đang chạy KPI..." : "Chạy KPI tháng"}
								</button>
							) : (
								<button type="button" onClick={calculateMyKpi} disabled={actionLoading}>
									{actionLoading ? "Dang tinh KPI..." : "Tinh KPI ca nhan"}
								</button>
							)}
						</div>
					</div>
				</div>
				{status.message ? <p className={`alert ${status.type}`}>{status.message}</p> : null}
				<div className="payroll-stats">
					<div>
						<span>Kỳ đang xem</span>
						<strong>{pageLabel}</strong>
					</div>
					<div>
						<span>Tổng bản ghi</span>
						<strong>{total}</strong>
					</div>
					<div>
						<span>Vai trò</span>
						<strong>{actorRole}</strong>
					</div>
				</div>
			</div>

			<div className="payroll-card result">
				<h3>Danh sách KPI</h3>
				{rows.length ? (
					<div className="data-table-wrap">
						<table className="data-table">
							<thead>
								<tr>
									<th>Nhân viên</th>
									<th>Phòng ban</th>
									<th>Chức vụ</th>
									<th>Kỳ</th>
									<th>Công việc</th>
									<th>Hoàn thành</th>
									<th>Đúng hạn</th>
									<th>Khối lượng</th>
									<th>Điểm KPI</th>
									<th>Hệ số</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => (
									<tr key={row.id}>
										<td>{row.ho_ten}</td>
										<td>{row.ten_phong || "-"}</td>
										<td>{row.chuc_vu || "-"}</td>
										<td>{String(row.thang).padStart(2, "0")}/{row.nam}</td>
										<td>
											{row.tong_task_hoan_thanh || 0}/{row.tong_task_duoc_giao || 0}
											<small> TB phòng ban: {Number(row.trung_binh_task_team || 0).toFixed(2)}</small>
										</td>
										<td>{formatPercent(row.ty_le_hoan_thanh)}</td>
										<td>{formatPercent(row.ty_le_dung_han)}</td>
										<td>{formatPercent(row.diem_khoi_luong)}</td>
										<td>{Number(row.diem_kpi || 0).toFixed(2)}</td>
										<td>{Number(row.he_so_kpi || 0).toFixed(2)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p>Chưa có dữ liệu KPI cho kỳ này.</p>
				)}
				<div className="pagination">
					<button type="button" className="ghost" onClick={() => setPage((value) => Math.max(value - 1, 1))} disabled={page <= 1}>Trang trước</button>
					<span>Trang {page} / {totalPages}</span>
					<button type="button" className="ghost" onClick={() => setPage((value) => Math.min(value + 1, totalPages))} disabled={page >= totalPages}>Trang sau</button>
				</div>
			</div>
		</section>
	);
}

export default KpiCalculatorPage;

