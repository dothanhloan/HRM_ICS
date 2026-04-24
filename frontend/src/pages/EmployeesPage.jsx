import React, { useEffect, useMemo, useState } from "react";

function EmployeesPage({
	employeeRows,
	employeeTotal,
	employeeQuery,
	employeeStatus,
	employeeLoading,
	employeePage,
	employeePageSize,
	employeeTotalPages,
	employeeFormOpen,
	employeeEditingId,
	employeeForm,
	employeeDepartments,
	employeeDepartmentsLoading,
	deleteTarget,
	setEmployeeQuery,
	setEmployeeFormOpen,
	setEmployeeForm,
	setEmployeeEditingId,
	setEmployeePageSize,
	resetEmployeeForm,
	fetchEmployees,
	fetchEmployeeDepartments,
	openCreateEmployee,
	openEditEmployee,
	submitEmployeeForm,
	deleteEmployee,
	confirmDeleteEmployee,
	setDeleteTarget,
}) {
	const [viewEmployee, setViewEmployee] = useState(null);

	const departmentMap = useMemo(() => {
		return employeeDepartments.reduce((acc, department) => {
			acc[String(department.id)] = department.ten_phong;
			return acc;
		}, {});
	}, [employeeDepartments]);

	const getInitials = (name) => {
		if (!name) {
			return "NV";
		}
		const parts = name.trim().split(" ").filter(Boolean);
		const initials = parts.slice(-2).map((part) => part[0]).join("");
		return initials.toUpperCase();
	};

	const openViewEmployee = (row) => {
		setEmployeeEditingId(row.id);
		setEmployeeForm({
			ho_ten: row.ho_ten || "",
			email: row.email || "",
			mat_khau: "",
			so_dien_thoai: row.so_dien_thoai || "",
			gioi_tinh: row.gioi_tinh || "",
			ngay_sinh: row.ngay_sinh || "",
			phong_ban_id: row.phong_ban_id ?? "",
			chuc_vu: row.chuc_vu || "",
			luong_co_ban: row.luong_co_ban ?? "",
			trang_thai_lam_viec: row.trang_thai_lam_viec || "Đang làm",
			vai_tro: row.vai_tro || "Nhân viên",
			ngay_vao_lam: row.ngay_vao_lam || "",
			avatar_url: row.avatar_url || "",
		});
		fetchEmployeeDepartments();
		setViewEmployee(row);
	};
	useEffect(() => {
		fetchEmployees(1);
		fetchEmployeeDepartments();
	}, []);

	return (
		<section className="admin-section">
			<div className="admin-section-header">
				<div>
					<h2>Danh sách nhân viên</h2>
					<p>Tổng số: {employeeTotal} nhân viên</p>
				</div>
				<div className="admin-actions">
					<input
						type="search"
						placeholder="Tìm theo tên, email, số điện thoại"
						value={employeeQuery}
						onChange={(event) => setEmployeeQuery(event.target.value)}
					/>
					<button type="button" onClick={() => fetchEmployees(1)}>
						Tìm kiếm
					</button>
					<button type="button" onClick={openCreateEmployee}>
						Thêm nhân viên
					</button>
				</div>
			</div>
			{employeeFormOpen ? (
				<div className="modal-backdrop">
					<div className="modal">
						<div className="modal-header">
							<h3>
								{employeeEditingId ? "Cập nhật nhân viên" : "Thêm nhân viên"}
							</h3>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setEmployeeFormOpen(false);
									resetEmployeeForm();
								}}
							>
								Đóng
							</button>
						</div>
						<div className="form-grid">
							<div className="form-group">
								<label>Họ tên *</label>
								<input
									value={employeeForm.ho_ten}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											ho_ten: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Email *</label>
								<input
									type="email"
									value={employeeForm.email}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											email: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>{employeeEditingId ? "Mật khẩu" : "Mật khẩu *"}</label>
								<input
									type="password"
									value={employeeForm.mat_khau}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											mat_khau: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Số điện thoại</label>
								<input
									value={employeeForm.so_dien_thoai}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											so_dien_thoai: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Chức vụ</label>
								<input
									value={employeeForm.chuc_vu}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											chuc_vu: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Phòng ban ID</label>
								<select
									value={employeeForm.phong_ban_id}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											phong_ban_id: event.target.value,
										})
									}
								>
									<option value="">Chọn phòng ban</option>
									{employeeDepartments.map((department) => (
										<option key={department.id} value={department.id}>
											{department.ten_phong}
										</option>
									))}
								</select>
							</div>
							<div className="form-group">
								<label>Trạng thái</label>
								<select
									value={employeeForm.trang_thai_lam_viec}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											trang_thai_lam_viec: event.target.value,
										})
									}
								>
									<option value="Đang làm">Đang làm</option>
									<option value="Tạm nghỉ">Tạm nghỉ</option>
									<option value="Nghỉ việc">Nghỉ việc</option>
								</select>
							</div>
							<div className="form-group">
								<label>Vai trò</label>
								<select
									value={employeeForm.vai_tro}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											vai_tro: event.target.value,
										})
									}
								>
									<option value="Admin">Admin</option>
									<option value="Quản lý">Quản lý</option>
									<option value="Nhân viên">Nhân viên</option>
								</select>
							</div>
						</div>
						{employeeDepartmentsLoading ? (
							<p>Đang tải danh sách phòng ban...</p>
						) : null}
						<div className="form-actions">
							<button type="button" onClick={submitEmployeeForm}>
								{employeeEditingId ? "Lưu cập nhật" : "Lưu nhân viên"}
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setEmployeeFormOpen(false);
									resetEmployeeForm();
								}}
							>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}
			{employeeStatus.message ? (
				<div className={`alert ${employeeStatus.type}`}>
					{employeeStatus.message}
				</div>
			) : null}
			<div className="admin-table">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Họ tên</th>
							<th>Email</th>
							<th>Phòng ban</th>
							<th>Chức vụ</th>
							<th>Trạng thái</th>
							<th>Thao tác</th>
						</tr>
					</thead>
					<tbody>
						{employeeLoading ? (
							<tr>
								<td colSpan="6">Đang tải dữ liệu...</td>
							</tr>
						) : (
							employeeRows.map((row) => (
								<tr
									key={row.id}
									className="row-clickable"
									onClick={() => openViewEmployee(row)}
								>
									<td>{row.id}</td>
									<td>{row.ho_ten}</td>
									<td>{row.email}</td>
									<td>
										{employeeDepartments.find(
											(department) => String(department.id) === String(row.phong_ban_id)
										)?.ten_phong || row.phong_ban_id || "-"}
									</td>
									<td>{row.chuc_vu || "-"}</td>
									<td>{row.trang_thai_lam_viec || "-"}</td>
									<td>
										<div className="row-actions">
											<button
												type="button"
												onClick={(event) => {
													event.stopPropagation();
													openEditEmployee(row);
												}}
											>
												Sửa
											</button>
											<button
												type="button"
												className="ghost"
												onClick={(event) => {
													event.stopPropagation();
													deleteEmployee(row);
												}}
											>
												Xóa
											</button>
										</div>
									</td>
								</tr>
							))
						)}
						{!employeeLoading && employeeRows.length === 0 ? (
							<tr>
								<td colSpan="7">Không có dữ liệu</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
			<div className="pagination">
				<button
					type="button"
					disabled={employeePage <= 1 || employeeLoading}
					onClick={() => fetchEmployees(employeePage - 1)}
				>
					Trang trước
				</button>
				<span>
					Trang {employeePage} / {employeeTotalPages || 1}
				</span>
				<button
					type="button"
					disabled={employeePage >= employeeTotalPages || employeeLoading}
					onClick={() => fetchEmployees(employeePage + 1)}
				>
					Trang sau
				</button>
				<select
					value={employeePageSize}
					onChange={(event) => {
						setEmployeePageSize(Number(event.target.value));
						fetchEmployees(1);
					}}
				>
					<option value={10}>10 / trang</option>
					<option value={20}>20 / trang</option>
					<option value={50}>50 / trang</option>
				</select>
			</div>
			{deleteTarget ? (
				<div className="modal-backdrop">
					<div className="modal confirm">
						<h3>Xác nhận nghỉ việc</h3>
						<p>
							Bạn có chắc muốn chuyển nhân viên {deleteTarget.ho_ten} sang trạng
							thái nghỉ việc?
						</p>
						<div className="form-actions">
							<button type="button" onClick={confirmDeleteEmployee}>
								Xác nhận
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => setDeleteTarget(null)}
							>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}
			{viewEmployee ? (
				<div className="modal-backdrop">
					<div className="modal employee-view">
						<div className="modal-header">
							<div className="employee-view-header">
								{viewEmployee.avatar_url ? (
									<img
										src={viewEmployee.avatar_url}
										alt={viewEmployee.ho_ten}
										className="employee-avatar"
									/>
								) : (
									<div className="employee-avatar placeholder">
										{getInitials(viewEmployee.ho_ten)}
									</div>
								)}
								<div>
									<h3>{employeeForm.ho_ten || viewEmployee.ho_ten}</h3>
									<p>{employeeForm.email || viewEmployee.email || "-"}</p>
								</div>
							</div>
							<button
								type="button"
								className="ghost"
								onClick={() => setViewEmployee(null)}
							>
								Đóng
							</button>
						</div>
						<div className="form-grid">
							<div className="form-group">
								<label>Họ tên</label>
								<input
									value={employeeForm.ho_ten}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											ho_ten: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Email</label>
								<input
									type="email"
									value={employeeForm.email}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											email: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Mật khẩu</label>
								<input
									type="password"
									value={employeeForm.mat_khau}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											mat_khau: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Số điện thoại</label>
								<input
									value={employeeForm.so_dien_thoai}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											so_dien_thoai: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Giới tính</label>
								<select
									value={employeeForm.gioi_tinh}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											gioi_tinh: event.target.value,
										})
									}
								>
									<option value="">Chọn giới tính</option>
									<option value="Nam">Nam</option>
									<option value="Nữ">Nữ</option>
									<option value="Khác">Khác</option>
								</select>
							</div>
							<div className="form-group">
								<label>Ngày sinh</label>
								<input
									type="date"
									value={employeeForm.ngay_sinh}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											ngay_sinh: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Ngày vào làm</label>
								<input
									type="date"
									value={employeeForm.ngay_vao_lam}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											ngay_vao_lam: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Phòng ban</label>
								<select
									value={employeeForm.phong_ban_id}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											phong_ban_id: event.target.value,
										})
									}
								>
									<option value="">Chọn phòng ban</option>
									{employeeDepartments.map((department) => (
										<option key={department.id} value={department.id}>
											{department.ten_phong}
										</option>
									))}
								</select>
							</div>
							<div className="form-group">
								<label>Chức vụ</label>
								<input
									value={employeeForm.chuc_vu}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											chuc_vu: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Trạng thái làm việc</label>
								<select
									value={employeeForm.trang_thai_lam_viec}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											trang_thai_lam_viec: event.target.value,
										})
									}
								>
									<option value="Đang làm">Đang làm</option>
									<option value="Tạm nghỉ">Tạm nghỉ</option>
									<option value="Nghỉ việc">Nghỉ việc</option>
								</select>
							</div>
							<div className="form-group">
								<label>Vai trò</label>
								<select
									value={employeeForm.vai_tro}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											vai_tro: event.target.value,
										})
									}
								>
									<option value="Admin">Admin</option>
									<option value="Quản lý">Quản lý</option>
									<option value="Nhân viên">Nhân viên</option>
								</select>
							</div>
							<div className="form-group">
								<label>Avatar URL</label>
								<input
									value={employeeForm.avatar_url}
									onChange={(event) =>
										setEmployeeForm({
											...employeeForm,
											avatar_url: event.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="form-actions">
							<button
								type="button"
								onClick={async () => {
									await submitEmployeeForm();
									setViewEmployee(null);
								}}
							>
								Lưu cập nhật
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => setViewEmployee(null)}
							>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
}

export default EmployeesPage;
