import React, { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./styles/login.css";

import AppLayout from "./components/AppLayout";
import AttendancePage from "./pages/AttendancePage";
import DashboardPage from "./pages/DashboardPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import EmployeesPage from "./pages/EmployeesPage";
import LeavePage from "./pages/LeavePage";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import SalaryCalculatorPage from "./pages/SalaryCalculatorPage";
import TasksPage from "./pages/TasksPage";
import KpiCalculatorPage from "./pages/KpiCalculatorPage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function App() {
	const navigate = useNavigate();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [status, setStatus] = useState({ type: "", message: "" });
	const [loading, setLoading] = useState(false);
	const [user, setUser] = useState(null);
	const [employeeRows, setEmployeeRows] = useState([]);
	const [employeeTotal, setEmployeeTotal] = useState(0);
	const [employeeQuery, setEmployeeQuery] = useState("");
	const [employeeStatus, setEmployeeStatus] = useState({ type: "", message: "" });
	const [employeeLoading, setEmployeeLoading] = useState(false);
	const [attendanceToday, setAttendanceToday] = useState(null);
	const [attendanceHistory, setAttendanceHistory] = useState([]);
	const [attendanceStatus, setAttendanceStatus] = useState({
		type: "",
		message: "",
	});
	const [attendanceLoading, setAttendanceLoading] = useState(false);
	const [leaveRows, setLeaveRows] = useState([]);
	const [leaveTotal, setLeaveTotal] = useState(0);
	const [leavePage, setLeavePage] = useState(1);
	const [leavePageSize, setLeavePageSize] = useState(10);
	const [leaveTotalPages, setLeaveTotalPages] = useState(0);
	const [leaveStatusFilter, setLeaveStatusFilter] = useState("cho_duyet");
	const [leaveStatus, setLeaveStatus] = useState({ type: "", message: "" });
	const [leaveLoading, setLeaveLoading] = useState(false);
	const [leaveFormOpen, setLeaveFormOpen] = useState(false);
	const [leaveForm, setLeaveForm] = useState({
		loai_phep: "Phep nam",
		ngay_bat_dau: "",
		ngay_ket_thuc: "",
		ly_do: "",
		ghi_chu: "",
	});
	const [employeePage, setEmployeePage] = useState(1);
	const [employeePageSize, setEmployeePageSize] = useState(10);
	const [employeeTotalPages, setEmployeeTotalPages] = useState(0);
	const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
	const [employeeEditingId, setEmployeeEditingId] = useState(null);
	const [employeeDepartments, setEmployeeDepartments] = useState([]);
	const [employeeDepartmentsLoading, setEmployeeDepartmentsLoading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [projectRows, setProjectRows] = useState([]);
	const [projectTotal, setProjectTotal] = useState(0);
	const [projectQuery, setProjectQuery] = useState("");
	const [projectStatusFilter, setProjectStatusFilter] = useState("");
	const [projectStatus, setProjectStatus] = useState({ type: "", message: "" });
	const [projectLoading, setProjectLoading] = useState(false);
	const [projectPage, setProjectPage] = useState(1);
	const [projectPageSize, setProjectPageSize] = useState(10);
	const [projectTotalPages, setProjectTotalPages] = useState(0);
	const [projectFormOpen, setProjectFormOpen] = useState(false);
	const [projectEditingId, setProjectEditingId] = useState(null);
	const [projectFormStatus, setProjectFormStatus] = useState({ type: "", message: "" });
	const [projectEmployees, setProjectEmployees] = useState([]);
	const [projectEmployeesLoading, setProjectEmployeesLoading] = useState(false);
	const [projectDepartments, setProjectDepartments] = useState([]);
	const [projectDepartmentsLoading, setProjectDepartmentsLoading] = useState(false);
	const [projectDeleteTarget, setProjectDeleteTarget] = useState(null);
	const [taskRows, setTaskRows] = useState([]);
	const [taskTotal, setTaskTotal] = useState(0);
	const [taskQuery, setTaskQuery] = useState("");
	const [taskStatusFilter, setTaskStatusFilter] = useState("");
	const [taskSort, setTaskSort] = useState("deadline");
	const [taskStatus, setTaskStatus] = useState({ type: "", message: "" });
	const [taskLoading, setTaskLoading] = useState(false);
	const [taskPage, setTaskPage] = useState(1);
	const [taskPageSize, setTaskPageSize] = useState(10);
	const [taskTotalPages, setTaskTotalPages] = useState(0);
	const [taskFormOpen, setTaskFormOpen] = useState(false);
	const [taskFormStatus, setTaskFormStatus] = useState({ type: "", message: "" });
	const [taskAssignees, setTaskAssignees] = useState([]);
	const [taskFollowers, setTaskFollowers] = useState([]);
	const [taskEmployees, setTaskEmployees] = useState([]);
	const [taskEmployeesLoading, setTaskEmployeesLoading] = useState(false);
	const [taskProjects, setTaskProjects] = useState([]);
	const [taskProjectsLoading, setTaskProjectsLoading] = useState(false);
	const [taskProgressOpen, setTaskProgressOpen] = useState(false);
	const [taskProgressTarget, setTaskProgressTarget] = useState(null);
	const [taskProgressForm, setTaskProgressForm] = useState({
		trang_thai: "Dang thuc hien",
		phan_tram: 0,
	});
	const [taskForm, setTaskForm] = useState({
		ten_cong_viec: "",
		mo_ta: "",
		du_an_id: "",
		ngay_bat_dau: "",
		han_hoan_thanh: "",
		muc_do_uu_tien: "Trung binh",
		trang_thai: "Chua bat dau",
		tai_lieu_cv: "",
	});
	const [departmentRows, setDepartmentRows] = useState([]);
	const [departmentTotal, setDepartmentTotal] = useState(0);
	const [departmentQuery, setDepartmentQuery] = useState("");
	const [departmentStatus, setDepartmentStatus] = useState({ type: "", message: "" });
	const [departmentLoading, setDepartmentLoading] = useState(false);
	const [departmentPage, setDepartmentPage] = useState(1);
	const [departmentPageSize, setDepartmentPageSize] = useState(10);
	const [departmentTotalPages, setDepartmentTotalPages] = useState(0);
	const [departmentFormOpen, setDepartmentFormOpen] = useState(false);
	const [departmentEditingId, setDepartmentEditingId] = useState(null);
	const [departmentForm, setDepartmentForm] = useState({
		ten_phong: "",
		truong_phong_id: "",
	});
	const [departmentLeaders, setDepartmentLeaders] = useState([]);
	const [departmentLeadersLoading, setDepartmentLeadersLoading] = useState(false);
	const [departmentActionTarget, setDepartmentActionTarget] = useState(null);
	const [departmentTransferId, setDepartmentTransferId] = useState("");
	const [projectForm, setProjectForm] = useState({
		ten_du_an: "",
		mo_ta: "",
		ngay_bat_dau: "",
		ngay_ket_thuc: "",
		lead_id: "",
		nhom_du_an: "",
		phong_ban: "",
		muc_do_uu_tien: "",
		trang_thai_duan: "Đang thực hiện",
	});
	const [employeeForm, setEmployeeForm] = useState({
		ho_ten: "",
		email: "",
		mat_khau: "",
		so_dien_thoai: "",
		gioi_tinh: "",
		ngay_sinh: "",
		phong_ban_id: "",
		chuc_vu: "",
		luong_co_ban: "",
		trang_thai_lam_viec: "Đang làm",
		vai_tro: "Nhân viên",
		ngay_vao_lam: "",
		avatar_url: "",
	});

	const handleSubmit = async (event) => {
		event.preventDefault();
		setStatus({ type: "", message: "" });

		if (!identifier.trim() || !password.trim()) {
			setStatus({ type: "error", message: "Vui long nhap day du thong tin." });
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					identifier,
					password,
				}),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Dang nhap that bai");
			}

			setUser(data.user);
			setAttendanceToday(null);
			setAttendanceHistory([]);
			setAttendanceStatus({ type: "", message: "" });
			setStatus({ type: "", message: "" });
			navigate("/dashboard");
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		setUser(null);
		setIdentifier("");
		setPassword("");
		setStatus({ type: "", message: "" });
		setEmployeeRows([]);
		setEmployeeTotal(0);
		setEmployeeQuery("");
		setEmployeeStatus({ type: "", message: "" });
		setEmployeePage(1);
		setEmployeeTotalPages(0);
		setAttendanceToday(null);
		setAttendanceHistory([]);
		setAttendanceStatus({ type: "", message: "" });
		setLeaveRows([]);
		setLeaveTotal(0);
		setLeavePage(1);
		setLeavePageSize(10);
		setLeaveTotalPages(0);
		setLeaveStatusFilter("cho_duyet");
		setLeaveStatus({ type: "", message: "" });
		setLeaveFormOpen(false);
		setLeaveForm({
			loai_phep: "Phep nam",
			ngay_bat_dau: "",
			ngay_ket_thuc: "",
			ly_do: "",
			ghi_chu: "",
		});
		setEmployeeFormOpen(false);
		setEmployeeEditingId(null);
		setEmployeeDepartments([]);
		setDeleteTarget(null);
		setProjectRows([]);
		setProjectTotal(0);
		setProjectQuery("");
		setProjectStatusFilter("");
		setProjectStatus({ type: "", message: "" });
		setProjectPage(1);
		setProjectTotalPages(0);
		setProjectFormOpen(false);
		setProjectEditingId(null);
		setProjectFormStatus({ type: "", message: "" });
		setProjectEmployees([]);
		setProjectDepartments([]);
		setProjectDeleteTarget(null);
		setTaskRows([]);
		setTaskTotal(0);
		setTaskQuery("");
		setTaskStatusFilter("");
		setTaskSort("deadline");
		setTaskStatus({ type: "", message: "" });
		setTaskPage(1);
		setTaskTotalPages(0);
		setTaskFormOpen(false);
		setTaskFormStatus({ type: "", message: "" });
		setTaskAssignees([]);
		setTaskFollowers([]);
		setTaskEmployees([]);
		setTaskProjects([]);
		setTaskProgressOpen(false);
		setTaskProgressTarget(null);
		setDepartmentRows([]);
		setDepartmentTotal(0);
		setDepartmentQuery("");
		setDepartmentStatus({ type: "", message: "" });
		setDepartmentPage(1);
		setDepartmentTotalPages(0);
		setDepartmentFormOpen(false);
		setDepartmentEditingId(null);
		setDepartmentForm({ ten_phong: "", truong_phong_id: "" });
		setDepartmentActionTarget(null);
		setDepartmentTransferId("");
		setDepartmentLeaders([]);
		navigate("/login");
	};

	const fetchAttendanceToday = async (nhanVienId) => {
		if (!nhanVienId) {
			return;
		}
		setAttendanceLoading(true);
		setAttendanceStatus({ type: "", message: "" });
		try {
			const response = await fetch(
				`${API_BASE}/api/v1/cham_cong/hom_nay?nhan_vien_id=${nhanVienId}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai du lieu cham cong");
			}
			setAttendanceToday(data.data || null);
		} catch (error) {
			setAttendanceStatus({ type: "error", message: error.message });
		} finally {
			setAttendanceLoading(false);
		}
	};

	const fetchAttendanceHistory = async (
		nhanVienId,
		page = 1,
		pageSize = 7,
		tuNgay,
		denNgay,
		fetchAll = false
	) => {
		if (!fetchAll && !nhanVienId) {
			return;
		}
		setAttendanceLoading(true);
		setAttendanceStatus({ type: "", message: "" });
		try {
			const params = new URLSearchParams({
				page: String(page),
				page_size: String(pageSize),
			});
			if (!fetchAll) {
				params.set("nhan_vien_id", String(nhanVienId));
			}
			if (tuNgay) {
				params.set("tu_ngay", tuNgay);
			}
			if (denNgay) {
				params.set("den_ngay", denNgay);
			}
			const response = await fetch(
				`${API_BASE}/api/v1/cham_cong/lich_su?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai lich su cham cong");
			}
			setAttendanceHistory(data.data || []);
		} catch (error) {
			setAttendanceStatus({ type: "error", message: error.message });
		} finally {
			setAttendanceLoading(false);
		}
	};

	const submitCheckIn = async ({
		nhan_vien_id,
		vi_tri,
		vi_do,
		kinh_do,
		bao_cao,
		loai_cham_cong,
	}) => {
		setAttendanceStatus({ type: "", message: "" });
		try {
			const response = await fetch(`${API_BASE}/api/v1/cham_cong/check_in`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nhan_vien_id,
					vi_tri,
					vi_do,
					kinh_do,
					bao_cao,
					loai_cham_cong,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the check-in");
			}
			setAttendanceStatus({ type: "success", message: "Check-in thanh cong." });
			const today = new Date();
			const todayStr = today.toISOString().slice(0, 10);
			const checkInValue = data.check_in || today.toTimeString().slice(0, 8);
			setAttendanceToday((prev) => ({
				...(prev || {}),
				ngay: prev?.ngay || todayStr,
				check_in: checkInValue,
				trang_thai: data.trang_thai,
				trang_thai_hien_tai: data.trang_thai,
				so_gio_lam: 0.0,
			}));
			setAttendanceHistory((prev) => {
				const rows = Array.isArray(prev) ? prev : [];
				const index = rows.findIndex((row) => row.ngay === todayStr);
				if (index >= 0) {
					const nextRows = [...rows];
					nextRows[index] = {
						...nextRows[index],
						check_in: checkInValue,
						trang_thai: data.trang_thai,
						trang_thai_hien_tai: data.trang_thai,
						so_gio_lam: 0.0,
					};
					return nextRows;
				}
				return [
					{
						id: `local-${todayStr}`,
						ngay: todayStr,
						check_in: checkInValue,
						check_out: null,
						trang_thai: data.trang_thai,
						trang_thai_hien_tai: data.trang_thai,
						so_gio_lam: 0.0,
					},
					...rows,
				];
			});
			await fetchAttendanceToday(nhan_vien_id);
			await fetchAttendanceHistory(nhan_vien_id);
		} catch (error) {
			setAttendanceStatus({ type: "error", message: error.message });
		}
	};

	const submitCheckOut = async ({ nhan_vien_id, vi_tri, vi_do, kinh_do, bao_cao }) => {
		setAttendanceStatus({ type: "", message: "" });
		try {
			const response = await fetch(`${API_BASE}/api/v1/cham_cong/check_out`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nhan_vien_id,
					vi_tri,
					vi_do,
					kinh_do,
					bao_cao,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the check-out");
			}
			setAttendanceStatus({ type: "success", message: "Check-out thanh cong." });
			await fetchAttendanceToday(nhan_vien_id);
			await fetchAttendanceHistory(nhan_vien_id);
		} catch (error) {
			setAttendanceStatus({ type: "error", message: error.message });
		}
	};

	const submitAttendanceReport = async ({ cham_cong_id, noi_dung }) => {
		if (!user?.id) {
			return false;
		}
		setAttendanceStatus({ type: "", message: "" });
		try {
			const response = await fetch(`${API_BASE}/api/v1/cham_cong/bao_cao`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					actor_id: user.id,
					cham_cong_id,
					noi_dung,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the gui bao cao");
			}
			setAttendanceStatus({ type: "success", message: "Gui bao cao thanh cong." });
			return true;
		} catch (error) {
			setAttendanceStatus({ type: "error", message: error.message });
			return false;
		}
	};

	const reviewAttendanceReport = async ({ cham_cong_id, action, ly_do }) => {
		if (!user?.id) {
			return false;
		}
		setAttendanceStatus({ type: "", message: "" });
		try {
			const endpoint =
				action === "approve"
					? `${API_BASE}/api/v1/cham_cong/bao_cao/${cham_cong_id}/duyet`
					: `${API_BASE}/api/v1/cham_cong/bao_cao/${cham_cong_id}/tu_choi`;
			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					actor_id: user.id,
					ly_do: ly_do || undefined,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the xu ly bao cao");
			}
			setAttendanceStatus({
				type: "success",
				message: action === "approve" ? "Da duyet bao cao." : "Da tu choi bao cao.",
			});
			return true;
		} catch (error) {
			setAttendanceStatus({ type: "error", message: error.message });
			return false;
		}
	};

	const resetLeaveForm = () => {
		setLeaveForm({
			loai_phep: "Phep nam",
			ngay_bat_dau: "",
			ngay_ket_thuc: "",
			ly_do: "",
			ghi_chu: "",
		});
	};

	const fetchLeaveRequests = async (pageOverride) => {
		if (!user?.id) {
			return;
		}
		setLeaveLoading(true);
		setLeaveStatus({ type: "", message: "" });
		try {
			const isAdminUser = (user?.vai_tro || "").toLowerCase().includes("admin");
			const nextPage = pageOverride ?? leavePage;
			const params = new URLSearchParams({
				page: String(nextPage),
				page_size: String(leavePageSize),
				actor_id: String(user.id),
			});
			if (leaveStatusFilter) {
				params.set("trang_thai", leaveStatusFilter);
			}
			if (!isAdminUser) {
				params.set("nhan_vien_id", String(user.id));
			}
			const response = await fetch(
				`${API_BASE}/api/v1/don_nghi_phep/danh_sach?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai don nghi phep");
			}
			setLeaveRows(data.data || []);
			setLeaveTotal(data.total || 0);
			setLeaveTotalPages(data.total_pages || 0);
			setLeavePage(data.page || nextPage);
		} catch (error) {
			setLeaveStatus({ type: "error", message: error.message });
		} finally {
			setLeaveLoading(false);
		}
	};

	const submitLeaveForm = async () => {
		if (!user?.id) {
			return;
		}
		setLeaveStatus({ type: "", message: "" });
		if (
			!leaveForm.loai_phep.trim() ||
			!leaveForm.ngay_bat_dau ||
			!leaveForm.ngay_ket_thuc ||
			!leaveForm.ly_do.trim()
		) {
			setLeaveStatus({ type: "error", message: "Vui long nhap day du thong tin." });
			return;
		}

		try {
			const response = await fetch(`${API_BASE}/api/v1/don_nghi_phep/gui_don`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nhan_vien_id: user.id,
					nguoi_tao_id: user.id,
					loai_phep: leaveForm.loai_phep,
					ngay_bat_dau: leaveForm.ngay_bat_dau,
					ngay_ket_thuc: leaveForm.ngay_ket_thuc,
					ly_do: leaveForm.ly_do,
					ghi_chu: leaveForm.ghi_chu || undefined,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the gui don nghi phep");
			}
			setLeaveStatus({ type: "success", message: "Gui don nghi phep thanh cong." });
			setLeaveFormOpen(false);
			resetLeaveForm();
			fetchLeaveRequests(1);
		} catch (error) {
			setLeaveStatus({ type: "error", message: error.message });
		}
	};

	const approveLeaveRequest = async (donId) => {
		if (!user?.id) {
			return;
		}
		setLeaveStatus({ type: "", message: "" });
		try {
			const response = await fetch(`${API_BASE}/api/v1/don_nghi_phep/${donId}/duyet`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nguoi_duyet_id: user.id,
					action: "duyet",
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the duyet don nghi phep");
			}
			setLeaveStatus({ type: "success", message: "Da duyet don nghi phep." });
			fetchLeaveRequests(leavePage);
		} catch (error) {
			setLeaveStatus({ type: "error", message: error.message });
		}
	};

	const rejectLeaveRequest = async (donId, reason) => {
		if (!user?.id) {
			return;
		}
		if (!reason || !reason.trim()) {
			setLeaveStatus({ type: "error", message: "Vui long nhap ly do tu choi." });
			return;
		}
		setLeaveStatus({ type: "", message: "" });
		try {
			const response = await fetch(`${API_BASE}/api/v1/don_nghi_phep/${donId}/duyet`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nguoi_duyet_id: user.id,
					action: "tu_choi",
					ly_do_tu_choi: reason,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tu choi don nghi phep");
			}
			setLeaveStatus({ type: "success", message: "Da tu choi don nghi phep." });
			fetchLeaveRequests(leavePage);
		} catch (error) {
			setLeaveStatus({ type: "error", message: error.message });
		}
	};

	const resetDepartmentForm = () => {
		setDepartmentEditingId(null);
		setDepartmentForm({ ten_phong: "", truong_phong_id: "" });
	};

	const resetEmployeeForm = () => {
		setEmployeeEditingId(null);
		setEmployeeForm({
			ho_ten: "",
			email: "",
			mat_khau: "",
			so_dien_thoai: "",
			gioi_tinh: "",
			ngay_sinh: "",
			phong_ban_id: "",
			chuc_vu: "",
			luong_co_ban: "",
			trang_thai_lam_viec: "Đang làm",
			vai_tro: "Nhân viên",
			ngay_vao_lam: "",
			avatar_url: "",
		});
	};

	const fetchEmployeeDepartments = async (force = false) => {
		if (!force && employeeDepartments.length > 0) {
			return;
		}
		setEmployeeDepartmentsLoading(true);
		try {
			const response = await fetch(
				`${API_BASE}/api/v1/phong_ban/danh_sach?page=1&page_size=200`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach phong ban");
			}
			setEmployeeDepartments(data.data || []);
		} catch (error) {
			setEmployeeStatus({ type: "error", message: error.message });
		} finally {
			setEmployeeDepartmentsLoading(false);
		}
	};

	const openCreateEmployee = () => {
		resetEmployeeForm();
		fetchEmployeeDepartments();
		setEmployeeFormOpen(true);
	};

	const openEditEmployee = (row) => {
		setEmployeeEditingId(row.id);
		fetchEmployeeDepartments();
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
		setEmployeeFormOpen(true);
	};

	const submitEmployeeForm = async () => {
		setEmployeeStatus({ type: "", message: "" });
		if (!employeeForm.ho_ten.trim() || !employeeForm.email.trim()) {
			setEmployeeStatus({ type: "error", message: "Vui long nhap ho ten va email." });
			return;
		}
		if (!employeeEditingId && !employeeForm.mat_khau.trim()) {
			setEmployeeStatus({ type: "error", message: "Vui long nhap mat khau." });
			return;
		}

		try {
			const payload = {
				...employeeForm,
				phong_ban_id: employeeForm.phong_ban_id
					? Number(employeeForm.phong_ban_id)
					: null,
				luong_co_ban: employeeForm.luong_co_ban
					? Number(employeeForm.luong_co_ban)
					: null,
			};

			if (employeeEditingId) {
				await fetch(`${API_BASE}/api/v1/nhanvien/${employeeEditingId}?actor=admin`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
			} else {
				await fetch(`${API_BASE}/api/v1/nhanvien`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
			}

			setEmployeeFormOpen(false);
			resetEmployeeForm();
			fetchEmployees(1);
		} catch (error) {
			setEmployeeStatus({ type: "error", message: error.message });
		}
	};

	const deleteEmployee = async (row) => {
		setDeleteTarget(row);
	};

	const confirmDeleteEmployee = async () => {
		if (!deleteTarget) {
			return;
		}
		try {
			await fetch(`${API_BASE}/api/v1/nhanvien/${deleteTarget.id}`, { method: "DELETE" });
			fetchEmployees(employeePage);
		} catch (error) {
			setEmployeeStatus({ type: "error", message: error.message });
		} finally {
			setDeleteTarget(null);
		}
	};

	const fetchEmployees = async (pageOverride) => {
		setEmployeeLoading(true);
		setEmployeeStatus({ type: "", message: "" });
		try {
			const nextPage = pageOverride ?? employeePage;
			const params = new URLSearchParams();
			if (employeeQuery.trim()) {
				params.set("q", employeeQuery.trim());
			}
			params.set("page", String(nextPage));
			params.set("page_size", String(employeePageSize));
			const response = await fetch(`${API_BASE}/api/v1/nhanvien?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach nhan vien");
			}
			setEmployeeRows(data.data || []);
			setEmployeeTotal(data.total || 0);
			setEmployeeTotalPages(data.total_pages || 0);
			setEmployeePage(data.page || nextPage);
			if (!data.data || data.data.length === 0) {
				setEmployeeStatus({ type: "info", message: "Khong co nhan vien nao." });
			}
		} catch (error) {
			setEmployeeStatus({ type: "error", message: error.message });
		} finally {
			setEmployeeLoading(false);
		}
	};

	const fetchProjects = async (pageOverride) => {
		setProjectLoading(true);
		setProjectStatus({ type: "", message: "" });
		try {
			const nextPage = pageOverride ?? projectPage;
			const params = new URLSearchParams();
			if (projectQuery.trim()) {
				params.set("q", projectQuery.trim());
			}
			if (projectStatusFilter) {
				params.set("trang_thai", projectStatusFilter);
			}
			params.set("page", String(nextPage));
			params.set("page_size", String(projectPageSize));
			const actor = (user?.vai_tro || "").toLowerCase().includes("admin")
				? "admin"
				: "employee";
			params.set("actor", actor);
			if (actor === "employee" && user?.id) {
				params.set("nhan_vien_id", String(user.id));
			}
			const response = await fetch(
				`${API_BASE}/api/v1/du_an/danh_sach?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach du an");
			}
			setProjectRows(data.data || []);
			setProjectTotal(data.total || 0);
			setProjectTotalPages(data.total_pages || 0);
			setProjectPage(data.page || nextPage);
			if (!data.data || data.data.length === 0) {
				setProjectStatus({ type: "info", message: "Khong co du an nao." });
			}
		} catch (error) {
			setProjectStatus({ type: "error", message: error.message });
		} finally {
			setProjectLoading(false);
		}
	};

	const fetchTasks = async (pageOverride) => {
		setTaskLoading(true);
		setTaskStatus({ type: "", message: "" });
		try {
			const nextPage = pageOverride ?? taskPage;
			const params = new URLSearchParams();
			if (taskQuery.trim()) {
				params.set("q", taskQuery.trim());
			}
			if (taskStatusFilter) {
				params.set("trang_thai", taskStatusFilter);
			}
			params.set("sort_by", taskSort);
			params.set("scope", "all");
			params.set("page", String(nextPage));
			params.set("page_size", String(taskPageSize));
			const actor = (user?.vai_tro || "").toLowerCase().includes("admin")
				? "admin"
				: "employee";
			params.set("actor", actor);
			if (actor === "employee" && user?.id) {
				params.set("nhan_vien_id", String(user.id));
			}
			const response = await fetch(
				`${API_BASE}/api/v1/cong_viec/danh_sach?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach cong viec");
			}
			setTaskRows(data.data || []);
			setTaskTotal(data.total || 0);
			setTaskTotalPages(data.total_pages || 0);
			setTaskPage(data.page || nextPage);
			if (!data.data || data.data.length === 0) {
				setTaskStatus({ type: "info", message: "Khong co cong viec nao." });
			}
		} catch (error) {
			setTaskStatus({ type: "error", message: error.message });
		} finally {
			setTaskLoading(false);
		}
	};

	const fetchDepartments = async (pageOverride) => {
		setDepartmentLoading(true);
		setDepartmentStatus({ type: "", message: "" });
		try {
			const nextPage = pageOverride ?? departmentPage;
			const params = new URLSearchParams();
			if (departmentQuery.trim()) {
				params.set("q", departmentQuery.trim());
			}
			params.set("page", String(nextPage));
			params.set("page_size", String(departmentPageSize));
			const response = await fetch(
				`${API_BASE}/api/v1/phong_ban/danh_sach?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach phong ban");
			}
			setDepartmentRows(data.data || []);
			setDepartmentTotal(data.total || 0);
			setDepartmentTotalPages(data.total_pages || 0);
			setDepartmentPage(data.page || nextPage);
			if (!data.data || data.data.length === 0) {
				setDepartmentStatus({ type: "info", message: "Khong co phong ban nao." });
			}
		} catch (error) {
			setDepartmentStatus({ type: "error", message: error.message });
		} finally {
			setDepartmentLoading(false);
		}
	};

	const fetchDepartmentLeaders = async (force = false) => {
		if (!force && departmentLeaders.length > 0) {
			return;
		}
		setDepartmentLeadersLoading(true);
		try {
			const response = await fetch(`${API_BASE}/api/v1/nhanvien?page=1&page_size=200`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach nhan vien");
			}
			setDepartmentLeaders(data.data || []);
		} catch (error) {
			setDepartmentStatus({ type: "error", message: error.message });
		} finally {
			setDepartmentLeadersLoading(false);
		}
	};

	const openCreateDepartment = () => {
		resetDepartmentForm();
		fetchDepartmentLeaders();
		setDepartmentFormOpen(true);
	};

	const openEditDepartment = (row) => {
		setDepartmentEditingId(row.id);
		fetchDepartmentLeaders();
		setDepartmentForm({
			ten_phong: row.ten_phong || "",
			truong_phong_id: row.truong_phong_id ?? "",
		});
		setDepartmentFormOpen(true);
	};

	const closeDepartmentAction = () => {
		setDepartmentFormOpen(false);
		resetDepartmentForm();
		setDepartmentActionTarget(null);
		setDepartmentTransferId("");
	};

	const submitDepartmentForm = async () => {
		setDepartmentStatus({ type: "", message: "" });
		if (!departmentForm.ten_phong.trim()) {
			setDepartmentStatus({ type: "error", message: "Vui lòng nhập tên phòng ban." });
			return;
		}

		const payload = {
			ten_phong: departmentForm.ten_phong.trim(),
			truong_phong_id: departmentForm.truong_phong_id
				? Number(departmentForm.truong_phong_id)
				: null,
		};

		try {
			const endpoint = departmentEditingId
				? `${API_BASE}/api/v1/phong_ban/${departmentEditingId}/cap_nhat`
				: `${API_BASE}/api/v1/phong_ban/tao_moi`;
			const method = departmentEditingId ? "PUT" : "POST";
			const response = await fetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.detail || "Không thể lưu phòng ban.");
			}
			setDepartmentFormOpen(false);
			resetDepartmentForm();
			setEmployeeDepartments([]);
			setProjectDepartments([]);
			fetchDepartments(1);
			setDepartmentStatus({ type: "success", message: "Lưu phòng ban thành công." });
		} catch (error) {
			setDepartmentStatus({ type: "error", message: error.message });
		}
	};

	const requestDepartmentAction = (row) => {
		setDepartmentActionTarget(row);
		setDepartmentTransferId("");
	};

	const confirmDepartmentAction = async () => {
		if (!departmentActionTarget) {
			return;
		}
		const hasEmployees = (departmentActionTarget.so_nhan_vien || 0) > 0;
		if (hasEmployees) {
			if (!departmentTransferId) {
				setDepartmentStatus({
					type: "error",
					message: "Vui lòng chọn phòng ban chuyển đến.",
				});
				return;
			}
		}

		try {
			const endpoint = `${API_BASE}/api/v1/phong_ban/${departmentActionTarget.id}/xoa`;
			const method = "DELETE";

			const payload = departmentTransferId
				? { transfer_id: Number(departmentTransferId) }
				: undefined;
			const response = await fetch(endpoint, {
				method,
				headers: payload ? { "Content-Type": "application/json" } : undefined,
				body: payload ? JSON.stringify(payload) : undefined,
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				const message = data.detail?.message || data.detail || "Không thể thực hiện thao tác.";
				throw new Error(message);
			}
			closeDepartmentAction();
			fetchDepartments(departmentPage);
			setDepartmentStatus({ type: "success", message: "Xóa phòng ban thành công." });
		} catch (error) {
			setDepartmentStatus({ type: "error", message: error.message });
		}
	};

	const resetTaskForm = () => {
		setTaskFormStatus({ type: "", message: "" });
		setTaskAssignees([]);
		setTaskFollowers([]);
		setTaskForm({
			ten_cong_viec: "",
			mo_ta: "",
			du_an_id: "",
			ngay_bat_dau: "",
			han_hoan_thanh: "",
			muc_do_uu_tien: "Trung binh",
			trang_thai: "Chua bat dau",
			tai_lieu_cv: "",
		});
	};

	const fetchTaskEmployees = async (force = false) => {
		if (!force && taskEmployees.length > 0) {
			return;
		}
		setTaskEmployeesLoading(true);
		try {
			const response = await fetch(`${API_BASE}/api/v1/nhanvien?page=1&page_size=200`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach nhan vien");
			}
			setTaskEmployees(data.data || []);
		} catch (error) {
			setTaskFormStatus({ type: "error", message: error.message });
		} finally {
			setTaskEmployeesLoading(false);
		}
	};

	const fetchTaskProjects = async () => {
		if (taskProjects.length > 0) {
			return;
		}
		setTaskProjectsLoading(true);
		try {
			const params = new URLSearchParams({
				page: "1",
				page_size: "200",
			});
			const actor = (user?.vai_tro || "").toLowerCase().includes("admin")
				? "admin"
				: "employee";
			params.set("actor", actor);
			if (actor === "employee" && user?.id) {
				params.set("nhan_vien_id", String(user.id));
			}
			const response = await fetch(
				`${API_BASE}/api/v1/du_an/danh_sach?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach du an");
			}
			setTaskProjects(data.data || []);
		} catch (error) {
			setTaskFormStatus({ type: "error", message: error.message });
		} finally {
			setTaskProjectsLoading(false);
		}
	};

	const openCreateTask = () => {
		resetTaskForm();
		const isAdminUser = (user?.vai_tro || "").toLowerCase().includes("admin");
		if (isAdminUser) {
			fetchTaskEmployees();
		} else if (user?.id) {
			setTaskEmployees([
				{
					id: user.id,
					ho_ten: user.ho_ten || "Nhân viên",
				},
			]);
			setTaskAssignees([user.id]);
		}
		fetchTaskProjects();
		setTaskFormOpen(true);
	};

	const toggleAssignee = (employeeId) => {
		setTaskAssignees((prev) =>
			prev.includes(employeeId)
				? prev.filter((id) => id !== employeeId)
				: [...prev, employeeId]
		);
	};

	const toggleFollower = (employeeId) => {
		setTaskFollowers((prev) =>
			prev.includes(employeeId)
				? prev.filter((id) => id !== employeeId)
				: [...prev, employeeId]
		);
	};

	const submitTaskForm = async () => {
		setTaskFormStatus({ type: "", message: "" });
		if (!taskForm.ten_cong_viec.trim() || !taskForm.mo_ta.trim()) {
			setTaskFormStatus({ type: "error", message: "Vui long nhap ten va mo ta." });
			return;
		}
		if (!taskForm.ngay_bat_dau || !taskForm.han_hoan_thanh) {
			setTaskFormStatus({ type: "error", message: "Vui long chon thoi gian." });
			return;
		}
		if (new Date(taskForm.han_hoan_thanh) < new Date(taskForm.ngay_bat_dau)) {
			setTaskFormStatus({ type: "error", message: "Deadline phai sau ngay bat dau." });
			return;
		}
		if (taskAssignees.length === 0) {
			setTaskFormStatus({ type: "error", message: "Vui long chon nguoi nhan." });
			return;
		}
		if (!user?.id) {
			setTaskFormStatus({ type: "error", message: "Khong xac dinh nguoi dung." });
			return;
		}

		const payload = {
			...taskForm,
			du_an_id: taskForm.du_an_id ? Number(taskForm.du_an_id) : null,
			nguoi_giao_id: user.id,
			nguoi_nhan_ids: taskAssignees,
			nguoi_theo_doi_ids: taskFollowers,
		};

		try {
			const response = await fetch(`${API_BASE}/api/v1/cong_viec/tao_moi`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tao cong viec");
			}
			setTaskFormOpen(false);
			resetTaskForm();
			fetchTasks(1);
			setTaskStatus({ type: "success", message: "Tao cong viec thanh cong." });
		} catch (error) {
			setTaskFormStatus({ type: "error", message: error.message });
		}
	};

	const openProgressModal = (row) => {
		setTaskProgressTarget(row);
		setTaskProgressForm({
			trang_thai: row.trang_thai || "Dang thuc hien",
			phan_tram: 0,
		});
		setTaskProgressOpen(true);
	};

	const submitTaskProgress = async () => {
		if (!taskProgressTarget) {
			return;
		}
		try {
			const response = await fetch(
				`${API_BASE}/api/v1/cong_viec/${taskProgressTarget.id}/cap_nhat_tien_do`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(taskProgressForm),
				}
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the cap nhat tien do");
			}
			setTaskProgressOpen(false);
			setTaskProgressTarget(null);
			fetchTasks(taskPage);
			setTaskStatus({ type: "success", message: "Cap nhat tien do thanh cong." });
		} catch (error) {
			setTaskStatus({ type: "error", message: error.message });
		}
	};

	const resetProjectForm = () => {
		setProjectEditingId(null);
		setProjectFormStatus({ type: "", message: "" });
		setProjectForm({
			ten_du_an: "",
			mo_ta: "",
			ngay_bat_dau: "",
			ngay_ket_thuc: "",
			lead_id: "",
			nhom_du_an: "",
			phong_ban: "",
			muc_do_uu_tien: "",
			trang_thai_duan: "Đang thực hiện",
		});
	};

	const fetchProjectEmployees = async () => {
		if (projectEmployees.length > 0) {
			return;
		}
		setProjectEmployeesLoading(true);
		try {
			const response = await fetch(`${API_BASE}/api/v1/nhanvien?page=1&page_size=200`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach nhan vien");
			}
			setProjectEmployees(data.data || []);
		} catch (error) {
			setProjectFormStatus({ type: "error", message: error.message });
		} finally {
			setProjectEmployeesLoading(false);
		}
	};

	const fetchProjectDepartments = async (force = false) => {
		if (!force && projectDepartments.length > 0) {
			return;
		}
		setProjectDepartmentsLoading(true);
		try {
			const response = await fetch(
				`${API_BASE}/api/v1/phong_ban/danh_sach?page=1&page_size=200`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach phong ban");
			}
			setProjectDepartments(data.data || []);
		} catch (error) {
			setProjectFormStatus({ type: "error", message: error.message });
		} finally {
			setProjectDepartmentsLoading(false);
		}
	};

	const openCreateProject = () => {
		resetProjectForm();
		fetchProjectEmployees();
		fetchProjectDepartments();
		setProjectFormOpen(true);
	};

	const openEditProject = async (row) => {
		setProjectFormStatus({ type: "", message: "" });
		fetchProjectEmployees();
		fetchProjectDepartments();
		try {
			const response = await fetch(`${API_BASE}/api/v1/du_an/${row.id}/chi_tiet`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai du an");
			}
			setProjectEditingId(row.id);
			setProjectForm({
				ten_du_an: data.ten_du_an || "",
				mo_ta: data.mo_ta || "",
				ngay_bat_dau: data.ngay_bat_dau || "",
				ngay_ket_thuc: data.ngay_ket_thuc || "",
				lead_id: data.lead_id ? String(data.lead_id) : "",
				nhom_du_an: data.nhom_du_an || "",
				phong_ban: data.phong_ban || "",
				muc_do_uu_tien: data.muc_do_uu_tien || "",
				trang_thai_duan: data.trang_thai_duan || "Đang thực hiện",
			});
			setProjectFormOpen(true);
		} catch (error) {
			setProjectFormStatus({ type: "error", message: error.message });
		}
	};

	const submitProjectForm = async () => {
		setProjectFormStatus({ type: "", message: "" });
		if (!projectForm.ten_du_an.trim()) {
			setProjectFormStatus({ type: "error", message: "Vui long nhap ten du an." });
			return;
		}
		if (!projectForm.mo_ta.trim()) {
			setProjectFormStatus({ type: "error", message: "Vui long nhap mo ta du an." });
			return;
		}
		if (!projectForm.ngay_bat_dau || !projectForm.ngay_ket_thuc) {
			setProjectFormStatus({ type: "error", message: "Vui long chon thoi gian du an." });
			return;
		}
		if (!projectForm.lead_id) {
			setProjectFormStatus({ type: "error", message: "Vui long chon Leader." });
			return;
		}
		const leaderId = Number(projectForm.lead_id);

		const payload = {
			...projectForm,
			lead_id: leaderId,
		};

		try {
			if (projectEditingId) {
				const response = await fetch(
					`${API_BASE}/api/v1/du_an/${projectEditingId}/cap_nhat`,
					{
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
					}
				);
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.detail || "Khong the cap nhat du an");
				}
			} else {
				const response = await fetch(`${API_BASE}/api/v1/du_an/tao_moi`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.detail || "Khong the tao du an");
				}
			}

			setProjectFormOpen(false);
			resetProjectForm();
			fetchProjects(1);
			setProjectStatus({ type: "success", message: "Luu du an thanh cong." });
		} catch (error) {
			setProjectFormStatus({ type: "error", message: error.message });
		}
	};

	const requestDeleteProject = (row) => {
		setProjectDeleteTarget(row);
	};

	const confirmDeleteProject = async () => {
		if (!projectDeleteTarget) {
			return;
		}
		try {
			const response = await fetch(
				`${API_BASE}/api/v1/du_an/${projectDeleteTarget.id}/xoa?force=true`,
				{ method: "DELETE" }
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the xoa du an");
			}
			fetchProjects(projectPage);
		} catch (error) {
			setProjectStatus({ type: "error", message: error.message });
		} finally {
			setProjectDeleteTarget(null);
		}
	};

	const menuItems = [
		{ label: "Bảng điều khiển", icon: "chart", to: "/dashboard" },
		{ label: "Dự án", icon: "project", to: "/projects" },
		{ label: "Công việc", icon: "task", to: "/tasks" },
		{ label: "Phòng ban", icon: "office", to: "/departments" },
		{ label: "Chấm công", icon: "calendar", to: "/attendance" },
		{ label: "Nghỉ phép", icon: "leave", to: "/leave" },
		{ label: "Tính KPI", icon: "report", to: "/kpi-calculator" },
		{ label: "Tính lương", icon: "salary", to: "/salary-calculator" },
	];

	const adminMenuItems = [
		{ label: "Dashboard", icon: "chart", to: "/dashboard" },
		{ label: "Nhân sự", icon: "people", to: "/employees" },
		{ label: "Dự án", icon: "project", to: "/projects" },
		{ label: "Công việc", icon: "task", to: "/tasks" },
		{ label: "Phòng ban", icon: "office", to: "/departments" },
		{ label: "Chấm công", icon: "calendar", to: "/attendance" },
		{ label: "Nghỉ phép", icon: "leave", to: "/leave" },
		{ label: "Tính KPI", icon: "report", to: "/kpi-calculator" },
		{ label: "Tính lương", icon: "salary", to: "/salary-calculator" },
	];

	const iconMap = {
		chart: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 19h16v2H2V5h2v14Zm4-6h3v4H8v-4Zm5-6h3v10h-3V7Zm5 3h3v7h-3v-7Z" />
			</svg>
		),
		people: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M7 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm10-1a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 21v-1a6 6 0 0 1 12 0v1H2Zm14 0v-1a5 5 0 0 1 6 4v-3a4 4 0 0 0-6 0Z" />
			</svg>
		),
		project: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 6h7l2 2h7v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v10h16V10H12l-2-2H4Z" />
			</svg>
		),
		office: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 4h10v16H4V4Zm12 4h4v12h-4V8ZM6 6v2h2V6H6Zm0 4v2h2v-2H6Zm0 4v2h2v-2H6Zm4-8v2h2V6h-2Zm0 4v2h2v-2h-2Zm0 4v2h2v-2h-2Z" />
			</svg>
		),
		task: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M9 3h12v2H9V3Zm0 8h12v2H9v-2Zm0 8h12v2H9v-2ZM3 4l2-2 1.5 1.5L4 6 3 4Zm0 8 2-2 1.5 1.5L4 14 3 12Zm0 8 2-2 1.5 1.5L4 22 3 20Z" />
			</svg>
		),
		calendar: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M7 2h2v3H7V2Zm8 0h2v3h-2V2ZM4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 4v10h16V10H4Zm3 3h4v4H7v-4Z" />
			</svg>
		),
		leave: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M6 2h12v2H6V2Zm1 4h10l1 14H6L7 6Zm3 3v6h2V9h-2Zm4 0v6h2V9h-2Z" />
			</svg>
		),
		schedule: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm1 5h-2v6l5 3 1-1.7-4-2.3V7Z" />
			</svg>
		),
		salary: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M3 6h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v8h18V8H3Zm9 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
			</svg>
		),
		report: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 4h14l2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v14h14V7.5L16.5 6H4Zm3 4h8v2H7v-2Zm0 4h8v2H7v-2Z" />
			</svg>
		),
		library: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 4h8v16H4V4Zm10 0h6v16h-6V4ZM6 6v12h4V6H6Zm10 0v12h2V6h-2Z" />
			</svg>
		),
	};

	const isAdmin = (user?.vai_tro || "").toLowerCase().includes("admin");
	const isManager = (user?.vai_tro || "").toLowerCase().includes("quản lý");

	if (!user) {
		return (
			<Routes>
				<Route
					path="/login"
					element={
						<LoginPage
							identifier={identifier}
							password={password}
							status={status}
							loading={loading}
							onIdentifierChange={setIdentifier}
							onPasswordChange={setPassword}
							onSubmit={handleSubmit}
						/>
					}
				/>
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		);
	}

	return (
		<Routes>
			<Route
				element={
					<AppLayout
						user={user}
						menuItems={isAdmin ? adminMenuItems : menuItems}
						iconMap={iconMap}
						onLogout={handleLogout}
					/>
				}
			>
				<Route path="/" element={<Navigate to="/dashboard" replace />} />
				<Route path="/dashboard" element={<DashboardPage user={user} isAdmin={isAdmin} />} />
				<Route
					path="/attendance"
					element={
						<AttendancePage
							user={user}
							isAdmin={isAdmin}
							attendanceToday={attendanceToday}
							attendanceHistory={attendanceHistory}
							attendanceStatus={attendanceStatus}
							attendanceLoading={attendanceLoading}
							fetchAttendanceToday={fetchAttendanceToday}
							fetchAttendanceHistory={fetchAttendanceHistory}
							submitCheckIn={submitCheckIn}
							submitCheckOut={submitCheckOut}
							submitAttendanceReport={submitAttendanceReport}
							reviewAttendanceReport={reviewAttendanceReport}
						/>
					}
				/>
				<Route
					path="/leave"
					element={
						<LeavePage
							user={user}
							isAdmin={isAdmin}
							leaveRows={leaveRows}
							leaveTotal={leaveTotal}
							leaveStatusFilter={leaveStatusFilter}
							leaveStatus={leaveStatus}
							leaveLoading={leaveLoading}
							leaveFormOpen={leaveFormOpen}
							leaveForm={leaveForm}
							setLeaveFormOpen={setLeaveFormOpen}
							setLeaveForm={setLeaveForm}
							setLeaveStatusFilter={setLeaveStatusFilter}
							resetLeaveForm={resetLeaveForm}
							fetchLeaveRequests={fetchLeaveRequests}
							submitLeaveForm={submitLeaveForm}
							approveLeaveRequest={approveLeaveRequest}
							rejectLeaveRequest={rejectLeaveRequest}
						/>
					}
				/>
				<Route
					path="/projects"
					element={
						<ProjectsPage
							isAdmin={isAdmin}
							projectRows={projectRows}
							projectTotal={projectTotal}
							projectQuery={projectQuery}
							projectStatusFilter={projectStatusFilter}
							projectStatus={projectStatus}
							projectLoading={projectLoading}
							projectPage={projectPage}
							projectPageSize={projectPageSize}
							projectTotalPages={projectTotalPages}
							projectFormOpen={projectFormOpen}
							projectEditingId={projectEditingId}
							projectForm={projectForm}
							projectEmployees={projectEmployees}
							projectEmployeesLoading={projectEmployeesLoading}
							projectDepartments={projectDepartments}
							projectDepartmentsLoading={projectDepartmentsLoading}
							projectFormStatus={projectFormStatus}
							projectDeleteTarget={projectDeleteTarget}
							setProjectQuery={setProjectQuery}
							setProjectStatusFilter={setProjectStatusFilter}
							setProjectPageSize={setProjectPageSize}
							setProjectFormOpen={setProjectFormOpen}
							setProjectForm={setProjectForm}
							resetProjectForm={resetProjectForm}
							fetchProjects={fetchProjects}
							openCreateProject={openCreateProject}
							openEditProject={openEditProject}
							submitProjectForm={submitProjectForm}
							requestDeleteProject={requestDeleteProject}
							confirmDeleteProject={confirmDeleteProject}
							setProjectDeleteTarget={setProjectDeleteTarget}
						/>
					}
				/>
				<Route
					path="/tasks"
					element={
						<TasksPage
							user={user}
							isAdmin={isAdmin}
							taskRows={taskRows}
							taskTotal={taskTotal}
							taskQuery={taskQuery}
							taskStatusFilter={taskStatusFilter}
							taskSort={taskSort}
							taskStatus={taskStatus}
							taskLoading={taskLoading}
							taskPage={taskPage}
							taskPageSize={taskPageSize}
							taskTotalPages={taskTotalPages}
							taskFormOpen={taskFormOpen}
							taskFormStatus={taskFormStatus}
							taskAssignees={taskAssignees}
							taskFollowers={taskFollowers}
							taskEmployees={taskEmployees}
							taskProjects={taskProjects}
							taskProjectsLoading={taskProjectsLoading}
							taskEmployeesLoading={taskEmployeesLoading}
							taskProgressOpen={taskProgressOpen}
							taskProgressForm={taskProgressForm}
							taskForm={taskForm}
							setTaskQuery={setTaskQuery}
							setTaskStatusFilter={setTaskStatusFilter}
							setTaskSort={setTaskSort}
							setTaskFormOpen={setTaskFormOpen}
							setTaskForm={setTaskForm}
							setTaskAssignees={setTaskAssignees}
							setTaskProgressForm={setTaskProgressForm}
							setTaskProgressOpen={setTaskProgressOpen}
							resetTaskForm={resetTaskForm}
							fetchTasks={fetchTasks}
							fetchTaskEmployees={fetchTaskEmployees}
							openCreateTask={openCreateTask}
							toggleAssignee={toggleAssignee}
							toggleFollower={toggleFollower}
							submitTaskForm={submitTaskForm}
							openProgressModal={openProgressModal}
							submitTaskProgress={submitTaskProgress}
							setTaskPageSize={setTaskPageSize}
							setTaskProgressTarget={setTaskProgressTarget}
						/>
					}
				/>
				<Route
					path="/departments"
					element={
						<DepartmentsPage
							departmentRows={departmentRows}
							departmentTotal={departmentTotal}
							departmentQuery={departmentQuery}
							departmentStatus={departmentStatus}
							departmentLoading={departmentLoading}
							departmentPage={departmentPage}
							departmentPageSize={departmentPageSize}
							departmentTotalPages={departmentTotalPages}
							departmentFormOpen={departmentFormOpen}
							departmentEditingId={departmentEditingId}
							departmentForm={departmentForm}
							departmentLeaders={departmentLeaders}
							departmentLeadersLoading={departmentLeadersLoading}
							departmentActionTarget={departmentActionTarget}
							departmentTransferId={departmentTransferId}
							setDepartmentQuery={setDepartmentQuery}
							setDepartmentPageSize={setDepartmentPageSize}
							setDepartmentForm={setDepartmentForm}
							setDepartmentTransferId={setDepartmentTransferId}
							fetchDepartments={fetchDepartments}
							openCreateDepartment={openCreateDepartment}
							openEditDepartment={openEditDepartment}
							submitDepartmentForm={submitDepartmentForm}
							requestDepartmentAction={requestDepartmentAction}
							confirmDepartmentAction={confirmDepartmentAction}
							closeDepartmentAction={closeDepartmentAction}
						/>
					}
				/>
				<Route
					path="/kpi-calculator"
					element={<KpiCalculatorPage user={user} isAdmin={isAdmin} isManager={isManager} />}
				/>
				<Route
					path="/salary-calculator"
					element={<SalaryCalculatorPage user={user} isAdmin={isAdmin} isManager={isManager} />}
				/>
				<Route
					path="/employees"
					element={
						isAdmin ? (
							<EmployeesPage
								employeeRows={employeeRows}
								employeeTotal={employeeTotal}
								employeeQuery={employeeQuery}
								employeeStatus={employeeStatus}
								employeeLoading={employeeLoading}
								employeePage={employeePage}
								employeePageSize={employeePageSize}
								employeeTotalPages={employeeTotalPages}
								employeeFormOpen={employeeFormOpen}
								employeeEditingId={employeeEditingId}
								employeeForm={employeeForm}
								employeeDepartments={employeeDepartments}
								employeeDepartmentsLoading={employeeDepartmentsLoading}
								deleteTarget={deleteTarget}
								setEmployeeQuery={setEmployeeQuery}
								setEmployeeFormOpen={setEmployeeFormOpen}
								setEmployeeForm={setEmployeeForm}
								setEmployeeEditingId={setEmployeeEditingId}
								setEmployeePageSize={setEmployeePageSize}
								resetEmployeeForm={resetEmployeeForm}
								fetchEmployees={fetchEmployees}
								fetchEmployeeDepartments={fetchEmployeeDepartments}
								openCreateEmployee={openCreateEmployee}
								openEditEmployee={openEditEmployee}
								submitEmployeeForm={submitEmployeeForm}
								deleteEmployee={deleteEmployee}
								confirmDeleteEmployee={confirmDeleteEmployee}
								setDeleteTarget={setDeleteTarget}
							/>
						) : (
							<Navigate to="/dashboard" replace />
						)
					}
				/>
			</Route>
			<Route path="/login" element={<Navigate to="/dashboard" replace />} />
			<Route path="*" element={<Navigate to="/dashboard" replace />} />
		</Routes>
	);
}

export default App;
