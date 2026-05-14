import React, { useEffect, useMemo, useState } from "react";

function LeavePage({
	user,
	isAdmin,
	scope = "manage",
	leaveRows,
	leaveTotal,
	leaveStatusFilter,
	leaveStatus,
	leaveLoading,
	leaveFormOpen,
	leaveForm,
	setLeaveFormOpen,
	setLeaveForm,
	setLeaveStatusFilter,
	resetLeaveForm,
	fetchLeaveRequests,
	submitLeaveForm,
	approveLeaveRequest,
	rejectLeaveRequest,
}) {
	const [rejectModalOpen, setRejectModalOpen] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [rejectTarget, setRejectTarget] = useState(null);
	const [detailTarget, setDetailTarget] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [monthFilter, setMonthFilter] = useState("");
	const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));

	useEffect(() => {
		if (!user?.id) {
			return;
		}
		fetchLeaveRequests(1, scope === "self");
	}, [user?.id, scope]);

	const statusLabels = useMemo(
		() => ({
			cho_duyet: "Chờ duyệt",
			da_duyet: "Đã duyệt",
			tu_choi: "Đã hủy",
		}),
		[]
	);

	const leaveTypes = useMemo(
		() => [
			{ value: "Phep nam", label: "Phép năm" },
			{ value: "Phep khong luong", label: "Phép không lương" },
			{ value: "Nghi om", label: "Nghỉ ốm" },
			{ value: "Nghi thai san", label: "Nghỉ thai sản" },
			{ value: "Nghi viec rieng", label: "Nghỉ việc riêng" },
			{ value: "Khac", label: "Khác" },
		],
		[]
	);

	const leaveTypeLabels = useMemo(() => {
		return leaveTypes.reduce((acc, item) => {
			acc[item.value] = item.label;
			return acc;
		}, {});
	}, [leaveTypes]);

	const statusCounts = useMemo(() => {
		return leaveRows.reduce(
			(acc, row) => {
				if (row.trang_thai === "cho_duyet") {
					acc.pending += 1;
				}
				if (row.trang_thai === "da_duyet") {
					acc.approved += 1;
				}
				if (row.trang_thai === "tu_choi") {
					acc.rejected += 1;
				}
				return acc;
			},
			{ pending: 0, approved: 0, rejected: 0 }
		);
	}, [leaveRows]);

	const filteredRows = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();
		return leaveRows.filter((row) => {
			const created = String(row.thoi_gian_tao || "");
			const start = String(row.ngay_bat_dau || "");
			const rowYear = (created || start).slice(0, 4);
			const rowMonth = (created || start).slice(5, 7);
			const matchesYear = !yearFilter || rowYear === yearFilter;
			const matchesMonth = !monthFilter || rowMonth === monthFilter.padStart(2, "0");
			const haystack = [
				row.nhan_vien_ten,
				row.nhan_vien_email,
				row.phong_ban,
				row.loai_phep,
				row.ly_do,
			]
				.join(" ")
				.toLowerCase();
			return matchesYear && matchesMonth && (!normalizedSearch || haystack.includes(normalizedSearch));
		});
	}, [leaveRows, monthFilter, searchTerm, yearFilter]);

	const statusClassMap = useMemo(
		() => ({
			cho_duyet: "status-pending",
			da_duyet: "status-approved",
			tu_choi: "status-rejected",
		}),
		[]
	);

	const openRejectModal = (row) => {
		setRejectTarget(row);
		setRejectReason("");
		setRejectModalOpen(true);
	};

	const confirmReject = () => {
		if (!rejectTarget) {
			return;
		}
		rejectLeaveRequest(rejectTarget.id, rejectReason);
		setRejectModalOpen(false);
		setRejectTarget(null);
	};

	const formatDate = (value) => {
		if (!value) {
			return "-";
		}
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return String(value);
		}
		return date.toLocaleDateString("vi-VN");
	};

	const formatDateTime = (value) => {
		if (!value) {
			return "-";
		}
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return String(value);
		}
		return date.toLocaleString("vi-VN", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getInitials = (name) =>
		String(name || "NV")
			.trim()
			.split(/\s+/)
			.slice(-2)
			.map((part) => part.charAt(0).toUpperCase())
			.join("") || "NV";

	const renderEmployee = (row) => (
		<div className="leave-employee-cell">
			{row.nhan_vien_avatar ? (
				<img className="attendance-avatar" src={row.nhan_vien_avatar} alt={row.nhan_vien_ten || "Nhan vien"} />
			) : (
				<span className="attendance-avatar placeholder">{getInitials(row.nhan_vien_ten)}</span>
			)}
			<div>
				<strong>{row.nhan_vien_ten || row.nhan_vien_id}</strong>
				<small>{row.phong_ban || row.nhan_vien_email || "-"}</small>
			</div>
		</div>
	);

	const runFilter = () => fetchLeaveRequests(1, scope === "self");
	const openDetail = (row) => setDetailTarget(row);
	const stopRowClick = (event) => event.stopPropagation();

	return (
		<section className="admin-section leave-page">
			<div className="leave-hero">
				<div className="leave-hero-content">
					<h2>{isAdmin ? "Quản lý nghỉ phép" : "Nghỉ phép"}</h2>
					<p>{isAdmin ? "Theo dõi, duyệt và xử lý đơn nghỉ phép nhân viên" : "Tạo và quản lý đơn xin nghỉ phép của bạn"}</p>
				</div>
			</div>

			<div className="admin-section-header">
				<div>
					<h3>{isAdmin ? "Danh sách đơn nghỉ phép" : "Lịch sử đơn nghỉ phép của bạn"}</h3>
					<p>Tổng số: {leaveTotal ?? leaveRows.length} đơn</p>
				</div>
				<div className="admin-actions">
					<select
						value={leaveStatusFilter}
						onChange={(event) => setLeaveStatusFilter(event.target.value)}
					>
						<option value="">Tất cả trạng thái</option>
						<option value="cho_duyet">Chờ duyệt</option>
						<option value="da_duyet">Đã duyệt</option>
						<option value="tu_choi">Từ chối</option>
					</select>
					{isAdmin ? (
						<>
							<select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
								<option value="">Tất cả tháng</option>
								{Array.from({ length: 12 }, (_, index) => String(index + 1)).map((item) => (
									<option key={item} value={item}>Tháng {item}</option>
								))}
							</select>
							<select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
								{Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() - 2 + index)).map((item) => (
									<option key={item} value={item}>{item}</option>
								))}
							</select>
							<input
								type="search"
								placeholder="Tìm theo tên nhân viên..."
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
							/>
						</>
					) : null}
					<button type="button" onClick={runFilter}>
						Tìm kiếm
					</button>
					{!isAdmin ? (
						<button type="button" onClick={() => setLeaveFormOpen(true)}>
							Tạo đơn nghỉ phép
						</button>
					) : null}
				</div>
			</div>

			<div className="leave-summary">
				<div className="leave-stat-card total">
					<span>Tổng số đơn</span>
					<strong>{leaveTotal ?? leaveRows.length}</strong>
					<small>Hiển thị {leaveRows.length} đơn</small>
				</div>
				<div className="leave-stat-card pending">
					<span>Chờ duyệt</span>
					<strong>{statusCounts.pending}</strong>
					<small>Cần xử lý</small>
				</div>
				<div className="leave-stat-card approved">
					<span>Đã duyệt</span>
					<strong>{statusCounts.approved}</strong>
					<small>Đã xác nhận</small>
				</div>
				<div className="leave-stat-card rejected">
					<span>Từ chối</span>
					<strong>{statusCounts.rejected}</strong>
					<small>Không hợp lệ</small>
				</div>
			</div>

			{leaveFormOpen ? (
				<div className="modal-backdrop">
					<div className="modal">
						<div className="modal-header">
							<h3>Tạo đơn nghỉ phép</h3>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setLeaveFormOpen(false);
									resetLeaveForm();
								}}
							>
								Đóng
							</button>
						</div>
						<div className="form-grid">
							<div className="form-group">
								<label>Loại nghỉ *</label>
								<select
									value={leaveForm.loai_phep}
									onChange={(event) =>
										setLeaveForm({
											...leaveForm,
											loai_phep: event.target.value,
										})
									}
								>
									{leaveTypes.map((item) => (
										<option key={item.value} value={item.value}>
											{item.label}
										</option>
									))}
								</select>
							</div>
							<div className="form-group">
								<label>Ngày bắt đầu *</label>
								<input
									type="date"
									value={leaveForm.ngay_bat_dau}
									onChange={(event) =>
										setLeaveForm({
											...leaveForm,
											ngay_bat_dau: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Ngày kết thúc *</label>
								<input
									type="date"
									value={leaveForm.ngay_ket_thuc}
									onChange={(event) =>
										setLeaveForm({
											...leaveForm,
											ngay_ket_thuc: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Lý do *</label>
								<textarea
									rows="3"
									value={leaveForm.ly_do}
									onChange={(event) =>
										setLeaveForm({
											...leaveForm,
											ly_do: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Ghi chú</label>
								<textarea
									rows="3"
									value={leaveForm.ghi_chu}
									onChange={(event) =>
										setLeaveForm({
											...leaveForm,
											ghi_chu: event.target.value,
										})
									}
								/>
							</div>
						</div>
						{leaveStatus.message ? (
							<div className={`alert ${leaveStatus.type}`}>
								{leaveStatus.message}
							</div>
						) : null}
						<div className="form-actions">
							<button type="button" onClick={submitLeaveForm}>
								Gửi đơn
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setLeaveFormOpen(false);
									resetLeaveForm();
								}}
							>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}

			{rejectModalOpen ? (
				<div className="modal-backdrop">
					<div className="modal confirm">
						<div className="modal-header">
							<h3>Từ chối đơn nghỉ</h3>
							<button
								type="button"
								className="ghost"
								onClick={() => setRejectModalOpen(false)}
							>
								Đóng
							</button>
						</div>
						<div className="form-group">
							<label>Lý do từ chối *</label>
							<textarea
								rows="3"
								value={rejectReason}
								onChange={(event) => setRejectReason(event.target.value)}
							/>
						</div>
						<div className="form-actions">
							<button type="button" onClick={confirmReject}>
								Xác nhận
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => setRejectModalOpen(false)}
							>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}

			{detailTarget ? (
				<div className="modal-backdrop">
					<div className="modal leave-detail-modal">
						<div className="modal-header gradient">
							<h3>Chi tiết đơn nghỉ phép</h3>
							<button type="button" className="ghost" onClick={() => setDetailTarget(null)}>
								Đóng
							</button>
						</div>
						<div className="leave-detail-grid">
							<div className="leave-detail-field">
								<label>Nhân viên</label>
								<strong>{detailTarget.nhan_vien_ten || detailTarget.nhan_vien_id}</strong>
							</div>
							<div className="leave-detail-field">
								<label>Phòng ban</label>
								<strong>{detailTarget.phong_ban || "-"}</strong>
							</div>
							<div className="leave-detail-field">
								<label>Loại phép</label>
								<strong>{leaveTypeLabels[detailTarget.loai_phep] || detailTarget.loai_phep || "-"}</strong>
							</div>
							<div className="leave-detail-field">
								<label>Trạng thái</label>
								<span className={`status-pill ${statusClassMap[detailTarget.trang_thai] || "status-muted"}`}>
									{statusLabels[detailTarget.trang_thai] || detailTarget.trang_thai}
								</span>
							</div>
							<div className="leave-detail-field wide">
								<label>Thời gian nghỉ</label>
								<strong>{formatDate(detailTarget.ngay_bat_dau)} đến {formatDate(detailTarget.ngay_ket_thuc)}</strong>
							</div>
							<div className="leave-detail-field">
								<label>Số ngày</label>
								<span className="leave-days-badge">{detailTarget.so_ngay ?? "-"} ngày</span>
							</div>
							<div className="leave-detail-field">
								<label>Ngày tạo đơn</label>
								<strong>{formatDateTime(detailTarget.thoi_gian_tao)}</strong>
							</div>
							<div className="leave-detail-field wide">
								<label>Lý do</label>
								<p>{detailTarget.ly_do || "-"}</p>
							</div>
							{detailTarget.ghi_chu || detailTarget.ly_do_tu_choi ? (
								<div className="leave-detail-field wide">
									<label>Ghi chú</label>
									<p>{detailTarget.ghi_chu || detailTarget.ly_do_tu_choi}</p>
								</div>
							) : null}
						</div>
					</div>
				</div>
			) : null}

			{leaveStatus.message && !leaveFormOpen ? (
				<div className={`alert ${leaveStatus.type}`}>
					{leaveStatus.message}
				</div>
			) : null}

			<div className="admin-table leave-table">
				<table>
					<thead>
						<tr>
							<th>#</th>
							{isAdmin ? <th>Nhân viên</th> : null}
							<th>Loại phép</th>
							<th>Thời gian nghỉ</th>
							<th>Số ngày</th>
							<th>Lý do</th>
							<th>Trạng thái</th>
							<th>Ngày tạo</th>
							<th>Thao tác</th>
						</tr>
					</thead>
					<tbody>
						{leaveLoading ? (
							<tr>
								<td colSpan={isAdmin ? 9 : 8}>Đang tải dữ liệu...</td>
							</tr>
						) : filteredRows.length === 0 ? (
							<tr>
								<td colSpan={isAdmin ? 9 : 8}>Chưa có đơn nghỉ phép.</td>
							</tr>
						) : (
							filteredRows.map((row, index) => (
								<tr
									key={row.id}
									className={isAdmin ? "leave-clickable-row" : ""}
									onClick={isAdmin ? () => openDetail(row) : undefined}
								>
									<td>
										<span className="data-emphasis">{index + 1}</span>
									</td>
									{isAdmin ? <td>{renderEmployee(row)}</td> : null}
									<td>
										<span className="data-chip leave-type-chip">
											{leaveTypeLabels[row.loai_phep] || row.loai_phep || "-"}
										</span>
									</td>
									<td>
										<span className="leave-date-range">
											{formatDate(row.ngay_bat_dau)} → {formatDate(row.ngay_ket_thuc)}
										</span>
									</td>
									<td>
										<span className="leave-days-badge">{row.so_ngay ?? "-"} ngày</span>
									</td>
									<td>{row.ly_do || "-"}</td>
									<td>
										<span
											className={`status-pill ${statusClassMap[row.trang_thai] || "status-muted"}`}
										>
											{statusLabels[row.trang_thai] || row.trang_thai}
										</span>
									</td>
									<td>
										<span className="leave-created-at">{formatDateTime(row.thoi_gian_tao)}</span>
									</td>
									<td>
										<div className="row-actions leave-row-actions" onClick={stopRowClick}>
											<button type="button" className="icon-action view" title="Xem chi tiết" onClick={() => setDetailTarget(row)}>
												👁
											</button>
											{isAdmin ? (
												<>
													<button
														type="button"
														className="icon-action approve"
														title="Duyệt"
														disabled={row.trang_thai !== "cho_duyet"}
														onClick={() => approveLeaveRequest(row.id)}
													>
														✓
													</button>
													<button
														type="button"
														className="icon-action reject"
														title="Từ chối"
														disabled={row.trang_thai !== "cho_duyet"}
														onClick={() => openRejectModal(row)}
													>
														×
													</button>
												</>
											) : null}
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}

export default LeavePage;
