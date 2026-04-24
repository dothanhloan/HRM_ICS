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

	const leaveTypes = [
		"Phep nam",
		"Phep khong luong",
		"Nghi om",
		"Nghi thai san",
		"Nghi viec rieng",
		"Khac",
	];

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
		<section className="admin-section">
			<div className="admin-section-header">
				<div>
					<h2>Quan ly nghi phep</h2>
					<p>Tong so: {leaveTotal} don</p>
				</div>
				<div className="admin-actions">
					<select
						value={leaveStatusFilter}
						onChange={(event) => setLeaveStatusFilter(event.target.value)}
					>
						<option value="">Tat ca trang thai</option>
						<option value="cho_duyet">Cho duyet</option>
						<option value="da_duyet">Da duyet</option>
						<option value="tu_choi">Tu choi</option>
					</select>
					<button type="button" onClick={() => fetchLeaveRequests(1)}>
						Tim kiem
					</button>
					{!isAdmin ? (
						<button type="button" onClick={() => setLeaveFormOpen(true)}>
							Tao don nghi phep
						</button>
					) : null}
				</div>
			</div>

			{leaveFormOpen ? (
				<div className="modal-backdrop">
					<div className="modal">
						<div className="modal-header">
							<h3>Tao don nghi phep</h3>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setLeaveFormOpen(false);
									resetLeaveForm();
								}}
							>
								Dong
							</button>
						</div>
						<div className="form-grid">
							<div className="form-group">
								<label>Loai nghi *</label>
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
										<option key={item} value={item}>
											{item}
										</option>
									))}
								</select>
							</div>
							<div className="form-group">
								<label>Ngay bat dau *</label>
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
								<label>Ngay ket thuc *</label>
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
								<label>Ly do *</label>
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
								<label>Ghi chu</label>
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
								Gui don
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setLeaveFormOpen(false);
									resetLeaveForm();
								}}
							>
								Huy
							</button>
						</div>
					</div>
				</div>
			) : null}

			{rejectModalOpen ? (
				<div className="modal-backdrop">
					<div className="modal confirm">
						<div className="modal-header">
							<h3>Tu choi don nghi</h3>
							<button
								type="button"
								className="ghost"
								onClick={() => setRejectModalOpen(false)}
							>
								Dong
							</button>
						</div>
						<div className="form-group">
							<label>Ly do tu choi *</label>
							<textarea
								rows="3"
								value={rejectReason}
								onChange={(event) => setRejectReason(event.target.value)}
							/>
						</div>
						<div className="form-actions">
							<button type="button" onClick={confirmReject}>
								Xac nhan
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => setRejectModalOpen(false)}
							>
								Huy
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

			<div className="admin-table">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Nhan vien</th>
							<th>Loai nghi</th>
							<th>Bat dau</th>
							<th>Ket thuc</th>
							<th>So ngay</th>
							<th>Trang thai</th>
							<th>Ly do</th>
							<th>Ghi chu</th>
							<th>Nguoi duyet</th>
							{isAdmin ? <th>Thao tac</th> : null}
						</tr>
					</thead>
					<tbody>
						{leaveLoading ? (
							<tr>
								<td colSpan={isAdmin ? 11 : 10}>Dang tai du lieu...</td>
							</tr>
						) : leaveRows.length === 0 ? (
							<tr>
								<td colSpan={isAdmin ? 11 : 10}>Chua co don nghi phep.</td>
							</tr>
						) : (
							leaveRows.map((row) => (
								<tr key={row.id}>
									<td>{row.id}</td>
									<td>{row.nhan_vien_ten || row.nhan_vien_id}</td>
									<td>{row.loai_phep || "-"}</td>
									<td>{row.ngay_bat_dau || "-"}</td>
									<td>{row.ngay_ket_thuc || "-"}</td>
									<td>{row.so_ngay ?? "-"}</td>
									<td>{statusLabels[row.trang_thai] || row.trang_thai}</td>
									<td>{row.ly_do || "-"}</td>
									<td>{row.ghi_chu || row.ly_do_tu_choi || "-"}</td>
									<td>{row.nguoi_duyet_ten || row.nguoi_duyet_id || "-"}</td>
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
													Tu choi
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
