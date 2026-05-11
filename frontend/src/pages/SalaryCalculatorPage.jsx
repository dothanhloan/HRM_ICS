import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function SalaryCalculatorPage({ user, isAdmin, isManager }) {
	const now = new Date();
	const [month, setMonth] = useState(String(now.getMonth() + 1));
	const [year, setYear] = useState(String(now.getFullYear()));
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
			const response = await fetch(`${API_BASE}/api/v1/luong_tinh_toan/danh_sach?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Không thể tải dữ liệu lương");
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

	const exportPayroll = async () => {
		setActionLoading(true);
		setStatus({ type: "", message: "" });
		try {
			const response = await fetch(`${API_BASE}/api/v1/luong_tinh_toan/xuat_bang_luong`, {
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
				throw new Error(data.detail || "Không thể xuất bảng lương");
			}
			setStatus({
				type: "success",
				message: `Đã tạo/xuất ${data.so_bang_luong_da_tao || 0} bảng lương cho kỳ ${String(month).padStart(2, "0")}/${year}.`,
			});
			await fetchData();
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		} finally {
			setActionLoading(false);
		}
	};

	const totalPages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total, pageSize]);
	const pageLabel = `${String(month).padStart(2, "0")}/${year}`;
	const visibleTitle = isAdmin
		? "Bảng lương toàn công ty"
		: isManager
			? "Bảng lương team của tôi"
			: "Bảng lương cá nhân";

	const formatMoney = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));
	const payrollStatusLabel = (value) => {
		if ((value || "").toLowerCase().includes("đã trả") || (value || "").toLowerCase().includes("da tra")) {
			return "PAID";
		}
		return "DRAFT";
	};

	return (
		<section className="admin-section payroll-page">
			<div className="payroll-hero salary-hero">
				<div className="payroll-hero-content">
					<h2>{visibleTitle}</h2>
					<p>Xem payslip theo tháng/năm; admin có thể xuất bảng lương để duyệt và test</p>
				</div>
			</div>

			<div className="payroll-card">
				<div className="admin-section-header">
					<div>
						<h3>Bộ lọc lương</h3>
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
								<button type="button" onClick={exportPayroll} disabled={actionLoading}>
									{actionLoading ? "Đang xuất..." : "Xuất bảng lương"}
								</button>
							) : null}
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
				<h3>Danh sách payslip</h3>
				{rows.length ? (
					<div className="data-table-wrap">
						<table className="data-table">
							<thead>
								<tr>
									<th>Nhân viên</th>
									<th>Phòng ban</th>
									<th>Kỳ</th>
									<th>Lương cơ bản</th>
									<th>Công thực tế</th>
									<th>KPI</th>
									<th>Hệ số</th>
									<th>Phụ cấp</th>
									<th>Thưởng</th>
									<th>Phạt</th>
									<th>Thực lĩnh</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => (
									<tr key={row.id}>
										<td>{row.ho_ten}</td>
										<td>{row.ten_phong || "-"}</td>
										<td>{String(row.thang).padStart(2, "0")}/{row.nam}</td>
										<td>{formatMoney(row.luong_co_ban)}</td>
										<td>{Number(row.so_ngay_cong_thuc_te || 0).toFixed(1)}</td>
										<td>{Number(row.kpi_score || 0).toFixed(2)}</td>
										<td>{Number(row.he_so_kpi || 0).toFixed(2)}</td>
										<td>{formatMoney(row.phu_cap)}</td>
										<td>{formatMoney(row.thuong)}</td>
										<td>{formatMoney(row.phat)}</td>
										<td>{formatMoney(row.luong_thuc_te)}</td>
										<td>{payrollStatusLabel(row.trang_thai)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p>Chưa có dữ liệu payslip cho kỳ này.</p>
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

export default SalaryCalculatorPage;
