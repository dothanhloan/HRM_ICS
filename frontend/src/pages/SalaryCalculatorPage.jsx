import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function SalaryCalculatorPage({ user, isAdmin }) {
	const now = new Date();
	const [month, setMonth] = useState(String(now.getMonth() + 1));
	const [year, setYear] = useState(String(now.getFullYear()));
	const [employeeName, setEmployeeName] = useState("");
	const [employeeEmail, setEmployeeEmail] = useState("");
	const [rows, setRows] = useState([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [loading, setLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [status, setStatus] = useState({ type: "", message: "" });
	const [selectedIds, setSelectedIds] = useState([]);
	const [selectedPayslip, setSelectedPayslip] = useState(null);

	const canManage = isAdmin;
	const actorRole = user?.vai_tro || "Nhân viên";

	const formatMoney = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));
	const payrollStatusLabel = (value) => value || "Chờ duyệt";
	const canApprovePayroll = (row) => isAdmin && row.trang_thai === "Chờ duyệt";

	const pendingRows = useMemo(() => rows.filter((row) => canApprovePayroll(row)), [rows, isAdmin]);
	const selectedPendingRows = useMemo(
		() => rows.filter((row) => selectedIds.includes(row.id) && canApprovePayroll(row)),
		[rows, selectedIds, isAdmin],
	);
	const allPendingSelected = pendingRows.length > 0 && pendingRows.every((row) => selectedIds.includes(row.id));

	const fetchData = async () => {
		if (!user?.id) return;
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
			if (canManage && employeeName.trim()) params.set("employee_name", employeeName.trim());
			if (canManage && employeeEmail.trim()) params.set("employee_email", employeeEmail.trim());

			const response = await fetch(`${API_BASE}/api/v1/luong_tinh_toan/danh_sach?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) throw new Error(data.detail || "Không thể tải dữ liệu lương");
			const nextRows = data.data || [];
			setRows(nextRows);
			setTotal(data.total || 0);
			setSelectedIds((current) => current.filter((id) => nextRows.some((row) => row.id === id)));
			setSelectedPayslip((current) => current ? nextRows.find((row) => row.id === current.id) || null : null);
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id, actorRole, month, year, page, canManage, employeeName, employeeEmail]);

	const exportPayroll = async () => {
		setActionLoading(true);
		setStatus({ type: "", message: "" });
		try {
			const params = new URLSearchParams({
				actor_id: String(user.id),
				actor_role: actorRole,
				thang: String(Number(month)),
				nam: String(Number(year)),
			});
			const response = await fetch(`${API_BASE}/api/v1/luong_tinh_toan/xuat_bang_luong?${params.toString()}`, {
				method: "POST",
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.detail || "Không thể xuất bảng lương");
			setSelectedIds([]);
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

	const approvePayroll = async (payrollId, options = {}) => {
		if (!options.silent) {
			setActionLoading(true);
			setStatus({ type: "", message: "" });
		}
		try {
			const response = await fetch(`${API_BASE}/api/v1/luong_tinh_toan/${payrollId}/duyet`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ actor_id: user.id, actor_role: actorRole }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.detail || "Không thể duyệt bảng lương");
			if (!options.silent) {
				setSelectedIds((current) => current.filter((id) => id !== payrollId));
				setStatus({ type: "success", message: "Đã duyệt bảng lương." });
				await fetchData();
			}
		} catch (error) {
			if (!options.silent) setStatus({ type: "error", message: error.message });
			throw error;
		} finally {
			if (!options.silent) setActionLoading(false);
		}
	};

	const toggleSelected = (payrollId) => {
		setSelectedIds((current) => current.includes(payrollId)
			? current.filter((id) => id !== payrollId)
			: [...current, payrollId]);
	};

	const toggleAllPending = () => {
		setSelectedIds((current) => {
			const pendingIds = pendingRows.map((row) => row.id);
			if (!pendingIds.length) return current;
			if (pendingIds.every((id) => current.includes(id))) {
				return current.filter((id) => !pendingIds.includes(id));
			}
			return Array.from(new Set([...current, ...pendingIds]));
		});
	};

	const approveSelectedPayrolls = async () => {
		if (!selectedPendingRows.length) {
			setStatus({ type: "error", message: "Vui lòng chọn ít nhất một bảng lương đang chờ duyệt." });
			return;
		}
		setActionLoading(true);
		setStatus({ type: "", message: "" });
		let approvedCount = 0;
		try {
			for (const row of selectedPendingRows) {
				// eslint-disable-next-line no-await-in-loop
				await approvePayroll(row.id, { silent: true });
				approvedCount += 1;
			}
			setSelectedIds([]);
			setStatus({ type: "success", message: `Đã duyệt ${approvedCount} bảng lương.` });
			await fetchData();
		} catch (error) {
			setStatus({ type: "error", message: `Đã duyệt ${approvedCount} bảng lương, dừng lại do lỗi: ${error.message}` });
		} finally {
			setActionLoading(false);
		}
	};

	const totalPages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total, pageSize]);
	const pageLabel = `${String(month).padStart(2, "0")}/${year}`;
	const visibleTitle = isAdmin ? "Bảng lương toàn công ty" : "Bảng lương cá nhân";

	return (
		<section className="admin-section payroll-page">
			<div className="payroll-hero salary-hero">
				<div className="payroll-hero-content">
					<h2>{visibleTitle}</h2>
					<p>Thực lĩnh = [(Lương cơ bản / Công chuẩn) x Công thực tế] x Hệ số KPI - Bảo hiểm - Thuế</p>
				</div>
			</div>

			<div className="payroll-card">
				<div className="admin-section-header">
					<div>
						<h3>Bộ lọc lương</h3>
						<p>{isAdmin ? "Admin xem tất cả, lọc theo tên và duyệt hàng loạt" : "Chỉ xem bảng lương đã được duyệt của chính mình"}</p>
					</div>
					<div className="header-actions">
						<div className="admin-actions task-filters">
							{canManage ? <input type="search" placeholder="Lọc theo họ tên..." value={employeeName} onChange={(event) => { setPage(1); setEmployeeName(event.target.value); }} /> : null}
							{canManage ? <input type="search" placeholder="Lọc theo email..." value={employeeEmail} onChange={(event) => { setPage(1); setEmployeeEmail(event.target.value); }} /> : null}
							<input type="number" min="1" max="12" value={month} onChange={(event) => { setPage(1); setMonth(event.target.value); }} />
							<input type="number" min="2000" max="2100" value={year} onChange={(event) => { setPage(1); setYear(event.target.value); }} />
							<button type="button" onClick={() => fetchData()} disabled={loading}>{loading ? "Đang tải..." : "Làm mới"}</button>
							{canManage ? <button type="button" onClick={exportPayroll} disabled={actionLoading}>{actionLoading ? "Đang tính..." : "Tính bảng lương"}</button> : null}
						</div>
					</div>
				</div>
				{status.message ? <p className={`alert ${status.type}`}>{status.message}</p> : null}
				<div className="payroll-stats">
					<div><span>Kỳ đang xem</span><strong>{pageLabel}</strong></div>
					<div><span>Tổng bản ghi</span><strong>{total}</strong></div>
					<div><span>Chờ duyệt trên trang</span><strong>{pendingRows.length}</strong></div>
					<div><span>Đã chọn</span><strong>{selectedPendingRows.length}</strong></div>
				</div>
			</div>

			<div className="payroll-card result">
				<div className="admin-section-header">
					<div>
						<h3>Danh sách payslip</h3>
						{isAdmin ? <p>Chỉ các dòng trạng thái Chờ duyệt mới có thể được chọn để duyệt.</p> : null}
					</div>
					{isAdmin ? (
						<div className="admin-actions">
							<button type="button" className="ghost" onClick={toggleAllPending} disabled={!pendingRows.length || actionLoading}>
								{allPendingSelected ? "Bỏ chọn chờ duyệt" : "Chọn tất cả chờ duyệt"}
							</button>
							<button type="button" onClick={approveSelectedPayrolls} disabled={!selectedPendingRows.length || actionLoading}>
								{actionLoading ? "Đang duyệt..." : `Duyệt ${selectedPendingRows.length} đã chọn`}
							</button>
						</div>
					) : null}
				</div>
				{isAdmin && selectedIds.length ? <p className="alert success">Đã chọn {selectedIds.length} dòng, có {selectedPendingRows.length} dòng đủ điều kiện duyệt.</p> : null}
				{rows.length ? (
					<div className="data-table-wrap">
						<table className="data-table">
							<thead>
								<tr>
									{isAdmin ? <th><input type="checkbox" checked={allPendingSelected} onChange={toggleAllPending} disabled={!pendingRows.length || actionLoading} aria-label="Chọn tất cả chờ duyệt" /></th> : null}
									<th>Nhân viên</th>
									<th>Phòng ban</th>
									<th>Kỳ</th>
									<th>Lương cơ bản</th>
									<th>Công thực tế</th>
									<th>KPI</th>
									<th>Hệ số</th>
									<th>Bảo hiểm</th>
									<th>Thuế</th>
									<th>Thực lĩnh</th>
									<th>Status</th>
									{isAdmin ? <th>Thao tác</th> : null}
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => (
									<tr key={row.id}>
										{isAdmin ? (
											<td>
												<input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelected(row.id)} disabled={!canApprovePayroll(row) || actionLoading} aria-label={`Chọn bảng lương của ${row.ho_ten}`} />
											</td>
										) : null}
										<td>{row.ho_ten}</td>
										<td>{row.ten_phong || "-"}</td>
										<td>{String(row.thang).padStart(2, "0")}/{row.nam}</td>
										<td>{formatMoney(row.luong_co_ban)}</td>
										<td>{Number(row.so_ngay_cong_thuc_te || 0).toFixed(1)}</td>
										<td>{Number(row.kpi_score || 0).toFixed(2)}</td>
										<td>{Number(row.he_so_kpi || 0).toFixed(2)}</td>
										<td>{formatMoney(row.bao_hiem)}</td>
										<td>{formatMoney(row.thue)}</td>
										<td>{formatMoney(row.luong_thuc_te)}</td>
										<td>{payrollStatusLabel(row.trang_thai)}</td>
										{isAdmin ? (
											<td>
												<div className="admin-actions">
													<button type="button" className="ghost" onClick={() => setSelectedPayslip(row)}>Chi tiết</button>
													{canApprovePayroll(row) ? <button type="button" className="ghost" onClick={() => approvePayroll(row.id)} disabled={actionLoading}>Duyệt</button> : null}
												</div>
											</td>
										) : null}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : <p>Chưa có dữ liệu payslip cho kỳ này.</p>}
				<div className="pagination">
					<button type="button" className="ghost" onClick={() => setPage((value) => Math.max(value - 1, 1))} disabled={page <= 1}>Trang trước</button>
					<span>Trang {page} / {totalPages}</span>
					<button type="button" className="ghost" onClick={() => setPage((value) => Math.min(value + 1, totalPages))} disabled={page >= totalPages}>Trang sau</button>
				</div>
			</div>

			{selectedPayslip ? (
				<div className="modal-backdrop" role="dialog" aria-modal="true">
					<div className="modal payroll-detail-modal">
						<div className="modal-header">
							<div>
								<h3>Chi tiết bảng lương</h3>
								<p>{selectedPayslip.ho_ten} · Kỳ {String(selectedPayslip.thang).padStart(2, "0")}/{selectedPayslip.nam}</p>
							</div>
							<button type="button" className="modal-icon-close" onClick={() => setSelectedPayslip(null)} aria-label="Đóng">×</button>
						</div>

						<div className="payroll-detail-grid">
							<DetailBox title="Thông tin chung" items={[
								["Nhân viên", selectedPayslip.ho_ten],
								["Email", selectedPayslip.email || "-"],
								["Phòng ban", selectedPayslip.ten_phong || "-"],
								["Trạng thái", payrollStatusLabel(selectedPayslip.trang_thai)],
							]} />
							<DetailBox title="Ngày công" items={[
								["Công chuẩn", Number(selectedPayslip.so_ngay_cong_chuan || 0).toFixed(1)],
								["Công thực tế", Number(selectedPayslip.so_ngay_cong_thuc_te || 0).toFixed(1)],
								["Đi muộn không duyệt", selectedPayslip.so_lan_di_muon_khong_duyet || 0],
								["Trừ đi muộn", Number(selectedPayslip.so_ngay_tru_di_muon || 0).toFixed(1)],
								["Thiếu check-in/out", Number(selectedPayslip.so_ngay_thieu_check_in_out || 0).toFixed(1)],
								["Nghỉ không lương", Number(selectedPayslip.so_ngay_nghi_khong_luong || 0).toFixed(1)],
							]} />
							<DetailBox title="KPI & Lương" items={[
								["Lương cơ bản", formatMoney(selectedPayslip.luong_co_ban)],
								["Lương ngày", formatMoney(selectedPayslip.luong_ngay)],
								["Lương theo công", formatMoney(selectedPayslip.luong_theo_cong)],
								["Điểm KPI", Number(selectedPayslip.kpi_score || 0).toFixed(2)],
								["Hệ số KPI", Number(selectedPayslip.he_so_kpi || 0).toFixed(2)],
								["Lương sau KPI", formatMoney(selectedPayslip.luong_sau_kpi)],
							]} />
							<DetailBox title="Bảo hiểm & Thực lĩnh" items={[
								["Mức đóng BH", formatMoney(selectedPayslip.muc_luong_dong_bh)],
								["BHXH 8%", formatMoney(selectedPayslip.bh_xa_hoi)],
								["BHYT 1.5%", formatMoney(selectedPayslip.bh_y_te)],
								["BHTN 1%", formatMoney(selectedPayslip.bh_that_nghiep)],
								["Tổng bảo hiểm", formatMoney(selectedPayslip.bao_hiem)],
								["Thuế", formatMoney(selectedPayslip.thue)],
								["Thực lĩnh", formatMoney(selectedPayslip.luong_thuc_te)],
							]} />
						</div>

						<div className="detail-actions">
							<button type="button" className="btn-secondary" onClick={() => setSelectedPayslip(null)}>Đóng</button>
							{canApprovePayroll(selectedPayslip) ? (
								<button type="button" onClick={() => approvePayroll(selectedPayslip.id)} disabled={actionLoading}>
									Duyệt bảng lương này
								</button>
							) : null}
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
}


function DetailBox({ title, items }) {
	return (
		<div className="payroll-detail-box">
			<h4>{title}</h4>
			{items.map(([label, value]) => (
				<div key={label} className="payroll-detail-line">
					<span>{label}</span>
					<strong>{value}</strong>
				</div>
			))}
		</div>
	);
}

export default SalaryCalculatorPage;
