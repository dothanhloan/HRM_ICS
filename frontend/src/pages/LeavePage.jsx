import React, { useEffect, useMemo, useState } from "react";

function LeavePage({
	user,
	isAdmin,
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

	useEffect(() => {
		if (!user?.id) {
			return;
		}
		fetchLeaveRequests(1);
	}, [user?.id]);

	const statusLabels = useMemo(
		() => ({
			cho_duyet: "Cho duyet",
			da_duyet: "Da duyet",
			tu_choi: "Tu choi",
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

	return (
		<section className="admin-section leave-page">
			<div className="leave-hero">
				<div className="leave-hero-content">
					<h2>Xin nghỉ phép</h2>
					<p>Quản lý và theo dõi đơn nghỉ phép của bạn</p>
				</div>
			</div>

			<div className="admin-section-header">
				<div>
					<h3>Danh sách đơn nghỉ phép</h3>
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
					<button type="button" onClick={() => fetchLeaveRequests(1)}>
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

			{leaveStatus.message && !leaveFormOpen ? (
				<div className={`alert ${leaveStatus.type}`}>
					{leaveStatus.message}
				</div>
			) : null}

			<div className="admin-table leave-table">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Nhân viên</th>
							<th>Loại nghỉ</th>
							<th>Ngày bắt đầu</th>
							<th>Ngày kết thúc</th>
							<th>Số ngày</th>
							<th>Trạng thái</th>
							<th>Lý do</th>
							<th>Ghi chú</th>
							<th>Người duyệt</th>
							{isAdmin ? <th>Thao tác</th> : null}
						</tr>
					</thead>
					<tbody>
						{leaveLoading ? (
							<tr>
								<td colSpan={isAdmin ? 11 : 10}>Đang tải dữ liệu...</td>
							</tr>
						) : leaveRows.length === 0 ? (
							<tr>
								<td colSpan={isAdmin ? 11 : 10}>Chưa có đơn nghỉ phép.</td>
							</tr>
						) : (
							leaveRows.map((row) => (
								<tr key={row.id}>
									<td>
										<span className="data-emphasis">{row.id}</span>
									</td>
									<td>
										<span className="data-chip">
											{row.nhan_vien_ten || row.nhan_vien_id}
										</span>
									</td>
									<td>
										<span className="data-chip">
											{leaveTypeLabels[row.loai_phep] || row.loai_phep || "-"}
										</span>
									</td>
									<td>
										<span className="data-emphasis">{row.ngay_bat_dau || "-"}</span>
									</td>
									<td>
										<span className="data-emphasis">{row.ngay_ket_thuc || "-"}</span>
									</td>
									<td>
										<span className="data-emphasis">{row.so_ngay ?? "-"}</span>
									</td>
									<td>
										<span
											className={`status-pill ${statusClassMap[row.trang_thai] || "status-muted"}`}
										>
											{statusLabels[row.trang_thai] || row.trang_thai}
										</span>
									</td>
									<td>{row.ly_do || "-"}</td>
									<td>{row.ghi_chu || row.ly_do_tu_choi || "-"}</td>
									<td>
										<span className="data-chip muted">
											{row.nguoi_duyet_ten || row.nguoi_duyet_id || "-"}
										</span>
									</td>
									{isAdmin ? (
										<td>
											<div className="row-actions">
												<button
													type="button"
													disabled={row.trang_thai !== "cho_duyet"}
													onClick={() => approveLeaveRequest(row.id)}
												>
													Duyet
												</button>
												<button
													type="button"
													className="ghost"
													disabled={row.trang_thai !== "cho_duyet"}
													onClick={() => openRejectModal(row)}
												>
													Từ chối
												</button>
											</div>
										</td>
									) : null}
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
