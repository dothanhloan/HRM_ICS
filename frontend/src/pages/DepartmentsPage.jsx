import React, { useEffect, useMemo } from "react";

function DepartmentsPage({
	departmentRows,
	departmentTotal,
	departmentQuery,
	departmentStatus,
	departmentLoading,
	departmentPage,
	departmentPageSize,
	departmentTotalPages,
	departmentFormOpen,
	departmentEditingId,
	departmentForm,
	departmentLeaders,
	departmentLeadersLoading,
	departmentActionTarget,
	departmentTransferId,
	setDepartmentQuery,
	setDepartmentPageSize,
	setDepartmentForm,
	setDepartmentTransferId,
	fetchDepartments,
	openCreateDepartment,
	openEditDepartment,
	submitDepartmentForm,
	requestDepartmentAction,
	confirmDepartmentAction,
	closeDepartmentAction,
}) {
	useEffect(() => {
		fetchDepartments(1);
	}, []);

	const summaryStats = useMemo(() => {
		const totalEmployees = departmentRows.reduce(
			(sum, row) => sum + (Number(row.so_nhan_vien) || 0),
			0
		);
		const emptyDepartments = departmentRows.filter(
			(row) => (Number(row.so_nhan_vien) || 0) === 0
		).length;
		return {
			totalEmployees,
			emptyDepartments,
		};
	}, [departmentRows]);

	return (
		<section className="admin-section department-page">
			<div className="department-hero">
				<div className="department-hero-content">
					<h2>Quản lý phòng ban</h2>
					<p>Tổng hợp bộ phận, trưởng phòng và quy mô nhân sự</p>
				</div>
			</div>

			<div className="admin-section-header">
				<div>
					<h3>Danh sách phòng ban</h3>
					<p>Tổng số: {departmentTotal} phòng ban</p>
				</div>
				<div className="admin-actions">
					<input
						type="search"
						placeholder="Tìm theo tên phòng ban hoặc trưởng phòng"
						value={departmentQuery}
						onChange={(event) => setDepartmentQuery(event.target.value)}
					/>
					<button type="button" onClick={() => fetchDepartments(1)}>
						Tìm kiếm
					</button>
					<button type="button" onClick={openCreateDepartment}>
						Thêm phòng ban
					</button>
				</div>
			</div>

			<div className="department-summary">
				<div className="department-stat-card total">
					<span>Tổng phòng ban</span>
					<strong>{departmentTotal}</strong>
					<small>Đang hiển thị {departmentRows.length} phòng ban</small>
				</div>
				<div className="department-stat-card staff">
					<span>Tổng nhân sự</span>
					<strong>{summaryStats.totalEmployees}</strong>
					<small>Quy mô toàn hệ thống</small>
				</div>
				<div className="department-stat-card empty">
					<span>Phòng ban trống</span>
					<strong>{summaryStats.emptyDepartments}</strong>
					<small>Cần bổ sung nhân sự</small>
				</div>
			</div>

			{departmentFormOpen ? (
				<div className="modal-backdrop">
					<div className="modal">
						<div className="modal-header">
							<h3>
								{departmentEditingId ? "Cập nhật phòng ban" : "Thêm phòng ban"}
							</h3>
							<button type="button" className="ghost" onClick={closeDepartmentAction}>
								Đóng
							</button>
						</div>
						<div className="form-grid">
							<div className="form-group">
								<label>Tên phòng ban *</label>
								<input
									value={departmentForm.ten_phong}
									onChange={(event) =>
										setDepartmentForm({
											...departmentForm,
											ten_phong: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Trưởng bộ phận</label>
								<select
									value={departmentForm.truong_phong_id}
									onChange={(event) =>
										setDepartmentForm({
											...departmentForm,
											truong_phong_id: event.target.value,
										})
									}
								>
									<option value="">Chọn trưởng bộ phận</option>
									{departmentLeaders.map((leader) => (
										<option key={leader.id} value={leader.id}>
											{leader.ho_ten}
										</option>
									))}
								</select>
							</div>
						</div>
						{departmentLeadersLoading ? (
							<p>Đang tải danh sách trưởng bộ phận...</p>
						) : null}
						<div className="form-actions">
							<button type="button" onClick={submitDepartmentForm}>
								{departmentEditingId ? "Lưu cập nhật" : "Lưu phòng ban"}
							</button>
							<button type="button" className="ghost" onClick={closeDepartmentAction}>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}

			{departmentStatus.message ? (
				<div className={`alert ${departmentStatus.type}`}>
					{departmentStatus.message}
				</div>
			) : null}

			<div className="admin-table department-table">
				<table>
					<thead>
						<tr>
							<th>Mã</th>
							<th>Tên phòng ban</th>
							<th>Trưởng bộ phận</th>
							<th>Số nhân viên</th>
							<th>Thao tác</th>
						</tr>
					</thead>
					<tbody>
						{departmentLoading ? (
							<tr>
								<td colSpan="5">Đang tải dữ liệu...</td>
							</tr>
						) : (
							departmentRows.map((row) => (
								<tr key={row.id}>
									<td>
										<span className="data-emphasis">{row.id}</span>
									</td>
									<td>
										<span className="data-chip">{row.ten_phong}</span>
									</td>
									<td>
										<span className="data-chip muted">{row.truong_phong || "-"}</span>
									</td>
									<td>
										<span className="data-emphasis">{row.so_nhan_vien ?? 0}</span>
									</td>
									<td>
										<div className="row-actions">
											<button type="button" onClick={() => openEditDepartment(row)}>
												Sửa
											</button>
											<button
												type="button"
												className="ghost"
												onClick={() => requestDepartmentAction(row)}
											>
												Xóa
											</button>
										</div>
									</td>
								</tr>
							))
						)}
						{!departmentLoading && departmentRows.length === 0 ? (
							<tr>
								<td colSpan="5">Không có dữ liệu</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>

			<div className="pagination">
				<button
					type="button"
					disabled={departmentPage <= 1 || departmentLoading}
					onClick={() => fetchDepartments(departmentPage - 1)}
				>
					Trang trước
				</button>
				<span>
					Trang {departmentPage} / {departmentTotalPages || 1}
				</span>
				<button
					type="button"
					disabled={departmentPage >= departmentTotalPages || departmentLoading}
					onClick={() => fetchDepartments(departmentPage + 1)}
				>
					Trang sau
				</button>
				<select
					value={departmentPageSize}
					onChange={(event) => {
						setDepartmentPageSize(Number(event.target.value));
						fetchDepartments(1);
					}}
				>
					<option value={10}>10 / trang</option>
					<option value={20}>20 / trang</option>
					<option value={50}>50 / trang</option>
				</select>
			</div>

			{departmentActionTarget ? (
				<div className="modal-backdrop">
					<div className="modal confirm">
						<h3>Xác nhận xóa phòng ban</h3>
						<p>Bạn có chắc muốn xóa phòng ban {departmentActionTarget.ten_phong}?</p>
						{departmentActionTarget.so_nhan_vien > 0 ? (
							<div className="form-group">
								<label>
									Phòng ban đang có {departmentActionTarget.so_nhan_vien} nhân viên. Vui lòng chọn phòng ban chuyển đến.
								</label>
								<select
									value={departmentTransferId}
									onChange={(event) => setDepartmentTransferId(event.target.value)}
								>
									<option value="">Chọn phòng ban</option>
									{departmentRows
										.filter((row) => row.id !== departmentActionTarget.id)
										.map((row) => (
											<option key={row.id} value={row.id}>
												{row.ten_phong}
											</option>
										))}
								</select>
							</div>
						) : null}
						<div className="form-actions">
							<button type="button" onClick={confirmDepartmentAction}>
								Xác nhận
							</button>
							<button type="button" className="ghost" onClick={closeDepartmentAction}>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
}

export default DepartmentsPage;
