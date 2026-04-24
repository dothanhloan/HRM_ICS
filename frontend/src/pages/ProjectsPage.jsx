import React, { useEffect } from "react";

function ProjectsPage({
	isAdmin,
	projectRows,
	projectTotal,
	projectQuery,
	projectStatusFilter,
	projectStatus,
	projectLoading,
	projectPage,
	projectPageSize,
	projectTotalPages,
	projectFormOpen,
	projectEditingId,
	projectForm,
	projectEmployees,
	projectEmployeesLoading,
	projectDepartments,
	projectDepartmentsLoading,
	projectFormStatus,
	projectDeleteTarget,
	setProjectQuery,
	setProjectStatusFilter,
	setProjectPageSize,
	setProjectFormOpen,
	setProjectForm,
	resetProjectForm,
	fetchProjects,
	openCreateProject,
	openEditProject,
	submitProjectForm,
	requestDeleteProject,
	confirmDeleteProject,
	setProjectDeleteTarget,
}) {
	const projectGroupOptions = [
		"Triển khai",
		"Nâng cấp",
		"Bảo trì",
		"Nghiên cứu",
		"Khác",
	];
	const priorityOptions = ["Thấp", "Trung bình", "Cao"];

	useEffect(() => {
		fetchProjects(1);
	}, []);

	return (
		<section className="admin-section">
			<div className="admin-section-header">
				<div>
					<h2>Danh sách dự án</h2>
					<p>Tổng số: {projectTotal} dự án</p>
				</div>
				<div className="admin-actions">
					<input
						type="search"
						placeholder="Tìm theo tên dự án hoặc leader"
						value={projectQuery}
						onChange={(event) => setProjectQuery(event.target.value)}
					/>
					<select
						value={projectStatusFilter}
						onChange={(event) => setProjectStatusFilter(event.target.value)}
					>
						<option value="">Tất cả trạng thái</option>
						<option value="Chưa bắt đầu">Chưa bắt đầu</option>
						<option value="Đang thực hiện">Đang thực hiện</option>
						<option value="Đã hoàn thành">Đã hoàn thành</option>
						<option value="Trễ hạn">Trễ hạn</option>
					</select>
					<button type="button" onClick={() => fetchProjects(1)}>
						Tìm kiếm
					</button>
					{isAdmin ? (
						<button type="button" onClick={openCreateProject}>
							Thêm mới dự án
						</button>
					) : null}
				</div>
			</div>
			{projectFormOpen ? (
				<div className="modal-backdrop">
					<div className="modal">
						<div className="modal-header">
							<h3>{projectEditingId ? "Cập nhật dự án" : "Tạo dự án"}</h3>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setProjectFormOpen(false);
									resetProjectForm();
								}}
							>
								Đóng
							</button>
						</div>
						<div className="form-grid">
							<div className="form-group">
								<label>Tên dự án *</label>
								<input
									value={projectForm.ten_du_an}
									onChange={(event) =>
										setProjectForm({
											...projectForm,
											ten_du_an: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Nhóm dự án</label>
								<select
									value={projectForm.nhom_du_an}
									onChange={(event) =>
										setProjectForm({
											...projectForm,
											nhom_du_an: event.target.value,
										})
									}
								>
									<option value="">Chọn nhóm dự án</option>
									{projectGroupOptions.map((item) => (
										<option key={item} value={item}>
											{item}
										</option>
									))}
								</select>
							</div>
							<div className="form-group">
								<label>Phòng ban</label>
								<select
									value={projectForm.phong_ban}
									onChange={(event) =>
										setProjectForm({
											...projectForm,
											phong_ban: event.target.value,
										})
									}
								>
									<option value="">Chọn phòng ban</option>
									{projectDepartments.map((department) => (
										<option key={department.id} value={department.ten_phong}>
											{department.ten_phong}
										</option>
									))}
								</select>
							</div>
							<div className="form-group">
								<label>Mức độ ưu tiên</label>
								<select
									value={projectForm.muc_do_uu_tien}
									onChange={(event) =>
										setProjectForm({
											...projectForm,
											muc_do_uu_tien: event.target.value,
										})
									}
								>
									<option value="">Chọn mức độ</option>
									{priorityOptions.map((item) => (
										<option key={item} value={item}>
											{item}
										</option>
									))}
								</select>
							</div>
							<div className="form-group">
								<label>Ngày bắt đầu *</label>
								<input
									type="date"
									value={projectForm.ngay_bat_dau}
									onChange={(event) =>
										setProjectForm({
											...projectForm,
											ngay_bat_dau: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Ngày kết thúc *</label>
								<input
									type="date"
									value={projectForm.ngay_ket_thuc}
									onChange={(event) =>
										setProjectForm({
											...projectForm,
											ngay_ket_thuc: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Trưởng dự án *</label>
								<select
									value={projectForm.lead_id}
									onChange={(event) =>
										setProjectForm({
											...projectForm,
											lead_id: event.target.value,
										})
									}
								>
									<option value="">Chọn trưởng dự án</option>
									{projectEmployees.map((employee) => (
										<option key={employee.id} value={employee.id}>
											{employee.ho_ten} ({employee.email})
										</option>
									))}
								</select>
							</div>
							<div className="form-group">
								<label>Trạng thái</label>
								<select
									value={projectForm.trang_thai_duan}
									onChange={(event) =>
										setProjectForm({
											...projectForm,
											trang_thai_duan: event.target.value,
										})
									}
								>
									<option value="Chưa bắt đầu">Chưa bắt đầu</option>
									<option value="Đang thực hiện">Đang thực hiện</option>
									<option value="Đã hoàn thành">Đã hoàn thành</option>
									<option value="Trễ hạn">Trễ hạn</option>
								</select>
							</div>
							<div className="form-group">
								<label>Mô tả *</label>
								<textarea
									rows="3"
									value={projectForm.mo_ta}
									onChange={(event) =>
										setProjectForm({
											...projectForm,
											mo_ta: event.target.value,
										})
									}
								/>
							</div>
						</div>
						{projectEmployeesLoading || projectDepartmentsLoading ? (
							<p>Đang tải danh sách liên quan...</p>
						) : null}
						{projectFormStatus.message ? (
							<div className={`alert ${projectFormStatus.type}`}>
								{projectFormStatus.message}
							</div>
						) : null}
						<div className="form-actions">
							<button type="button" onClick={submitProjectForm}>
								{projectEditingId ? "Lưu cập nhật" : "Lưu dự án"}
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setProjectFormOpen(false);
									resetProjectForm();
								}}
							>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}
			{projectStatus.message ? (
				<div className={`alert ${projectStatus.type}`}>
					{projectStatus.message}
				</div>
			) : null}
			<div className="admin-table">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Tên dự án</th>
								<th>Trưởng dự án</th>
							<th>Số thành viên</th>
							<th>Nhóm</th>
							<th>Trạng thái</th>
							<th>Ngày bắt đầu</th>
							<th>Ngày kết thúc</th>
							{isAdmin ? <th>Thao tác</th> : null}
						</tr>
					</thead>
					<tbody>
						{projectLoading ? (
							<tr>
								<td colSpan={isAdmin ? 9 : 8}>Đang tải dữ liệu...</td>
							</tr>
						) : (
							projectRows.map((row) => (
								<tr key={row.id}>
									<td>{row.id}</td>
									<td>{row.ten_du_an}</td>
									<td>{row.lead_name || "-"}</td>
									<td>{row.so_thanh_vien ?? 0}</td>
									<td>{row.nhom_du_an || "-"}</td>
									<td>{row.trang_thai_duan || "-"}</td>
									<td>{row.ngay_bat_dau || "-"}</td>
									<td>{row.ngay_ket_thuc || "-"}</td>
									{isAdmin ? (
										<td>
											<div className="row-actions">
												<button type="button" onClick={() => openEditProject(row)}>
													Sửa
												</button>
												<button
													type="button"
													className="ghost"
													onClick={() => requestDeleteProject(row)}
												>
													Xóa
												</button>
											</div>
										</td>
									) : null}
								</tr>
							))
						)}
						{!projectLoading && projectRows.length === 0 ? (
							<tr>
								<td colSpan={isAdmin ? 9 : 8}>Không có dữ liệu</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
			<div className="pagination">
				<button
					type="button"
					disabled={projectPage <= 1 || projectLoading}
					onClick={() => fetchProjects(projectPage - 1)}
				>
					Trang trước
				</button>
				<span>
					Trang {projectPage} / {projectTotalPages || 1}
				</span>
				<button
					type="button"
					disabled={projectPage >= projectTotalPages || projectLoading}
					onClick={() => fetchProjects(projectPage + 1)}
				>
					Trang sau
				</button>
				<select
					value={projectPageSize}
					onChange={(event) => {
						setProjectPageSize(Number(event.target.value));
						fetchProjects(1);
					}}
				>
					<option value={10}>10 / trang</option>
					<option value={20}>20 / trang</option>
					<option value={50}>50 / trang</option>
				</select>
			</div>
			{projectDeleteTarget ? (
				<div className="modal-backdrop">
					<div className="modal confirm">
						<h3>Xác nhận xóa dự án</h3>
						<p>Bạn có chắc muốn xóa dự án {projectDeleteTarget.ten_du_an}?</p>
						<div className="form-actions">
							<button type="button" onClick={confirmDeleteProject}>
								Xác nhận
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => setProjectDeleteTarget(null)}
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

export default ProjectsPage;
