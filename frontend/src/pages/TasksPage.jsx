import React, { useEffect } from "react";

function TasksPage({
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
	setTaskQuery,
	setTaskStatusFilter,
	setTaskSort,
	setTaskFormOpen,
	setTaskForm,
	setTaskProgressForm,
	setTaskProgressOpen,
	resetTaskForm,
	fetchTasks,
	openCreateTask,
	toggleAssignee,
	toggleFollower,
	submitTaskForm,
	openProgressModal,
	submitTaskProgress,
	setTaskPageSize,
	setTaskProgressTarget,
}) {
	useEffect(() => {
		fetchTasks(1);
	}, []);

	return (
		<section className="admin-section">
			<div className="admin-section-header">
				<div>
					<h2>Danh sách công việc</h2>
					<p>Tổng số: {taskTotal} công việc</p>
				</div>
				<div className="admin-actions">
					<input
						type="search"
						placeholder="Tìm theo tên công việc hoặc dự án"
						value={taskQuery}
						onChange={(event) => setTaskQuery(event.target.value)}
					/>
					<select
						value={taskStatusFilter}
						onChange={(event) => setTaskStatusFilter(event.target.value)}
					>
						<option value="">Tất cả trạng thái</option>
						<option value="Chua bat dau">Chưa bắt đầu</option>
						<option value="Dang thuc hien">Đang thực hiện</option>
						<option value="Da hoan thanh">Đã hoàn thành</option>
						<option value="Tre han">Trễ hạn</option>
					</select>
					<select value={taskSort} onChange={(event) => setTaskSort(event.target.value)}>
						<option value="deadline">Sắp xếp theo deadline</option>
						<option value="status">Sắp xếp theo trạng thái</option>
					</select>
					<button type="button" onClick={() => fetchTasks(1)}>
						Tìm kiếm
					</button>
					<button type="button" onClick={openCreateTask}>
						Tạo công việc
					</button>
				</div>
			</div>
			{taskFormOpen ? (
				<div className="modal-backdrop">
					<div className="modal">
						<div className="modal-header">
							<h3>Tạo công việc</h3>
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
									onChange={(event) =>
										setTaskForm({
											...taskForm,
											du_an_id: event.target.value,
										})
									}
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
									<option value="Thap">Thấp</option>
									<option value="Trung binh">Trung bình</option>
									<option value="Cao">Cao</option>
								</select>
							</div>
							<div className="form-group">
								<label>Trạng thái</label>
								<select
									value={taskForm.trang_thai}
									onChange={(event) =>
										setTaskForm({
											...taskForm,
											trang_thai: event.target.value,
										})
									}
								>
									<option value="Chua bat dau">Chưa bắt đầu</option>
									<option value="Dang thuc hien">Đang thực hiện</option>
									<option value="Da hoan thanh">Đã hoàn thành</option>
									<option value="Tre han">Trễ hạn</option>
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
							<div className="task-member-list">
								{taskEmployees.map((employee) => (
									<label key={employee.id} className="task-member-item">
										<input
											type="checkbox"
											checked={taskAssignees.includes(employee.id)}
											onChange={() => toggleAssignee(employee.id)}
										/>
										<span>{employee.ho_ten}</span>
									</label>
								))}
							</div>
						</div>
						<div className="task-member-block">
							<label>Người theo dõi</label>
							<div className="task-member-list">
								{taskEmployees.map((employee) => (
									<label key={employee.id} className="task-member-item">
										<input
											type="checkbox"
											checked={taskFollowers.includes(employee.id)}
											onChange={() => toggleFollower(employee.id)}
										/>
										<span>{employee.ho_ten}</span>
									</label>
								))}
							</div>
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
							<button type="button" onClick={submitTaskForm}>
								Lưu công việc
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
			<div className="admin-table">
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
								<tr key={row.id}>
									<td>{row.id}</td>
									<td>{row.ten_cong_viec}</td>
									<td>{row.ten_du_an || "-"}</td>
									<td>{row.nguoi_nhan || "-"}</td>
									<td>{row.han_hoan_thanh || "-"}</td>
									<td>{row.trang_thai || "-"}</td>
									<td>
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
									<option value="Chua bat dau">Chưa bắt đầu</option>
									<option value="Dang thuc hien">Đang thực hiện</option>
									<option value="Da hoan thanh">Đã hoàn thành</option>
									<option value="Tre han">Trễ hạn</option>
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
		</section>
	);
}

export default TasksPage;
