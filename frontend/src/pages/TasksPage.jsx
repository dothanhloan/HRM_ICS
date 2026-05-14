import React, { useEffect, useMemo, useState } from "react";

function TasksPage({
	user,
	isAdmin,
	taskRows,
	taskTotal,
	taskQuery,
	taskStatusFilter,
	taskSort,
	taskStatus,
	taskLoading,
	taskPage,
	taskPageSize,
	taskTotalPages,
	taskFormOpen,
	taskFormStatus,
	taskAssignees,
	taskFollowers,
	taskEmployees,
	taskProjects,
	taskProjectsLoading,
	taskEmployeesLoading,
	taskProgressOpen,
	taskProgressForm,
	taskForm,
	taskEditingId,
	setTaskQuery,
	setTaskStatusFilter,
	setTaskSort,
	setTaskFormOpen,
	setTaskForm,
	setTaskAssignees,
	setTaskFollowers,
	setTaskProgressForm,
	setTaskProgressOpen,
	resetTaskForm,
	fetchTasks,
	fetchTaskEmployees,
	openCreateTask,
	toggleAssignee,
	toggleFollower,
	handleTaskUploadChange,
	submitTaskForm,
	openProgressModal,
	submitTaskProgress,
	setTaskPageSize,
	setTaskProgressTarget,
	taskDetailOpen,
	taskDetailTarget,
	submitTaskStepForm,
	submitTaskStepUpdate,
	deleteTaskStep,
	openTaskDetail,
	closeTaskDetail,
	taskWorkflowSteps,
	taskWorkflowLoading,
	taskHistoryLogs,
	taskHistoryLoading,
	taskUploadFile,
}) {
	useEffect(() => {
		fetchTasks(1);
	}, []);

	const [subtaskOpen, setSubtaskOpen] = useState(false);
	const [subtaskEditingId, setSubtaskEditingId] = useState(null);
	const [subtaskStatus, setSubtaskStatus] = useState({ type: "", message: "" });
	const [subtaskForm, setSubtaskForm] = useState({
		cong_viec_id: "",
		ten_buoc: "",
		mo_ta: "",
		trang_thai: "Chưa bắt đầu",
		ngay_bat_dau: "",
		ngay_ket_thuc: "",
		tai_lieu_link: "",
		tai_lieu_file: "",
	});
	const [subtaskRecipients, setSubtaskRecipients] = useState([]);
	const [showRecipientPicker, setShowRecipientPicker] = useState(false);

	const openSubtaskModal = (step = null) => {
		if (!taskDetailTarget?.id) {
			return;
		}
		setSubtaskStatus({ type: "", message: "" });
		setSubtaskForm({
			cong_viec_id: taskDetailTarget.id,
			ten_buoc: step?.ten_buoc || "",
			mo_ta: step?.mo_ta || "",
			trang_thai: step?.trang_thai || "Chưa bắt đầu",
			ngay_bat_dau: step?.ngay_bat_dau || taskDetailTarget.ngay_bat_dau || "",
			ngay_ket_thuc: step?.ngay_ket_thuc || taskDetailTarget.han_hoan_thanh || "",
			tai_lieu_link: step?.tai_lieu_link || "",
			tai_lieu_file: step?.tai_lieu_file || "",
		});
		setSubtaskRecipients(step ? [] : []);
		setShowRecipientPicker(false);
		setSubtaskEditingId(step?.id || null);
		setSubtaskOpen(true);
	};

	const closeSubtaskModal = () => {
		setSubtaskOpen(false);
		setShowRecipientPicker(false);
		setSubtaskEditingId(null);
	};

	const toggleSubtaskRecipient = (employeeId) => {
		setSubtaskRecipients((prev) =>
			prev.includes(employeeId)
				? prev.filter((id) => id !== employeeId)
				: [...prev, employeeId]
		);
	};

	const handleSubtaskFileChange = (event) => {
		const fileNames = Array.from(event.target.files || []).map((file) => file.name);
		setSubtaskForm((prev) => ({
			...prev,
			tai_lieu_file: fileNames.join(", "),
		}));
	};

	const handleSubmitSubtask = async () => {
		setSubtaskStatus({ type: "", message: "" });
		if (!subtaskForm.ten_buoc.trim()) {
			setSubtaskStatus({ type: "error", message: "Vui lòng nhập tên bước/giai đoạn." });
			return;
		}
		try {
			const payload = {
				...subtaskForm,
				cong_viec_id: Number(subtaskForm.cong_viec_id),
				nguoi_nhan_ids: subtaskRecipients,
			};
			if (subtaskEditingId) {
				await submitTaskStepUpdate(subtaskEditingId, payload);
			} else {
				await submitTaskStepForm(payload);
			}
			setSubtaskOpen(false);
			setSubtaskRecipients([]);
			setSubtaskEditingId(null);
			setSubtaskStatus({
				type: "success",
				message: subtaskEditingId ? "Cập nhật bước quy trình thành công." : "Thêm bước quy trình thành công.",
			});
		} catch (error) {
			setSubtaskStatus({ type: "error", message: error.message });
		}
	};

	const handleDeleteSubtask = async (step) => {
		const confirmed = window.confirm(`Xóa bước quy trình "${step.ten_buoc}"?`);
		if (!confirmed) {
			return;
		}
		try {
			await deleteTaskStep(step.id, step.cong_viec_id);
			if (subtaskEditingId === step.id) {
				closeSubtaskModal();
			}
		} catch (error) {
			setSubtaskStatus({ type: "error", message: error.message });
		}
	};

	const statusCounts = useMemo(() => {
		const normalize = (value) =>
			String(value || "")
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");
		return taskRows.reduce(
			(acc, row) => {
				const status = normalize(row.trang_thai);
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
	}, [taskRows]);

	const workflowProgress = useMemo(() => {
		const normalize = (value) =>
			String(value || "")
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");
		if (!taskWorkflowSteps || taskWorkflowSteps.length === 0) {
			return 0;
		}
		const completed = taskWorkflowSteps.filter((step) => {
			const status = normalize(step.trang_thai);
			return status.includes("hoan thanh") || status.includes("completed") || status.includes("done");
		}).length;
		return Math.min(100, Math.round((completed / taskWorkflowSteps.length) * 100));
	}, [taskWorkflowSteps]);

	const formatHistoryTime = (value) => {
		if (!value) {
			return "-";
		}
		const dateValue = new Date(value);
		if (Number.isNaN(dateValue.getTime())) {
			return String(value);
		}
		return new Intl.DateTimeFormat("vi-VN", {
			dateStyle: "short",
			timeStyle: "short",
		}).format(dateValue);
	};

	const selectedProject = useMemo(() => {
		const selectedId = taskForm.du_an_id ? String(taskForm.du_an_id) : "";
		if (!selectedId) {
			return null;
		}
		return taskProjects.find((project) => String(project.id) === selectedId) || null;
	}, [taskForm.du_an_id, taskProjects]);

	const isProjectLead = useMemo(() => {
		if (!selectedProject || !user?.id) {
			return false;
		}
		const leadId = selectedProject.lead_id ?? selectedProject.truong_du_an_id;
		return leadId ? String(leadId) === String(user.id) : false;
	}, [selectedProject, user?.id]);

	const canAssignOthers = isAdmin || isProjectLead;
	const canSaveTask = !taskProjectsLoading && !taskEmployeesLoading;

	useEffect(() => {
		if (isAdmin) {
			return;
		}
		if (canAssignOthers) {
			fetchTaskEmployees(true);
			return;
		}
		if (user?.id) {
			setTaskAssignees([user.id]);
		}
	}, [isAdmin, canAssignOthers, user?.id]);

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
		<section className="admin-section task-page">
			<div className="task-hero">
				<div className="task-hero-content">
					<h2>Quản lý công việc</h2>
					<p>Theo dõi tiến độ công việc và điều phối nguồn lực</p>
				</div>
			</div>

			<div className="admin-section-header">
				<div className="task-header-title">
					<h3>Danh sách công việc</h3>
					<p>Tổng số: {taskTotal} công việc</p>
					<span className="task-scope-pill">
						{isAdmin
							? "Admin xem tất cả công việc"
							: "Nhân viên chỉ xem công việc của mình"}
					</span>
				</div>
				<div className="header-actions task-header-actions">
					<div className="admin-actions task-filters">
						<input
							type="search"
							placeholder="Tìm kiếm tên công việc..."
							value={taskQuery}
							onChange={(event) => setTaskQuery(event.target.value)}
						/>
						<select
							value={taskStatusFilter}
							onChange={(event) => setTaskStatusFilter(event.target.value)}
						>
							<option value="">Tất cả trạng thái</option>
						<option value="Chưa bắt đầu">Chưa bắt đầu</option>
						<option value="Đang thực hiện">Đang thực hiện</option>
						<option value="Đã hoàn thành">Đã hoàn thành</option>
						<option value="Trễ hạn">Trễ hạn</option>
						</select>
						<select value={taskSort} onChange={(event) => setTaskSort(event.target.value)}>
							<option value="deadline">Sắp xếp theo deadline</option>
							<option value="status">Sắp xếp theo trạng thái</option>
						</select>
						<button
							type="button"
							className="task-filter-button"
							onClick={() => fetchTasks(1)}
						>
							Tìm kiếm
						</button>
						<button
							type="button"
							className="task-create-button"
							onClick={openCreateTask}
						>
							Tạo công việc
						</button>
					</div>
				</div>
			</div>
			<div className="task-summary">
				<div className="task-stat-card total">
					<span>Tổng công việc</span>
					<strong>{taskTotal}</strong>
					<small>Đang hiển thị {taskRows.length} công việc</small>
				</div>
				<div className="task-stat-card active">
					<span>Đang thực hiện</span>
					<strong>{statusCounts.inProgress}</strong>
					<small>Ưu tiên theo dõi</small>
				</div>
				<div className="task-stat-card done">
					<span>Đã hoàn thành</span>
					<strong>{statusCounts.completed}</strong>
					<small>Đã nghiệm thu</small>
				</div>
				<div className="task-stat-card late">
					<span>Trễ hạn</span>
					<strong>{statusCounts.overdue}</strong>
					<small>Cần xử lý</small>
				</div>
			</div>

			{taskFormOpen ? (
				<div className="modal-backdrop">
					<div className="modal">
						<div className="modal-header">
							<h3>{taskEditingId ? "Cập nhật công việc" : "Tạo công việc"}</h3>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setTaskFormOpen(false);
									resetTaskForm();
								}}
							>
								Đóng
							</button>
						</div>
						<div className="form-grid">
							<div className="form-group">
								<label>Tên công việc *</label>
								<input
									value={taskForm.ten_cong_viec}
									onChange={(event) =>
										setTaskForm({
											...taskForm,
											ten_cong_viec: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Dự án</label>
								<select
									value={taskForm.du_an_id}
									onChange={(event) => {
										const nextProject = taskProjects.find(
											(project) => String(project.id) === String(event.target.value)
										);
										setTaskForm({
											...taskForm,
											du_an_id: event.target.value,
										});
										if (!isAdmin && nextProject?.lead_id && String(nextProject.lead_id) === String(user?.id)) {
											fetchTaskEmployees(true);
										}
									}}
								>
									<option value="">Chọn dự án</option>
									{taskProjects.map((project) => (
										<option key={project.id} value={project.id}>
											{project.ten_du_an}
										</option>
									))}
								</select>
							</div>
								<div className="form-group">
									<label>Người giao</label>
									<select
										value={taskForm.nguoi_giao_id}
										disabled={!isAdmin}
										onChange={(event) =>
											setTaskForm({
												...taskForm,
												nguoi_giao_id: event.target.value,
											})
										}
									>
										<option value="">Chọn người giao</option>
										{taskEmployees.map((employee) => (
											<option key={employee.id} value={employee.id}>
												{employee.ho_ten}
											</option>
										))}
									</select>
								</div>
							<div className="form-group">
								<label>Ngày bắt đầu *</label>
								<input
									type="date"
									value={taskForm.ngay_bat_dau}
									onChange={(event) =>
										setTaskForm({
											...taskForm,
											ngay_bat_dau: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Hạn chót *</label>
								<input
									type="date"
									value={taskForm.han_hoan_thanh}
									onChange={(event) =>
										setTaskForm({
											...taskForm,
											han_hoan_thanh: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>Ưu tiên</label>
								<select
									value={taskForm.muc_do_uu_tien}
									onChange={(event) =>
										setTaskForm({
											...taskForm,
											muc_do_uu_tien: event.target.value,
										})
									}
								>
									<option value="Thấp">Thấp</option>
									<option value="Trung bình">Trung bình</option>
									<option value="Cao">Cao</option>
								</select>
							</div>
							<div className="form-group">
								<label>Link tài liệu</label>
								<input
									value={taskForm.tai_lieu_cv}
									onChange={(event) =>
										setTaskForm({
											...taskForm,
											tai_lieu_cv: event.target.value,
										})
									}
								/>
							</div>
							<div className="form-group">
								<label>File dinh kem</label>
								<input type="file" onChange={handleTaskUploadChange} />
								{taskUploadFile ? (
									<p className="helper-text">Da chon: {taskUploadFile.name}</p>
								) : null}
							</div>
							<div className="form-group">
								<label>Mô tả *</label>
								<textarea
									rows="3"
									value={taskForm.mo_ta}
									onChange={(event) =>
										setTaskForm({
											...taskForm,
											mo_ta: event.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="task-member-block">
							<label>Người nhận *</label>
							{canAssignOthers ? (
								<select
									value={taskAssignees[0] || ""}
									onChange={(event) =>
										setTaskAssignees(event.target.value ? [Number(event.target.value)] : [])
									}
								>
									<option value="">Chọn 1 nhân viên</option>
									{taskEmployees.map((employee) => (
										<option key={employee.id} value={employee.id}>
											{employee.ho_ten}
										</option>
									))}
								</select>
							) : (
								<div className="task-member-list">
									<p className="task-member-note">
										{taskEmployees[0]?.ho_ten || "Nhân viên hiện tại"}
									</p>
								</div>
							)}
						</div>
						<div className="task-member-block">
							<label>Người theo dõi</label>
							<select
								value={taskFollowers[0] || ""}
								onChange={(event) =>
									setTaskFollowers(event.target.value ? [Number(event.target.value)] : [])
								}
							>
								<option value="">Chọn 1 nhân viên</option>
								{taskEmployees.map((employee) => (
									<option key={employee.id} value={employee.id}>
										{employee.ho_ten}
									</option>
								))}
							</select>
						</div>
							
						{taskProjectsLoading || taskEmployeesLoading ? (
							<p>Đang tải danh sách liên quan...</p>
						) : null}
						{taskFormStatus.message ? (
							<div className={`alert ${taskFormStatus.type}`}>
								{taskFormStatus.message}
							</div>
						) : null}
						<div className="form-actions">
							<button type="button" onClick={submitTaskForm} disabled={!canSaveTask}>
								{taskEditingId ? "Lưu cập nhật" : "Lưu công việc"}
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setTaskFormOpen(false);
									resetTaskForm();
								}}
							>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}
			{taskStatus.message ? (
				<div className={`alert ${taskStatus.type}`}>
					{taskStatus.message}
				</div>
			) : null}
			<div className="admin-table task-table">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Tên công việc</th>
							<th>Dự án</th>
							<th>Người nhận</th>
							<th>Hạn chót</th>
							<th>Trạng thái</th>
							<th>Thao tác</th>
						</tr>
					</thead>
					<tbody>
						{taskLoading ? (
							<tr>
								<td colSpan="7">Đang tải dữ liệu...</td>
							</tr>
						) : (
							taskRows.map((row) => (
								<tr key={row.id} onClick={() => openTaskDetail(row)} style={{ cursor: "pointer" }}>
									<td>
										<span className="data-emphasis">{row.id}</span>
									</td>
									<td>
										<span className="data-chip">{row.ten_cong_viec}</span>
									</td>
									<td>
										<span className="data-chip">{row.ten_du_an || "-"}</span>
									</td>
									<td>
										<span className="data-chip muted">{row.nguoi_nhan || "-"}</span>
									</td>
									<td>
										<span className="data-emphasis">{row.han_hoan_thanh || "-"}</span>
									</td>
									<td>
										<span
											className={`status-pill ${
												statusClassMap[row.trang_thai] || "status-muted"
											}`}
										>
											{row.trang_thai || "-"}
										</span>
									</td>
									<td onClick={(e) => e.stopPropagation()}>
										<div className="row-actions">
											<button type="button" onClick={() => openProgressModal(row)}>
												Cập nhật
											</button>
										</div>
									</td>
								</tr>
							))
						)}
						{!taskLoading && taskRows.length === 0 ? (
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
					disabled={taskPage <= 1 || taskLoading}
					onClick={() => fetchTasks(taskPage - 1)}
				>
					Trang trước
				</button>
				<span>
					Trang {taskPage} / {taskTotalPages || 1}
				</span>
				<button
					type="button"
					disabled={taskPage >= taskTotalPages || taskLoading}
					onClick={() => fetchTasks(taskPage + 1)}
				>
					Trang sau
				</button>
				<select
					value={taskPageSize}
					onChange={(event) => {
						setTaskPageSize(Number(event.target.value));
						fetchTasks(1);
					}}
				>
					<option value={10}>10 / trang</option>
					<option value={20}>20 / trang</option>
					<option value={50}>50 / trang</option>
				</select>
			</div>
			{taskProgressOpen ? (
				<div className="modal-backdrop">
					<div className="modal">
						<div className="modal-header">
							<h3>Cập nhật tiến độ</h3>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setTaskProgressOpen(false);
									setTaskProgressTarget(null);
								}}
							>
								Đóng
							</button>
						</div>
						<div className="form-grid">
							<div className="form-group">
								<label>Trạng thái</label>
								<select
									value={taskProgressForm.trang_thai}
									onChange={(event) =>
										setTaskProgressForm({
											...taskProgressForm,
											trang_thai: event.target.value,
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
								<label>% Tiến độ</label>
								<input
									type="number"
									min="0"
									max="100"
									value={taskProgressForm.phan_tram}
									onChange={(event) =>
										setTaskProgressForm({
											...taskProgressForm,
											phan_tram: Number(event.target.value),
										})
									}
								/>
							</div>
						</div>
						<div className="form-actions">
							<button type="button" onClick={submitTaskProgress}>
								Lưu cập nhật
							</button>
							<button
								type="button"
								className="ghost"
								onClick={() => {
									setTaskProgressOpen(false);
									setTaskProgressTarget(null);
								}}
							>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}
			{taskDetailOpen && taskDetailTarget ? (
				<div className="modal-backdrop">
					<div className="modal task-detail-modal">
						<div className="modal-header">
							<h3>Thông tin công việc</h3>
							<button
								type="button"
								className="ghost"
								onClick={closeTaskDetail}
							>
								Đóng
							</button>
						</div>
						<div className="task-detail-content">
							{/* Thông tin công việc */}
							<div className="detail-section">
								<div className="section-icon">ℹ️</div>
								<h4>Thông tin công việc</h4>
								<div className="detail-form-grid">
									<div className="form-group">
										<label>Tên công việc</label>
										<input 
											type="text" 
											value={taskForm.ten_cong_viec} 
											onChange={(event) =>
												setTaskForm({
													...taskForm,
													ten_cong_viec: event.target.value,
												})
											} 
										/>
									</div>
									<div className="form-group">
										<label>Mức độ ưu tiên</label>
										<select
											value={taskForm.muc_do_uu_tien}
											onChange={(event) =>
												setTaskForm({
													...taskForm,
													muc_do_uu_tien: event.target.value,
												})
											}
										>
											<option value="Thấp">Thấp</option>
											<option value="Trung bình">Trung bình</option>
											<option value="Cao">Cao</option>
										</select>
									</div>
									<div className="form-group full">
										<label>Mô tả</label>
										<textarea 
											rows="4" 
											value={taskForm.mo_ta} 
											onChange={(event) =>
												setTaskForm({
													...taskForm,
													mo_ta: event.target.value,
												})
											} 
										/>
									</div>
									<div className="form-group">
										<label>Ngày bắt đầu</label>
										<input 
											type="date" 
											value={taskForm.ngay_bat_dau} 
											onChange={(event) =>
												setTaskForm({
													...taskForm,
													ngay_bat_dau: event.target.value,
												})
											} 
										/>
									</div>
									<div className="form-group">
										<label>Hạn hoàn thành</label>
										<input 
											type="date" 
											value={taskForm.han_hoan_thanh} 
											onChange={(event) =>
												setTaskForm({
													...taskForm,
													han_hoan_thanh: event.target.value,
												})
											} 
										/>
									</div>
									<div className="form-group">
										<label>Người giao</label>
										<select
											value={taskForm.nguoi_giao_id}
											onChange={(event) =>
												setTaskForm({
													...taskForm,
													nguoi_giao_id: event.target.value,
												})
											}
										>
											<option value="">Chọn người giao</option>
											{taskEmployees.map((employee) => (
												<option key={employee.id} value={employee.id}>
													{employee.ho_ten}
												</option>
											))}
										</select>
									</div>
									<div className="form-group">
										<label>Phòng ban</label>
										<input 
											type="text" 
											value={taskDetailTarget.phong_ban || ""} 
											disabled 
										/>
									</div>
									<div className="form-group full">
										<label>Trạng thái duyệt</label>
										<input 
											type="text" 
											value={taskDetailTarget.trang_thai_duyet || "Chưa duyệt"} 
											disabled 
										/>
									</div>
									<div className="form-group full">
										<label>Người nhận</label>
										<div className="assignee-pills">
											{taskDetailTarget.nguoi_nhan ? (
												<span className="pill">{taskDetailTarget.nguoi_nhan}</span>
											) : (
												<span className="pill-placeholder">Chưa có người nhận</span>
											)}
										</div>
									</div>
									<div className="form-group full">
										<label>Người theo dõi</label>
										<div className="follower-placeholder">Thêm người theo dõi</div>
									</div>
									<div className="form-group full">
										<label>Tài liệu công việc (Link Driver)</label>
										<input 
											type="text" 
											placeholder="Chưa có link tài liệu" 
											value={taskForm.tai_lieu_cv} 
											onChange={(event) =>
												setTaskForm({
													...taskForm,
													tai_lieu_cv: event.target.value,
												})
											} 
										/>
									</div>
									<div className="form-group full">
										<label>File công việc</label>
										<input
											type="file"
											accept="*/*"
											onChange={handleTaskUploadChange}
										/>
										<div className="file-upload-area">
											<span>File hiện tại</span>
											<span>
												{taskUploadFile?.name || taskForm.tai_lieu_cv?.split("/").pop() || "Chưa có file"}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Tiến độ công việc */}
							<div className="detail-section">
								<div className="section-icon">📊</div>
								<h4>Tiến độ công việc</h4>
								<div className="progress-section">
									<label>Tiến độ:</label>
									<div className="progress-bar">
										<div className="progress-fill" style={{ width: `${workflowProgress}%` }}>{workflowProgress}%</div>
									</div>
									<button type="button" className="btn-add-subtask" onClick={openSubtaskModal}>+ Thêm việc con</button>
									<div className="subtask-list">
										{taskWorkflowLoading ? (
											<div className="subtask-item">
												<span>Đang tải...</span>
											</div>
										) : taskWorkflowSteps && taskWorkflowSteps.length > 0 ? (
											taskWorkflowSteps.map((step) => (
												<div key={step.id} className="subtask-item">
													<span className="status-badge">
														{step.trang_thai || "Chưa bắt đầu"}
													</span>
													<div className="subtask-details">
														<strong>{step.ten_buoc}</strong>
														{step.mo_ta && <p>{step.mo_ta}</p>}
														{(step.ngay_bat_dau || step.ngay_ket_thuc) && (
															<small>
																{step.ngay_bat_dau && `Từ: ${step.ngay_bat_dau}`}
																{step.ngay_bat_dau && step.ngay_ket_thuc && " - "}
																{step.ngay_ket_thuc && `Đến: ${step.ngay_ket_thuc}`}
															</small>
														)}
														<div className="subtask-actions">
															<button type="button" className="btn-subtask-action" onClick={() => openSubtaskModal(step)}>
																Sửa
															</button>
															<button type="button" className="btn-subtask-action danger" onClick={() => handleDeleteSubtask(step)}>
																Xóa
															</button>
														</div>
													</div>
												</div>
											))
										) : (
											<div className="subtask-item">
												<span>Chưa có việc con nào</span>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Lịch sử công việc */}
							<div className="detail-section">
								<div className="section-icon">⏱️</div>
								<h4>Lịch sử công việc</h4>
								<div className="history-timeline">
									{taskHistoryLoading ? (
										<div className="history-item">
											<div className="history-dot">...</div>
											<div className="history-content">
												<p className="history-text">Đang tải lịch sử...</p>
												<small className="history-time">-</small>
											</div>
										</div>
									) : taskHistoryLogs && taskHistoryLogs.length > 0 ? (
										taskHistoryLogs.map((historyItem, index) => (
											<div key={historyItem.id || `${historyItem.cong_viec_id}-${index}`} className="history-item">
												<div className="history-dot">{taskHistoryLogs.length - index}</div>
												<div className="history-content">
													<p className="history-text">{historyItem.mo_ta_thay_doi || "Không có mô tả thay đổi"}</p>
													<small className="history-time">
														{historyItem.nguoi_thay_doi ? `${historyItem.nguoi_thay_doi} • ` : ""}
														{formatHistoryTime(historyItem.thoi_gian)}
													</small>
												</div>
											</div>
										))
									) : (
										<div className="history-item">
											<div className="history-dot">1</div>
											<div className="history-content">
												<p className="history-text">Chưa có lịch sử thay đổi</p>
												<small className="history-time">-</small>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Nút cập nhật tiến độ */}
								<div className="detail-actions">
									<button type="button" onClick={() => submitTaskForm(true)} className="btn-primary">
										Lưu thay đổi
									</button>
									<button 
										type="button" 
										onClick={closeTaskDetail}
										className="btn-secondary"
									>
										Đóng
									</button>
								</div>
						</div>
					</div>
				</div>
			) : null}
			{subtaskOpen ? (
				<div className="modal-backdrop">
					<div className="modal subtask-modal">
						<div className="modal-header">
							<h3>{subtaskEditingId ? "Sửa bước quy trình" : "Thêm bước quy trình"}</h3>
							<button type="button" className="ghost" onClick={closeSubtaskModal}>
								Đóng
							</button>
						</div>
						<div className="form-grid">
							<div className="form-group full">
								<label>Tên bước/giai đoạn</label>
								<input
									type="text"
									value={subtaskForm.ten_buoc}
									onChange={(event) =>
										setSubtaskForm({ ...subtaskForm, ten_buoc: event.target.value })
									}
								/>
							</div>
							<div className="form-group full">
								<label>Mô tả</label>
								<textarea
									rows="3"
									value={subtaskForm.mo_ta}
									onChange={(event) =>
										setSubtaskForm({ ...subtaskForm, mo_ta: event.target.value })
									}
								/>
							</div>
							<div className="form-group full">
								<label>Người nhận</label>
								<div className="subtask-recipient-row">
									<button
										type="button"
										className="task-subtask-button"
										onClick={() => setShowRecipientPicker((prev) => !prev)}
									>
										+ Thêm người nhận
									</button>
									{showRecipientPicker ? (
										<div className="subtask-recipient-picker">
											{taskEmployees.map((employee) => (
												<label key={employee.id} className="task-member-item">
													<input
														type="checkbox"
														checked={subtaskRecipients.includes(employee.id)}
														onChange={() => toggleSubtaskRecipient(employee.id)}
													/>
													<span>{employee.ho_ten}</span>
												</label>
											))}
										</div>
									) : null}
								</div>
								<div className="assignee-pills">
									{subtaskRecipients.length > 0 ? (
										subtaskRecipients.map((id) => {
											const employee = taskEmployees.find((item) => item.id === id);
											return (
												<span key={id} className="pill">
													{employee?.ho_ten || `NV ${id}`}
												</span>
											);
										})
									) : (
										<span className="pill-placeholder">Chưa chọn người nhận</span>
									)}
								</div>
							</div>
							<div className="form-group full">
								<label>Trạng thái</label>
								<select
									value={subtaskForm.trang_thai}
									onChange={(event) =>
										setSubtaskForm({ ...subtaskForm, trang_thai: event.target.value })
									}
								>
									<option value="Chưa bắt đầu">Chưa bắt đầu</option>
									<option value="Đang thực hiện">Đang thực hiện</option>
									<option value="Đã hoàn thành">Đã hoàn thành</option>
								</select>
							</div>
							<div className="form-group">
								<label>Ngày bắt đầu</label>
								<input
									type="date"
									value={subtaskForm.ngay_bat_dau}
									onChange={(event) =>
										setSubtaskForm({ ...subtaskForm, ngay_bat_dau: event.target.value })
									}
								/>
							</div>
							<div className="form-group">
								<label>Ngày kết thúc</label>
								<input
									type="date"
									value={subtaskForm.ngay_ket_thuc}
									onChange={(event) =>
										setSubtaskForm({ ...subtaskForm, ngay_ket_thuc: event.target.value })
									}
								/>
							</div>
							<div className="form-group full">
								<label>Link tài liệu</label>
								<input
									type="url"
									placeholder="https://..."
									value={subtaskForm.tai_lieu_link}
									onChange={(event) =>
										setSubtaskForm({ ...subtaskForm, tai_lieu_link: event.target.value })
									}
								/>
								<small className="helper-text">Link tài liệu tham khảo (Google Drive, Dropbox, v.v.)</small>
							</div>
							<div className="form-group full">
								<label>File tài liệu</label>
								<input type="file" multiple onChange={handleSubtaskFileChange} />
								<small className="helper-text">Chọn một hoặc nhiều file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)</small>
								{subtaskForm.tai_lieu_file ? (
									<p className="helper-text">Đã chọn: {subtaskForm.tai_lieu_file}</p>
								) : null}
							</div>
						</div>
						{subtaskStatus.message ? (
							<div className={`alert ${subtaskStatus.type}`}>{subtaskStatus.message}</div>
						) : null}
						<div className="form-actions">
							<button type="button" onClick={handleSubmitSubtask}>
								{subtaskEditingId ? "Cập nhật bước" : "Thêm bước"}
							</button>
							<button type="button" className="ghost" onClick={closeSubtaskModal}>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
}

export default TasksPage;
