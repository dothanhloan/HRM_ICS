import React, { useEffect, useMemo, useState } from "react";

function ProjectsPage({
	isAdmin,
	projectRows,
	projectTotal,
	projectQuery,
	projectStatusFilter,
	projectPriorityFilter,
	projectLeadFilter,
	projectStatus,
	projectLoading,
	projectPage,
	projectPageSize,
	projectTotalPages,
	projectFormOpen,
	projectEditingId,
	projectFormReadOnly,
	projectForm,
	projectEmployees,
	projectEmployeesLoading,
	projectDepartments,
	projectDepartmentsLoading,
	projectFormStatus,
	projectDeleteTarget,
	setProjectQuery,
	setProjectStatusFilter,
	setProjectPriorityFilter,
	setProjectLeadFilter,
	setProjectPageSize,
	setProjectFormOpen,
	setProjectForm,
	resetProjectForm,
	fetchProjects,
	fetchProjectEmployees,
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

	const leadOptions = useMemo(() => {
		return projectEmployees.map((employee) => ({
			id: String(employee.id),
			name: employee.ho_ten || employee.email || `Nhân viên #${employee.id}`,
		}));
	}, [projectEmployees]);

	const getInitials = (name) =>
		String(name || "?")
			.trim()
			.split(/\s+/)
			.slice(-2)
			.map((part) => part.charAt(0).toUpperCase())
			.join("");

	const getPriorityClass = (priority) => {
		const normalized = String(priority || "").toLowerCase();
		if (normalized.includes("cao")) return "high";
		if (normalized.includes("trung")) return "medium";
		return "low";
	};

	const getProjectProgress = (row) => Number(row.tien_do ?? row.tien_do_du_an ?? 100);

	const resetProjectFilters = () => {
		setProjectQuery("");
		setProjectStatusFilter("");
		setProjectPriorityFilter("");
		setProjectLeadFilter("");
		fetchProjects(1, {
			projectQuery: "",
			projectStatusFilter: "",
			projectPriorityFilter: "",
			projectLeadFilter: "",
		});
	};

	const closeProjectForm = () => {
		setProjectFormOpen(false);
		resetProjectForm();
	};

	const openProjectInfo = (row) => {
		openEditProject(row, true);
	};

	useEffect(() => {
		fetchProjects(1);
		fetchProjectEmployees();
	}, []);

	const [projectView, setProjectView] = useState("table");

	const statusCounts = useMemo(() => {
		const normalize = (value) =>
			String(value || "")
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");
		return projectRows.reduce(
			(acc, row) => {
				const status = normalize(row.trang_thai_duan);
				if (status.includes("dang thuc hien")) {
					acc.inProgress += 1;
				} else if (status.includes("da hoan thanh")) {
					acc.completed += 1;
				} else if (status.includes("tre han")) {
					acc.overdue += 1;
				} else if (status.includes("chua bat dau")) {
					acc.notStarted += 1;
				}
				return acc;
			},
			{ inProgress: 0, completed: 0, overdue: 0, notStarted: 0 }
		);
	}, [projectRows]);

	const statusClassMap = useMemo(
		() => ({
			"Chưa bắt đầu": "status-notstarted",
			"Chua bat dau": "status-notstarted",
			"Đang thực hiện": "status-inprogress",
			"Dang thuc hien": "status-inprogress",
			"Đã hoàn thành": "status-complete",
			"Da hoan thanh": "status-complete",
			"Trễ hạn": "status-overdue",
			"Tre han": "status-overdue",
		}),
		[]
	);

	return (
		<section className="admin-section project-page">
			<div className="project-hero">
				<div className="project-hero-content">
					<h2>Quản lý dự án</h2>
					<p>Theo dõi tiến độ dự án và điều phối nguồn lực</p>
				</div>
			</div>

			<div className="admin-section-header">
				<div className="task-header-title">
					<h3>Danh sách dự án</h3>
					<p>Tổng số: {projectTotal} dự án</p>
					<span className="task-scope-pill">
						{isAdmin
							? "Admin xem tất cả dự án"
							: "Nhân viên chỉ xem dự án mình phụ trách"}
					</span>
				</div>
				<div className="header-actions task-header-actions">
					<div className="admin-actions task-filters">
						<input
							type="search"
							placeholder="Tìm kiếm tên dự án..."
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
						<select
							value={projectPriorityFilter}
							onChange={(event) => setProjectPriorityFilter(event.target.value)}
						>
							<option value="">Tất cả ưu tiên</option>
							{priorityOptions.map((item) => (
								<option key={item} value={item}>
									{item}
								</option>
							))}
						</select>
						<select
							value={projectLeadFilter}
							onChange={(event) => setProjectLeadFilter(event.target.value)}
						>
							<option value="">Tất cả lead</option>
							{leadOptions.map((lead) => (
								<option key={lead.id} value={lead.id}>
									{lead.name}
								</option>
							))}
						</select>
						<button type="button" className="task-filter-button" onClick={() => fetchProjects(1)}>
							Tìm kiếm
						</button>
						<button type="button" className="task-filter-button" onClick={resetProjectFilters}>
							Đặt lại
						</button>
						{isAdmin ? (
							<button type="button" className="task-create-button" onClick={openCreateProject}>
								Tạo dự án
							</button>
						) : null}
					</div>
					<div className="view-tabs task-view-tabs">
						<button
							type="button"
							className={projectView === "table" ? "active" : ""}
							onClick={() => setProjectView("table")}
						>
							Table
						</button>
						<button
							type="button"
							className={projectView === "card" ? "active" : ""}
							onClick={() => setProjectView("card")}
						>
							Card
						</button>
					</div>
				</div>
			</div>
			<div className="project-summary task-summary">
				<div className="project-stat-card task-stat-card total">
					<span>Tổng dự án</span>
					<strong>{projectTotal}</strong>
					<small>Đang hiển thị {projectRows.length} dự án</small>
				</div>
				<div className="project-stat-card task-stat-card active">
					<span>Đang thực hiện</span>
					<strong>{statusCounts.inProgress}</strong>
					<small>Ưu tiên theo dõi</small>
				</div>
				<div className="project-stat-card task-stat-card done">
					<span>Đã hoàn thành</span>
					<strong>{statusCounts.completed}</strong>
					<small>Đã nghiệm thu</small>
				</div>
				<div className="project-stat-card task-stat-card late">
					<span>Trễ hạn</span>
					<strong>{statusCounts.overdue}</strong>
					<small>Cần xử lý</small>
				</div>
			</div>

			{projectFormOpen ? (
				<div className="modal-backdrop">
					<div className={`modal ${projectFormReadOnly ? "project-info-modal" : ""}`}>
						<div className="modal-header">
							<h3>{projectFormReadOnly ? "Thông tin dự án" : projectEditingId ? "Cập nhật dự án" : "Tạo dự án"}</h3>
							<button
								type="button"
								className="modal-icon-close"
								onClick={closeProjectForm}
								aria-label="Đóng"
							>
								×
							</button>
						</div>
						<div className="form-grid">
							<div className="form-group">
								<label>Tên dự án *</label>
								<input
									readOnly={projectFormReadOnly}
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
									disabled={projectFormReadOnly}
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
									disabled={projectFormReadOnly}
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
									disabled={projectFormReadOnly}
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
									readOnly={projectFormReadOnly}
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
									readOnly={projectFormReadOnly}
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
									disabled={projectFormReadOnly}
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
								<label>Mô tả *</label>
								<textarea
									readOnly={projectFormReadOnly}
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
							{projectFormReadOnly ? null : (
								<button type="button" onClick={submitProjectForm}>
									{projectEditingId ? "Lưu cập nhật" : "Lưu dự án"}
								</button>
							)}
							<button
								type="button"
								className="ghost"
								onClick={closeProjectForm}
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
			{projectView === "card" ? (
				<div className="project-card-grid">
					{projectLoading ? (
						<div className="project-empty">Đang tải dữ liệu...</div>
					) : projectRows.length === 0 ? (
						<div className="project-empty">Không có dữ liệu</div>
					) : (
						projectRows.map((row) => {
							const progress = getProjectProgress(row);
							return (
								<div
									className="project-card project-card-clickable"
									key={row.id}
									role="button"
									tabIndex={0}
									onClick={() => openProjectInfo(row)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											openProjectInfo(row);
										}
									}}
								>
									<div className="project-card-topline" />
									<div className="project-card-title-row">
										<h4>{row.ten_du_an}</h4>
										<span className={`project-priority ${getPriorityClass(row.muc_do_uu_tien)}`}>
											{row.muc_do_uu_tien || "Thấp"}
										</span>
									</div>
									<p className="project-card-desc">{row.mo_ta || row.nhom_du_an || "Chưa có mô tả"}</p>
									<div className="project-lead-box">
										<div className="project-lead-avatar">{getInitials(row.lead_name)}</div>
										<div>
											<span>Lead dự án</span>
											<strong>{row.lead_name || "-"}</strong>
										</div>
									</div>
									<div className="project-card-info-grid">
										<div>
											<span className="project-info-icon">◆</span>
											<span>{row.nhom_du_an || "Khác"}</span>
										</div>
										<div>
											<span className="project-info-icon">▣</span>
											<span>{row.phong_ban || "Chưa phân"}</span>
										</div>
										<div>
											<span className="project-info-icon">▣</span>
											<strong>{row.ngay_bat_dau || "-"}</strong>
										</div>
										<div>
											<span className="project-info-icon">▣</span>
											<strong>{row.ngay_ket_thuc || "-"}</strong>
										</div>
									</div>
									<div className="project-progress">
										<div>
											<span>Tiến độ</span>
											<strong>{progress}%</strong>
										</div>
										<div className="project-progress-track">
											<span style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
										</div>
									</div>
									<div className="project-status-bar">{row.trang_thai_duan || "Đang thực hiện"}</div>
									<div className="project-card-actions">
										<button
											type="button"
											className="project-view-button"
											onClick={(event) => {
												event.stopPropagation();
												openProjectInfo(row);
											}}
										>
											Xem
										</button>
										{isAdmin ? (
											<button
												type="button"
												className="project-edit-button"
												onClick={(event) => {
													event.stopPropagation();
													openEditProject(row);
												}}
											>
												Sửa
											</button>
										) : null}
									</div>
								</div>
							);
						})
					)}
				</div>
			) : (
				<div className="admin-table project-table task-table">
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Tên dự án</th>
								<th>Trưởng dự án</th>
								<th>Nhóm</th>
								<th>Trạng thái</th>
								<th>Ngày bắt đầu</th>
								<th>Ngày kết thúc</th>
								<th>Thao tác</th>
							</tr>
						</thead>
						<tbody>
							{projectLoading ? (
								<tr>
									<td colSpan="8">Đang tải dữ liệu...</td>
								</tr>
							) : (
								projectRows.map((row) => (
									<tr
										key={row.id}
										className="project-row-clickable"
										tabIndex={0}
										onClick={() => openProjectInfo(row)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												openProjectInfo(row);
											}
										}}
									>
										<td>
											<span className="data-emphasis">{row.id}</span>
										</td>
										<td>
											<span className="data-chip">{row.ten_du_an}</span>
										</td>
										<td>
											<span className="data-chip muted">{row.lead_name || "-"}</span>
										</td>
										<td>
											<span className="data-chip">{row.nhom_du_an || "-"}</span>
										</td>
										<td>
											<span
												className={`status-pill ${
													statusClassMap[row.trang_thai_duan] || "status-muted"
												}`}
											>
												{row.trang_thai_duan || "-"}
											</span>
										</td>
										<td>
											<span className="data-emphasis">{row.ngay_bat_dau || "-"}</span>
										</td>
										<td>
											<span className="data-emphasis">{row.ngay_ket_thuc || "-"}</span>
										</td>
										<td onClick={(event) => event.stopPropagation()}>
											<div className="row-actions">
												<button type="button" onClick={() => openProjectInfo(row)}>
													Xem
												</button>
												{isAdmin ? (
													<>
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
													</>
												) : null}
											</div>
										</td>
									</tr>
								))
							)}
							{!projectLoading && projectRows.length === 0 ? (
								<tr>
									<td colSpan="8">Không có dữ liệu</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>
			)}
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
