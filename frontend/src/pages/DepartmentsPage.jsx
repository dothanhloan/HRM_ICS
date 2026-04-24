import React, { useEffect } from "react";

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

	return (
		<section className="admin-section">
			<div className="admin-section-header">
				<div>
					<h2>Danh sách phòng ban</h2>
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
						</div>
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

			<div className="admin-table">
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
									<td>{row.id}</td>
									<td>{row.ten_phong}</td>
									<td>{row.truong_phong || "-"}</td>
									<td>{row.so_nhan_vien ?? 0}</td>
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
