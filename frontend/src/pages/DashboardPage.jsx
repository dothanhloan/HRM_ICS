import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const normalizeText = (value) =>
	String(value || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();

const isDone = (status) => normalizeText(status).includes("hoan thanh");
const isDoing = (status) => normalizeText(status).includes("thuc hien");
const isNotStarted = (status) => normalizeText(status).includes("chua bat dau");

function DonutChart({ total, segments, center, label }) {
	let cursor = 0;
	const gradient = segments
		.map((segment) => {
			const size = total ? (segment.value / total) * 100 : 0;
			const start = cursor;
			cursor += size;
			return `${segment.color} ${start}% ${cursor}%`;
		})
		.join(", ");

	return (
		<div className="admin-donut-wrap">
			<div
				className="admin-donut"
				style={{ background: total ? `conic-gradient(${gradient})` : "#e5e7eb" }}
			>
				<div className="admin-donut-center">
					<strong>{center}</strong>
					<span>{label}</span>
				</div>
			</div>
		</div>
	);
}

function BarChart({ rows, valueSuffix = "", maxValue }) {
	const max = maxValue || Math.max(...rows.map((row) => row.value), 1);
	return (
		<div className="admin-bar-chart">
			{rows.map((row) => (
				<div className="admin-bar-row" key={row.label}>
					<span>{row.label}</span>
					<div>
						<i style={{ width: `${Math.max((row.value / max) * 100, row.value ? 4 : 0)}%`, background: row.color }} />
					</div>
					<strong>{row.value}{valueSuffix}</strong>
					{row.note ? <em>{row.note}</em> : null}
				</div>
			))}
		</div>
	);
}

function LineChart({ rows }) {
	const values = rows.map((row) => row.created);
	const doneValues = rows.map((row) => row.done);
	const max = Math.max(...values, ...doneValues, 1);
	const points = (key) =>
		rows
			.map((row, index) => {
				const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100;
				const y = 100 - ((row[key] || 0) / max) * 90;
				return `${x},${y}`;
			})
			.join(" ");
	return (
		<div className="admin-line-chart">
			<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
				<polyline points={points("created")} className="line-created" />
				<polyline points={points("done")} className="line-done" />
			</svg>
			<div className="admin-line-labels">
				<span>Tasks tạo mới</span>
				<span>Tasks hoàn thành</span>
			</div>
		</div>
	);
}

function LegacyEmployeeDashboard({ user, isAdmin }) {
	const greetingName = user?.ho_ten || "bạn";
	const roleLabel = isAdmin ? "Quản trị" : "Nhân viên";
	return (
		<>
			<section className="home-hero hero-splash">
				<div className="hero-content">
					<span className="hero-kicker">Bảng điều khiển</span>
					<h2 className="hero-title">Chào {greetingName}, chúc ngày mới hiệu quả.</h2>
					<p className="hero-subtitle">
						Tổng hợp nhanh lịch làm việc, nhiệm vụ và trạng thái hôm nay dành cho {roleLabel}.
					</p>
					<div className="hero-actions">
						<Link className="hero-btn" to="/attendance">Check-in nhanh</Link>
						<Link className="hero-btn ghost" to="/tasks">Xem công việc hôm nay</Link>
					</div>
				</div>
				<div className="hero-panel">
					<div className="stat-grid">
						<div className="stat-card"><span className="stat-label">Trạng thái hôm nay</span><span className="stat-value">Sẵn sàng</span><span className="stat-note">Giờ làm việc 08:00 - 17:00</span></div>
						<div className="stat-card"><span className="stat-label">Lịch họp</span><span className="stat-value">2</span><span className="stat-note">Cuộc họp nội bộ</span></div>
						<div className="stat-card"><span className="stat-label">Nhiệm vụ gấp</span><span className="stat-value">3</span><span className="stat-note">Cập nhật trong tuần</span></div>
						<div className="stat-card"><span className="stat-label">Thông báo mới</span><span className="stat-value">5</span><span className="stat-note">Từ phòng ban</span></div>
					</div>
				</div>
			</section>

			<section className="quick-grid">
				<div className="quick-card"><span className="badge">Chấm công</span><h3>Check-in / Check-out</h3><p>Ghi nhận thời gian và vị trí làm việc trong ngày.</p><Link className="quick-action" to="/attendance">Mở chấm công</Link></div>
				<div className="quick-card"><span className="badge">Công việc</span><h3>Theo dõi tiến độ</h3><p>Danh sách nhiệm vụ, deadline và ưu tiên xử lý.</p><Link className="quick-action" to="/tasks">Xem công việc</Link></div>
				<div className="quick-card"><span className="badge">Dự án</span><h3>Đồng bộ dự án</h3><p>Trạng thái dự án, leader và lịch trình quan trọng.</p><Link className="quick-action" to="/projects">Mở dự án</Link></div>
				<div className="quick-card"><span className="badge">Phòng ban</span><h3>Kết nối nội bộ</h3><p>Thông tin phòng ban, thông báo và hỗ trợ.</p><Link className="quick-action" to="/departments">Xem phòng ban</Link></div>
			</section>
		</>
	);
}

function EmployeeDashboard({ user, data, status }) {
	const now = new Date();
	const month = now.getMonth() + 1;
	const year = now.getFullYear();
	const todayText = now.toLocaleDateString("vi-VN", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
	const completedTasks = data.tasks.rows.filter((row) => isDone(row.trang_thai)).length;
	const doingTasks = data.tasks.rows.filter((row) => isDoing(row.trang_thai)).length;
	const notStartedTasks = data.tasks.rows.filter((row) => isNotStarted(row.trang_thai)).length;
	const totalTasks = data.tasks.total || data.tasks.rows.length;
	const overdueTasks = data.tasks.rows.filter((row) => {
		const deadline = row.han_hoan_thanh ? new Date(row.han_hoan_thanh).getTime() : null;
		return deadline && deadline < Date.now() && !isDone(row.trang_thai);
	}).length;
	const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
	const lateAttendance = data.attendance.rows.filter((row) =>
		normalizeText(row.trang_thai_hien_tai || row.trang_thai).includes("tre")
	).length;
	const totalHours = data.attendance.rows.reduce(
		(sum, row) => sum + (Number(row.so_gio_lam) || 0),
		0
	);
	const department =
		data.departments.rows.find((row) => Number(row.id) === Number(user?.phong_ban_id)) || {};
	const latestPayroll = data.payroll.rows[0];
	const latestKpi = data.kpi.rows[0];
	const kpiScore =
		latestKpi?.diem_trung_binh ??
		latestKpi?.diem_kpi ??
		latestKpi?.tong_diem ??
		0;
	const unreadNotifications = data.notifications.rows.filter(
		(row) => Number(row.nguoi_nhan_id) === Number(user.id) && !row.da_doc
	).length;
	const todoRows = data.tasks.rows.filter(
		(row) => isDoing(row.trang_thai) || isNotStarted(row.trang_thai)
	);
	const formatNumber = (value) => {
		const number = Number(value);
		return Number.isFinite(number) ? number.toLocaleString("vi-VN") : value || "0";
	};

	return (
		<section className="employee-dashboard-page">
			<div className="employee-dashboard-heading">
				<h2>
					<span aria-hidden="true">▦</span>
					Thông tin phòng ban
				</h2>
				<p>
					<span aria-hidden="true">▣</span>
					{todayText}
				</p>
			</div>

			{status.message ? <div className={`alert ${status.type}`}>{status.message}</div> : null}

			<div className="employee-info-grid">
				<div className="employee-info-card">
					<h3>
						<span aria-hidden="true">▦</span>
						{department.ten_phong || user.phong_ban || "Chưa có phòng ban"}
					</h3>
					<p><strong>Trưởng phòng:</strong> {department.truong_phong || "-"}</p>
					<p><strong>Số nhân viên:</strong> {department.so_nhan_vien ?? "-"} người</p>
					<p><strong>Số công việc:</strong> {totalTasks} task</p>
				</div>
				<div className="employee-info-card">
					<h3>
						<span aria-hidden="true">▣</span>
						Chấm công tháng {month}/{year}
					</h3>
					<p><strong>Số ngày đã chấm:</strong> {data.attendance.total} ngày</p>
					<p><strong>Số ngày đi trễ:</strong> {lateAttendance} ngày</p>
					<p><strong>Tổng giờ làm:</strong> {totalHours.toFixed(1)} giờ</p>
				</div>
				<div className="employee-info-card">
					<h3>
						<span aria-hidden="true">▣</span>
						Lương & KPI tháng {month}/{year}
					</h3>
					<p>
						{latestPayroll
							? `Thực lĩnh: ${formatNumber(latestPayroll.thuc_linh ?? latestPayroll.tong_luong)} VNĐ`
							: "Chưa có dữ liệu lương"}
					</p>
					<p><strong>Điểm KPI TB:</strong> <span className="employee-kpi-score">{kpiScore}/10</span></p>
				</div>
			</div>

			<div className="employee-report-card">
				<h3><span aria-hidden="true">◔</span>Báo cáo nhanh - Công việc của tôi</h3>
				<div className="employee-report-body">
					<DonutChart
						total={Math.max(totalTasks, 1)}
						center={`${totalTasks} CV`}
						label="Tổng"
						segments={[
							{ value: completedTasks, color: "#06965a" },
							{ value: doingTasks, color: "#655df6" },
							{ value: overdueTasks, color: "#e11d1d" },
							{ value: notStartedTasks, color: "#6b7280" },
						]}
					/>
					<div className="employee-report-stats">
						<div><i style={{ background: "#06965a" }} /><span>Đã hoàn thành: <strong>{completedTasks}</strong></span><small>{taskCompletionRate}%</small></div>
						<div><i style={{ background: "#655df6" }} /><span>Đang thực hiện: <strong>{doingTasks}</strong></span><small>{totalTasks ? Math.round((doingTasks / totalTasks) * 100) : 0}%</small></div>
						<div><i style={{ background: "#e11d1d" }} /><span>Trễ hạn: <strong>{overdueTasks}</strong></span><small>{totalTasks ? Math.round((overdueTasks / totalTasks) * 100) : 0}%</small></div>
						<div><i style={{ background: "#6b7280" }} /><span>Chưa bắt đầu: <strong>{notStartedTasks}</strong></span><small>{totalTasks ? Math.round((notStartedTasks / totalTasks) * 100) : 0}%</small></div>
						<p>Tổng: <strong>{totalTasks}</strong> công việc</p>
					</div>
				</div>
			</div>

			<div className="employee-notification-strip">
				<span aria-hidden="true">♟</span>
				Bạn có <strong>{unreadNotifications}</strong> thông báo chưa đọc.
				<Link to="/notifications">Xem ngay</Link>
			</div>

			<div className="employee-todo-card">
				<h3><span aria-hidden="true">☷</span>Todo công việc của tôi</h3>
				{todoRows.length ? (
					<div className="employee-todo-list">
						{todoRows.slice(0, 6).map((task) => (
							<div className="employee-todo-row" key={task.id}>
								<div>
									<strong>{task.ten_cong_viec || `Công việc #${task.id}`}</strong>
									<span>{task.ten_du_an || task.phong_ban || "Chưa gắn dự án"}</span>
								</div>
								<em>{task.trang_thai || "-"}</em>
							</div>
						))}
					</div>
				) : (
					<p>Không có công việc ở trạng thái Chưa bắt đầu hoặc Đang thực hiện.</p>
				)}
			</div>
		</section>
	);
}

function DashboardPage({ user, isAdmin, canManagePayroll = false, apiBase }) {
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState({ type: "", message: "" });
	const [data, setData] = useState({
		employees: { total: 0, rows: [] },
		projects: { total: 0, rows: [] },
		tasks: { total: 0, rows: [] },
		departments: { total: 0, rows: [] },
		leaves: { total: 0, rows: [] },
		attendance: { total: 0, rows: [] },
		kpi: { total: 0, rows: [] },
		payroll: { total: 0, rows: [] },
		notifications: { total: 0, rows: [] },
	});
	const [selectedGroup, setSelectedGroup] = useState("");

	const fetchJson = async (path) => {
		const response = await fetch(`${apiBase}${path}`);
		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.detail || "Không thể tải dữ liệu dashboard");
		}
		return payload;
	};

	useEffect(() => {
		if (!user?.id) {
			return;
		}
		const loadDashboard = async () => {
			setLoading(true);
			setStatus({ type: "", message: "" });
			try {
				const actorRole = encodeURIComponent(user.vai_tro || "Nhân viên");
				const now = new Date();
				const month = now.getMonth() + 1;
				const year = now.getFullYear();
				const [employees, departments, tasks, projects, attendance, leaves, kpi, payroll, notifications] = (isAdmin || canManagePayroll)
					? await Promise.all([
							fetchJson("/api/v1/nhanvien?page=1&page_size=500"),
							fetchJson("/api/v1/phong_ban/danh_sach?page=1&page_size=200"),
							fetchJson("/api/v1/cong_viec/danh_sach?scope=all&actor=admin&page=1&page_size=1000"),
							fetchJson("/api/v1/du_an/danh_sach?actor=admin&page=1&page_size=500"),
							fetchJson("/api/v1/cham_cong/lich_su?page=1&page_size=1000"),
							Promise.resolve({ total: 0, data: [] }),
							Promise.resolve({ total: 0, data: [] }),
							Promise.resolve({ total: 0, data: [] }),
							Promise.resolve({ total: 0, data: [] }),
					  ])
					: await Promise.all([
							Promise.resolve({ total: 1, data: [user] }),
							fetchJson("/api/v1/phong_ban/danh_sach?page=1&page_size=200"),
							fetchJson(`/api/v1/cong_viec/danh_sach?scope=mine&actor=employee&nhan_vien_id=${user.id}&page=1&page_size=8`),
							fetchJson(`/api/v1/du_an/danh_sach?actor=employee&nhan_vien_id=${user.id}&page=1&page_size=8`),
							fetchJson(`/api/v1/cham_cong/lich_su?page=1&page_size=12&nhan_vien_id=${user.id}`),
							fetchJson(`/api/v1/don_nghi_phep/danh_sach?actor_id=${user.id}&nhan_vien_id=${user.id}&page=1&page_size=8`),
							fetchJson(`/api/v1/kpi_tinh_toan/danh_sach?actor_id=${user.id}&actor_role=${actorRole}&thang=${month}&nam=${year}&target_nhan_vien_id=${user.id}&page=1&page_size=8`),
							fetchJson(`/api/v1/luong_tinh_toan/danh_sach?actor_id=${user.id}&actor_role=${actorRole}&thang=${month}&nam=${year}&target_nhan_vien_id=${user.id}&page=1&page_size=8`),
							fetchJson("/api/v1/thong_bao?limit=200").catch(() => []),
					  ]);
				const notificationRows = Array.isArray(notifications)
					? notifications
					: notifications.data || [];
				setData({
					employees: { total: employees.total || 0, rows: employees.data || [] },
					departments: { total: departments.total || 0, rows: departments.data || [] },
					tasks: { total: tasks.total || 0, rows: tasks.data || [] },
					projects: { total: projects.total || 0, rows: projects.data || [] },
					attendance: { total: attendance.total || 0, rows: attendance.data || [] },
					leaves: { total: leaves.total || 0, rows: leaves.data || [] },
					kpi: { total: kpi.total || 0, rows: kpi.data || [] },
					payroll: { total: payroll.total || 0, rows: payroll.data || [] },
					notifications: { total: notificationRows.length, rows: notificationRows },
				});
			} catch (error) {
				setStatus({ type: "error", message: error.message });
			} finally {
				setLoading(false);
			}
		};
		loadDashboard();
	}, [apiBase, isAdmin, canManagePayroll, user?.id]);

	const adminStats = useMemo(() => {
		const today = new Date();
		const todayTime = today.getTime();
		const employees = data.employees.rows;
		const tasks = data.tasks.rows;
		const projects = data.projects.rows;
		const attendance = data.attendance.rows;
		const activeEmployees = employees.filter((row) => normalizeText(row.trang_thai_lam_viec).includes("dang lam")).length;
		const pausedEmployees = employees.filter((row) => normalizeText(row.trang_thai_lam_viec).includes("tam nghi")).length;
		const leftEmployees = employees.filter((row) => normalizeText(row.trang_thai_lam_viec).includes("nghi viec")).length;
		const done = tasks.filter((row) => isDone(row.trang_thai)).length;
		const doing = tasks.filter((row) => isDoing(row.trang_thai)).length;
		const notStarted = tasks.filter((row) => isNotStarted(row.trang_thai)).length;
		const overdueTasks = tasks.filter((row) => {
			const deadline = row.han_hoan_thanh ? new Date(row.han_hoan_thanh).getTime() : null;
			return deadline && deadline < todayTime && !isDone(row.trang_thai);
		});
		const completionRate = data.tasks.total ? Math.round((done / data.tasks.total) * 100) : 0;
		const projectGroups = [...new Set(projects.map((row) => row.phong_ban || row.nhom_du_an || "Chưa phân nhóm"))];
		const selected = selectedGroup || projectGroups[0] || "";
		const selectedProjects = projects.filter((row) => (row.phong_ban || row.nhom_du_an || "Chưa phân nhóm") === selected);

		const progressForProject = (project) => {
			const relatedTasks = tasks.filter((task) => Number(task.du_an_id) === Number(project.id));
			if (relatedTasks.length) {
				return Math.round((relatedTasks.filter((task) => isDone(task.trang_thai)).length / relatedTasks.length) * 100);
			}
			if (isDone(project.trang_thai_duan)) return 100;
			if (isDoing(project.trang_thai_duan)) return 65;
			return 0;
		};

		const groupProgress = projectGroups.map((group) => {
			const groupProjects = projects.filter((row) => (row.phong_ban || row.nhom_du_an || "Chưa phân nhóm") === group);
			const avg = groupProjects.length
				? Math.round(groupProjects.reduce((sum, project) => sum + progressForProject(project), 0) / groupProjects.length)
				: 0;
			return { label: group, value: avg, color: avg >= 80 ? "#6d5bff" : "#f0a000" };
		});

		const overdueByProject = Object.values(
			overdueTasks.reduce((acc, task) => {
				const key = task.ten_du_an || task.phong_ban || "Công việc chung";
				acc[key] = acc[key] || { label: key, value: 0, color: "#10c997" };
				acc[key].value += 1;
				return acc;
			}, {})
		).sort((a, b) => b.value - a.value).slice(0, 10);

		const assigneeOpen = {};
		tasks.filter((task) => !isDone(task.trang_thai)).forEach((task) => {
			String(task.nguoi_nhan || "Chưa phân công").split(",").map((name) => name.trim()).filter(Boolean).forEach((name) => {
				assigneeOpen[name] = (assigneeOpen[name] || 0) + 1;
			});
		});
		const topOpenAssignees = Object.entries(assigneeOpen)
			.map(([label, value]) => ({ label, value, color: "#10c997" }))
			.sort((a, b) => b.value - a.value)
			.slice(0, 10);

		const priorityCounts = ["Cao", "Trung bình", "Thấp"].map((label) => ({
			label,
			value: tasks.filter((task) => normalizeText(task.muc_do_uu_tien).includes(normalizeText(label))).length,
			color: label === "Cao" ? "#ff2d0f" : label === "Trung bình" ? "#f5b000" : "#655df6",
		}));

		const thirtyDays = Array.from({ length: 30 }, (_, index) => {
			const date = new Date(today);
			date.setDate(today.getDate() - (29 - index));
			const key = date.toISOString().slice(0, 10);
			return {
				label: key.slice(5),
				created: tasks.filter((task) => String(task.ngay_bat_dau || "").slice(0, 10) === key).length,
				done: tasks.filter((task) => isDone(task.trang_thai) && String(task.han_hoan_thanh || "").slice(0, 10) === key).length,
			};
		});

		const taskAgeByProject = Object.values(
			tasks.filter((task) => !isDone(task.trang_thai)).reduce((acc, task) => {
				const key = task.ten_du_an || task.phong_ban || "Công việc chung";
				const start = task.ngay_bat_dau ? new Date(task.ngay_bat_dau).getTime() : todayTime;
				const age = Math.max(Math.round((todayTime - start) / 86400000), 0);
				acc[key] = acc[key] || { label: key, total: 0, count: 0, color: "#ff2d0f" };
				acc[key].total += age;
				acc[key].count += 1;
				return acc;
			}, {})
		).map((row) => ({ label: row.label, value: Math.round(row.total / row.count), color: row.color })).sort((a, b) => b.value - a.value).slice(0, 8);

		const attendanceByDay = Array.from({ length: 30 }, (_, index) => {
			const day = index + 1;
			const dayRows = attendance.filter((row) => Number(String(row.ngay || "").slice(8, 10)) === day);
			return { label: String(day), value: dayRows.length };
		});

		return {
			activeEmployees,
			pausedEmployees,
			leftEmployees,
			done,
			doing,
			notStarted,
			overdue: overdueTasks.length,
			completionRate,
			projectGroups,
			selected,
			selectedProjects,
			progressForProject,
			groupProgress,
			overdueByProject,
			topOpenAssignees,
			priorityCounts,
			thirtyDays,
			taskAgeByProject,
			attendanceByDay,
			sla: [
				{ label: "Đúng hạn", value: Math.max(tasks.length - overdueTasks.length, 0), color: "#10c997" },
				{ label: "Vi phạm", value: overdueTasks.length, color: "#ff2d0f" },
			],
		};
	}, [data, selectedGroup]);

	if (!isAdmin && !canManagePayroll) {
		return <EmployeeDashboard user={user} data={data} status={status} />;
		const completedTasks = data.tasks.rows.filter((row) => isDone(row.trang_thai)).length;
		const lateAttendance = data.attendance.rows.filter((row) =>
			normalizeText(row.trang_thai_hien_tai || row.trang_thai).includes("tre")
		).length;
		const pendingLeaves = data.leaves.rows.filter((row) => row.trang_thai === "cho_duyet").length;
		const formatDate = (value) => {
			if (!value) return "-";
			const date = new Date(value);
			return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("vi-VN");
		};
		const openTasks = Math.max(data.tasks.total - completedTasks, 0);
		const latestAttendance = data.attendance.rows[0];
		const latestPayroll = data.payroll.rows[0];
		const latestKpi = data.kpi.rows[0];
		const taskCompletionRate = data.tasks.total
			? Math.round((completedTasks / data.tasks.total) * 100)
			: 0;
		return (
			<section className="dashboard-page">
				<div className="employee-dashboard-top">
					<div>
						<span className="dashboard-kicker">Không gian làm việc</span>
						<h2>Tổng quan cá nhân</h2>
						<p>Theo dõi công việc, chấm công, nghỉ phép, KPI và lương trong một màn hình.</p>
					</div>
					<Link className="employee-primary-action" to="/attendance">
						Mở chấm công
					</Link>
				</div>

				{status.message ? <div className={`alert ${status.type}`}>{status.message}</div> : null}

				<div className="dashboard-summary-grid">
					<Link className="dashboard-summary-card green" to="/tasks"><span>Công việc mở</span><strong>{openTasks}</strong><small>{taskCompletionRate}% đã hoàn thành</small></Link>
					<Link className="dashboard-summary-card blue" to="/attendance"><span>Chấm công</span><strong>{data.attendance.total}</strong><small>{lateAttendance} lần đi trễ</small></Link>
					<Link className="dashboard-summary-card cyan" to="/leave"><span>Nghỉ phép</span><strong>{pendingLeaves}</strong><small>Đơn đang chờ duyệt</small></Link>
					<Link className="dashboard-summary-card violet" to="/projects"><span>Dự án</span><strong>{data.projects.total}</strong><small>Dự án liên quan</small></Link>
				</div>

				<div className="dashboard-content-grid">
					<div className="dashboard-panel employee-status-panel">
						<div className="dashboard-panel-header"><div><h3>Trạng thái hôm nay</h3><p>Dữ liệu vận hành cá nhân</p></div></div>
						<div className="employee-status-grid">
							<div><span>Check-in gần nhất</span><strong>{latestAttendance?.check_in || "-"}</strong><small>{formatDate(latestAttendance?.ngay)}</small></div>
							<div><span>Check-out gần nhất</span><strong>{latestAttendance?.check_out || "-"}</strong><small>{latestAttendance?.trang_thai_hien_tai || latestAttendance?.trang_thai || "-"}</small></div>
							<div><span>KPI kỳ này</span><strong>{latestKpi?.tong_diem ?? latestKpi?.diem_kpi ?? "-"}</strong><small>{data.kpi.total ? "Đã có dữ liệu" : "Chưa ghi nhận"}</small></div>
							<div><span>Lương kỳ này</span><strong>{latestPayroll?.thuc_linh ?? latestPayroll?.tong_luong ?? "-"}</strong><small>{data.payroll.total ? "Bảng lương mới nhất" : "Chưa ghi nhận"}</small></div>
						</div>
					</div>

					<div className="dashboard-panel">
						<div className="dashboard-panel-header"><div><h3>Công việc ưu tiên</h3><p>Cần theo dõi trong thời gian gần</p></div><Link to="/tasks">Xem tất cả</Link></div>
						<div className="dashboard-list">
							{data.tasks.rows.slice(0, 5).map((task) => (
								<div className="dashboard-list-row task-row" key={task.id}><div><strong>{task.ten_cong_viec || `Công việc #${task.id}`}</strong><span>{task.ten_du_an || task.phong_ban || "Chưa gắn dự án"}</span></div><em>{task.trang_thai || "-"}</em></div>
							))}
							{data.tasks.rows.length === 0 ? <p className="dashboard-empty">Chưa có công việc.</p> : null}
						</div>
					</div>

					<div className="dashboard-panel">
						<div className="dashboard-panel-header"><div><h3>Nghỉ phép</h3><p>Theo dõi đơn nghỉ phép cá nhân</p></div><Link to="/leave">Tạo đơn</Link></div>
						<div className="dashboard-list">
							{data.leaves.rows.slice(0, 5).map((leave) => (
								<div className="dashboard-list-row" key={leave.id}><div><strong>{leave.loai_phep || `Đơn #${leave.id}`}</strong><span>{formatDate(leave.ngay_bat_dau)} - {formatDate(leave.ngay_ket_thuc)}</span></div><em>{leave.trang_thai || "-"}</em></div>
							))}
							{data.leaves.rows.length === 0 ? <p className="dashboard-empty">Chưa có đơn nghỉ phép.</p> : null}
						</div>
					</div>

					<div className="dashboard-panel wide">
						<div className="dashboard-panel-header"><div><h3>Lịch sử chấm công</h3><p>6 bản ghi gần nhất</p></div><Link to="/attendance">Xem chi tiết</Link></div>
						<div className="dashboard-attendance-strip">
							{data.attendance.rows.slice(0, 6).map((row) => (
								<div className="dashboard-attendance-item" key={row.id}><span>{formatDate(row.ngay)}</span><strong>{row.ho_ten || user?.ho_ten}</strong><small>{row.check_in || "-"} / {row.check_out || "-"}</small><em>{row.trang_thai_hien_tai || row.trang_thai || "-"}</em></div>
							))}
							{data.attendance.rows.length === 0 ? <p className="dashboard-empty">Chưa có dữ liệu chấm công.</p> : null}
						</div>
					</div>
				</div>
			</section>
		);
	}

	const taskTotalForDonut = Math.max(data.tasks.total, adminStats.done + adminStats.doing + adminStats.overdue + adminStats.notStarted);
	const priorityTotal = adminStats.priorityCounts.reduce((sum, item) => sum + item.value, 0);
	const slaTotal = adminStats.sla.reduce((sum, item) => sum + item.value, 0);

	return (
		<section className="admin-dashboard-page">
			<div className="admin-dashboard-title">
				<div>
					<h2>Dashboard</h2>
					<p>Tổng quan vận hành nhân sự, công việc, dự án và chấm công từ dữ liệu hệ thống.</p>
				</div>
				<span>{loading ? "Đang tải dữ liệu..." : "Dữ liệu mới nhất"}</span>
			</div>

			{status.message ? <div className={`alert ${status.type}`}>{status.message}</div> : null}

			<div className="admin-dashboard-kpis">
				<div className="admin-kpi-card">
					<strong>{data.employees.total}</strong>
					<span>Tổng nhân viên</span>
					<small>Đang làm: {adminStats.activeEmployees} | Tạm nghỉ: {adminStats.pausedEmployees} | Nghỉ việc: {adminStats.leftEmployees}</small>
				</div>
				<div className="admin-kpi-card">
					<strong>{data.departments.total}</strong>
					<span>Phòng ban</span>
					<small>Cơ cấu tổ chức hiện có</small>
				</div>
				<div className="admin-kpi-card">
					<strong>{data.tasks.total}</strong>
					<span>Công việc</span>
					<small>Quá hạn: {adminStats.overdue}</small>
				</div>
				<div className="admin-kpi-card">
					<strong>{adminStats.completionRate}%</strong>
					<span>Tỷ lệ hoàn thành</span>
					<small>{adminStats.done} task đã hoàn thành</small>
				</div>
			</div>

			<div className="admin-dashboard-panel quick-report">
				<div>
					<h3>Báo cáo nhanh</h3>
					<DonutChart
						total={taskTotalForDonut}
						center={`${data.tasks.total} CV`}
						label="Tổng"
						segments={[
							{ value: adminStats.done, color: "#20c997" },
							{ value: adminStats.doing, color: "#655df6" },
							{ value: adminStats.overdue, color: "#ff2d0f" },
							{ value: adminStats.notStarted, color: "#8a93a8" },
						]}
					/>
				</div>
				<div className="admin-report-legend">
					<div><i style={{ background: "#20c997" }} />Đã hoàn thành: <strong>{adminStats.done}</strong><span>{taskTotalForDonut ? Math.round((adminStats.done / taskTotalForDonut) * 100) : 0}%</span></div>
					<div><i style={{ background: "#655df6" }} />Đang thực hiện: <strong>{adminStats.doing}</strong><span>{taskTotalForDonut ? Math.round((adminStats.doing / taskTotalForDonut) * 100) : 0}%</span></div>
					<div><i style={{ background: "#ff2d0f" }} />Trễ hạn: <strong>{adminStats.overdue}</strong><span>{taskTotalForDonut ? Math.round((adminStats.overdue / taskTotalForDonut) * 100) : 0}%</span></div>
					<div><i style={{ background: "#8a93a8" }} />Chưa bắt đầu: <strong>{adminStats.notStarted}</strong><span>{taskTotalForDonut ? Math.round((adminStats.notStarted / taskTotalForDonut) * 100) : 0}%</span></div>
				</div>
			</div>

			<div className="admin-dashboard-panel project-progress-panel">
				<h3>Tiến độ dự án theo nhóm</h3>
				<div className="project-progress-layout">
					<label>
						Chọn nhóm dự án:
						<select value={adminStats.selected} onChange={(event) => setSelectedGroup(event.target.value)}>
							{adminStats.projectGroups.map((group) => <option key={group} value={group}>{group}</option>)}
						</select>
					</label>
					<div className="project-progress-list">
						{adminStats.selectedProjects.map((project) => {
							const progress = adminStats.progressForProject(project);
							const overdue = project.ngay_ket_thuc && new Date(project.ngay_ket_thuc) < new Date() && progress < 100;
							return (
								<div className="project-progress-row" key={project.id}>
									<span>{project.ten_du_an}</span>
									<div><i style={{ width: `${progress}%` }} /></div>
									<strong>{progress}%</strong>
									{overdue ? <em>Đã quá hạn</em> : progress === 100 ? <em className="done">Hoàn thành</em> : null}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<div className="admin-dashboard-grid">
				<div className="admin-dashboard-panel">
					<h3>Chấm công tháng - theo ngày</h3>
					<BarChart rows={adminStats.attendanceByDay.map((row) => ({ ...row, color: "#20c997" }))} maxValue={Math.max(...adminStats.attendanceByDay.map((row) => row.value), 1)} />
					<p className="admin-chart-note">NV tham gia: <strong>{new Set(data.attendance.rows.map((row) => row.nhan_vien_id)).size}</strong> Tổng lượt: <strong>{data.attendance.rows.length}</strong></p>
				</div>
				<div className="admin-dashboard-panel">
					<h3>Tiến độ phòng ban</h3>
					<BarChart rows={adminStats.groupProgress} valueSuffix="%" maxValue={100} />
				</div>
				<div className="admin-dashboard-panel">
					<h3>Số task quá hạn theo dự án</h3>
					<BarChart rows={adminStats.overdueByProject.length ? adminStats.overdueByProject : [{ label: "Không có task quá hạn", value: 0, color: "#10c997" }]} />
				</div>
				<div className="admin-dashboard-panel">
					<h3>Top 10 nhân viên có nhiều task mở</h3>
					<BarChart rows={adminStats.topOpenAssignees.length ? adminStats.topOpenAssignees : [{ label: "Không có task mở", value: 0, color: "#10c997" }]} />
				</div>
				<div className="admin-dashboard-panel">
					<h3>Trend: task tạo mới vs hoàn thành (30 ngày)</h3>
					<LineChart rows={adminStats.thirtyDays} />
				</div>
				<div className="admin-dashboard-panel">
					<h3>Phân bố ưu tiên task</h3>
					<DonutChart total={priorityTotal} center={priorityTotal} label="Task" segments={adminStats.priorityCounts} />
					<div className="admin-donut-legend">
						{adminStats.priorityCounts.map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}
					</div>
				</div>
				<div className="admin-dashboard-panel">
					<h3>Tuổi trung bình task mở (ngày)</h3>
					<BarChart rows={adminStats.taskAgeByProject.length ? adminStats.taskAgeByProject : [{ label: "Không có task mở", value: 0, color: "#ff2d0f" }]} />
				</div>
				<div className="admin-dashboard-panel">
					<h3>Tỷ lệ vi phạm deadline (SLA)</h3>
					<DonutChart total={slaTotal} center={`${slaTotal ? Math.round((adminStats.sla[1].value / slaTotal) * 100) : 0}%`} label="Vi phạm" segments={adminStats.sla} />
					<div className="admin-donut-legend">
						{adminStats.sla.map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}
					</div>
				</div>
			</div>
		</section>
	);
}

export default DashboardPage;
