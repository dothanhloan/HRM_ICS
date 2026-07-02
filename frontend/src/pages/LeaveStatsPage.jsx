import React, { useEffect, useMemo, useState } from "react";

function LeaveStatsPage({ user, apiBase }) {
	const [year, setYear] = useState(String(new Date().getFullYear()));
	const [rows, setRows] = useState([]);
	const [summary, setSummary] = useState({
		tong_ngay_phep: 0,
		ngay_phep_da_dung: 0,
		ngay_phep_con_lai: 0,
		ngay_phep_nam_truoc: 0,
		nhan_vien: 0,
	});
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState({ type: "", message: "" });

	const fetchStats = async () => {
		if (!user?.id) {
			return;
		}
		setLoading(true);
		setStatus({ type: "", message: "" });
		try {
			const params = new URLSearchParams({
				actor_id: String(user.id),
				nam: year,
			});
			const response = await fetch(
				`${apiBase}/api/v1/don_nghi_phep/thong_ke_ngay_phep?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Không thể tải thống kê ngày phép");
			}
			setRows(data.data || []);
			setSummary(data.summary || {});
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchStats();
	}, [user?.id, year]);

	const years = useMemo(
		() => Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() - 2 + index)),
		[]
	);

	const formatNumber = (value) => Number(value || 0).toFixed(1);
	const getInitials = (name) =>
		String(name || "NV")
			.trim()
			.split(/\s+/)
			.slice(-2)
			.map((part) => part.charAt(0).toUpperCase())
			.join("") || "NV";

	return (
		<section className="admin-section leave-page leave-stats-page">
			<div className="leave-hero stats">
				<div className="leave-hero-content">
					<h2>Thống kê ngày phép nhân viên - Năm {year}</h2>
					<p>Theo dõi ngày phép chưa dùng, đã dùng và còn lại của từng nhân viên</p>
				</div>
			</div>

			<div className="leave-summary leave-stats-summary">
				<div className="leave-stat-card pending">
					<span>Tổng phép chưa dùng</span>
					<strong>{formatNumber(summary.tong_ngay_phep)}</strong>
					<small>Từ năm cũ đến hiện tại</small>
				</div>
				<div className="leave-stat-card rejected">
					<span>Tổng phép đã dùng</span>
					<strong>{formatNumber(summary.ngay_phep_da_dung)}</strong>
					<small>Đơn đã duyệt</small>
				</div>
				<div className="leave-stat-card approved">
					<span>Tổng phép còn lại</span>
					<strong>{formatNumber(summary.ngay_phep_con_lai)}</strong>
					<small>Có thể sử dụng</small>
				</div>
				<div className="leave-stat-card total">
					<span>Nhân viên</span>
					<strong>{summary.nhan_vien || rows.length}</strong>
					<small>Đang thống kê</small>
				</div>
			</div>

			<div className="admin-section-header">
				<div>
					<h3>Chi tiết ngày phép từng nhân viên</h3>
					<p>{rows.length} nhân viên</p>
				</div>
				<div className="admin-actions">
					<select value={year} onChange={(event) => setYear(event.target.value)}>
						{years.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</select>
					<button type="button" onClick={fetchStats}>
						Lọc
					</button>
				</div>
			</div>

			{status.message ? <div className={`alert ${status.type}`}>{status.message}</div> : null}

			<div className="admin-table leave-table leave-stats-table">
				<table>
					<thead>
						<tr>
							<th>STT</th>
							<th>Nhân viên</th>
							<th>Phòng ban</th>
							<th>Ngày vào làm</th>
							<th>Chưa dùng</th>
							<th>Đã dùng</th>
							<th>Còn lại</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={7}>Đang tải dữ liệu...</td>
							</tr>
						) : rows.length === 0 ? (
							<tr>
								<td colSpan={7}>Chưa có dữ liệu ngày phép.</td>
							</tr>
						) : (
							rows.map((row, index) => (
								<tr key={row.id}>
									<td>{index + 1}</td>
									<td>
										<div className="leave-employee-cell">
											{row.avatar_url ? (
												<img className="attendance-avatar" src={row.avatar_url} alt={row.ho_ten || "Nhân viên"} />
											) : (
												<span className="attendance-avatar placeholder">{getInitials(row.ho_ten)}</span>
											)}
											<div>
												<strong>{row.ho_ten}</strong>
												<small>{row.email}</small>
											</div>
										</div>
									</td>
									<td>{row.phong_ban || "-"}</td>
									<td>{row.ngay_vao_lam || "-"}</td>
									<td><span className="leave-days-badge">{formatNumber(row.tong_ngay_phep)} ngày</span></td>
									<td><span className="leave-used-value">{formatNumber(row.ngay_phep_da_dung)} ngày</span></td>
									<td><span className="leave-remain-value">{formatNumber(row.ngay_phep_con_lai)} ngày</span></td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}

export default LeaveStatsPage;
