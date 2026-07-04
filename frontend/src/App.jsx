import React, { useCallback, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./styles/login.css";

import AppLayout from "./components/AppLayout";
import AttendancePage from "./pages/AttendancePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import DashboardPage from "./pages/DashboardPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import EmployeesPage from "./pages/EmployeesPage";
import LeavePage from "./pages/LeavePage";
import LeaveStatsPage from "./pages/LeaveStatsPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectsPage from "./pages/ProjectsPage";
import SalaryCalculatorPage from "./pages/SalaryCalculatorPage";
import TasksPage from "./pages/TasksPage";
import KpiCalculatorPage from "./pages/KpiCalculatorPage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const REMEMBER_LOGIN_KEY = "ics_hrms_remember_login";

const getRememberedLogin = () => {
	try {
		return localStorage.getItem(REMEMBER_LOGIN_KEY) || "";
	} catch (error) {
		return "";
	}
};

function App() {
	const navigate = useNavigate();
	const [identifier, setIdentifier] = useState(() => getRememberedLogin());
	const [password, setPassword] = useState("");
	const [rememberLogin, setRememberLogin] = useState(() => Boolean(getRememberedLogin()));
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
	const [leaveStatusFilter, setLeaveStatusFilter] = useState("");
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
	const [employeePermissions, setEmployeePermissions] = useState([]);
	const [employeePermissionsLoading, setEmployeePermissionsLoading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [projectRows, setProjectRows] = useState([]);
	const [projectTotal, setProjectTotal] = useState(0);
	const [projectQuery, setProjectQuery] = useState("");
	const [projectStatusFilter, setProjectStatusFilter] = useState("");
	const [projectPriorityFilter, setProjectPriorityFilter] = useState("");
	const [projectLeadFilter, setProjectLeadFilter] = useState("");
	const [projectStatus, setProjectStatus] = useState({ type: "", message: "" });
	const [projectLoading, setProjectLoading] = useState(false);
	const [projectPage, setProjectPage] = useState(1);
	const [projectPageSize, setProjectPageSize] = useState(10);
	const [projectTotalPages, setProjectTotalPages] = useState(0);
	const [projectFormOpen, setProjectFormOpen] = useState(false);
	const [projectEditingId, setProjectEditingId] = useState(null);
	const [projectFormReadOnly, setProjectFormReadOnly] = useState(false);
	const [projectFormStatus, setProjectFormStatus] = useState({ type: "", message: "" });
	const [projectEmployees, setProjectEmployees] = useState([]);
	const [projectEmployeesLoading, setProjectEmployeesLoading] = useState(false);
	const [projectDepartments, setProjectDepartments] = useState([]);
	const [projectDepartmentsLoading, setProjectDepartmentsLoading] = useState(false);
	const [projectDeleteTarget, setProjectDeleteTarget] = useState(null);
	const [taskRows, setTaskRows] = useState([]);
	const [assignedSubtasks, setAssignedSubtasks] = useState([]);
	const [taskTotal, setTaskTotal] = useState(0);
	const [taskQuery, setTaskQuery] = useState("");
	const [taskStatusFilter, setTaskStatusFilter] = useState("");
	const [taskProjectFilter, setTaskProjectFilter] = useState("");
	const [taskSort, setTaskSort] = useState("deadline");
	const [taskStatus, setTaskStatus] = useState({ type: "", message: "" });
	const [taskLoading, setTaskLoading] = useState(false);
	const [taskPage, setTaskPage] = useState(1);
	const [taskPageSize, setTaskPageSize] = useState(10);
	const [taskTotalPages, setTaskTotalPages] = useState(0);
	const [taskFormOpen, setTaskFormOpen] = useState(false);
	const [taskFormStatus, setTaskFormStatus] = useState({ type: "", message: "" });
	const [taskAssignees, setTaskAssignees] = useState([]);
	const [taskUploadFile, setTaskUploadFile] = useState(null);
	const [taskEmployees, setTaskEmployees] = useState([]);
	const [taskEmployeesLoading, setTaskEmployeesLoading] = useState(false);
	const [taskProjects, setTaskProjects] = useState([]);
	const [taskProjectsLoading, setTaskProjectsLoading] = useState(false);
	const [taskDetailOpen, setTaskDetailOpen] = useState(false);
	const [taskDetailTarget, setTaskDetailTarget] = useState(null);
	const [assignedStepId, setAssignedStepId] = useState(null);
	const [taskEditingId, setTaskEditingId] = useState(null);
	const [taskWorkflowSteps, setTaskWorkflowSteps] = useState([]);
	const [taskWorkflowLoading, setTaskWorkflowLoading] = useState(false);
	const [taskHistoryLogs, setTaskHistoryLogs] = useState([]);
	const [taskHistoryLoading, setTaskHistoryLoading] = useState(false);
	const [taskForm, setTaskForm] = useState({
		ten_cong_viec: "",
		mo_ta: "",
		du_an_id: "",
		nguoi_giao_id: "",
		ngay_bat_dau: "",
		han_hoan_thanh: "",
		muc_do_uu_tien: "Trung bình",
		trang_thai: "Chưa bắt đầu",
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
	const [selectedDepartment, setSelectedDepartment] = useState(null);
	const [departmentEmployees, setDepartmentEmployees] = useState([]);
	const [departmentEmployeesLoading, setDepartmentEmployeesLoading] = useState(false);
	const [departmentEmployeesStatus, setDepartmentEmployeesStatus] = useState({ type: "", message: "" });
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
		quyen_ids: [],
	});

	const handleSubmit = async (event) => {
		event.preventDefault();
		setStatus({ type: "", message: "" });

		if (!identifier.trim() || !password.trim()) {
			setStatus({ type: "error", message: "Vui lòng nhập đầy đủ thông tin." });
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
				throw new Error(data.detail || "Đăng nhập thất bại");
			}

			setUser(data.user);
			setAttendanceToday(null);
			setAttendanceHistory([]);
			setAttendanceStatus({ type: "", message: "" });
			if (rememberLogin) {
				localStorage.setItem(REMEMBER_LOGIN_KEY, identifier.trim());
			} else {
				localStorage.removeItem(REMEMBER_LOGIN_KEY);
			}
			setStatus({ type: "", message: "" });
			navigate("/dashboard");
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		} finally {
			setLoading(false);
		}
	};

	const handleRememberLoginChange = (checked) => {
		setRememberLogin(checked);
		if (!checked) {
			localStorage.removeItem(REMEMBER_LOGIN_KEY);
		}
	};


	const handleLogout = () => {
		setUser(null);
		setIdentifier(rememberLogin ? getRememberedLogin() : "");
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
		setLeaveStatusFilter("");
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
		setEmployeePermissions([]);
		setDeleteTarget(null);
		setProjectRows([]);
		setProjectTotal(0);
		setProjectQuery("");
		setProjectStatusFilter("");
		setProjectPriorityFilter("");
		setProjectLeadFilter("");
		setProjectStatus({ type: "", message: "" });
		setProjectPage(1);
		setProjectTotalPages(0);
		setProjectFormOpen(false);
		setProjectEditingId(null);
		setProjectFormReadOnly(false);
		setProjectFormStatus({ type: "", message: "" });
		setProjectEmployees([]);
		setProjectDepartments([]);
		setProjectDeleteTarget(null);
		setTaskRows([]);
		setAssignedSubtasks([]);
		setTaskTotal(0);
		setTaskQuery("");
		setTaskStatusFilter("");
		setTaskProjectFilter("");
		setTaskSort("deadline");
		setTaskStatus({ type: "", message: "" });
		setTaskPage(1);
		setTaskTotalPages(0);
		setTaskFormOpen(false);
		setTaskFormStatus({ type: "", message: "" });
		setTaskAssignees([]);
		setTaskEmployees([]);
		setTaskProjects([]);
		setTaskHistoryLogs([]);
		setTaskHistoryLoading(false);
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
		setSelectedDepartment(null);
		setDepartmentEmployees([]);
		setDepartmentEmployeesStatus({ type: "", message: "" });
		navigate("/login");
	};

	const fetchUserProfile = useCallback(async (userId) => {
		const response = await fetch(`${API_BASE}/api/v1/auth/profile/${userId}`);
		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.detail || "Khong the tai ho so ca nhan");
		}
		if (data.data) {
			setUser((prev) => ({ ...(prev || {}), ...data.data }));
		}
		return data.data;
	}, []);

	const updateUserProfile = useCallback(async (userId, payload) => {
		const response = await fetch(`${API_BASE}/api/v1/nhanvien/${userId}?actor=employee`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.detail || "Khong the cap nhat ho so ca nhan");
		}
		const profile = await fetchUserProfile(userId);
		return profile || data.data;
	}, [fetchUserProfile]);

	const changeUserPassword = async ({ user_id, old_password, new_password }) => {
		const response = await fetch(`${API_BASE}/api/v1/auth/change_password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user_id, old_password, new_password }),
		});
		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.detail || "Khong the doi mat khau");
		}
		return data;
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

	const fetchLeaveRequests = async (pageOverride, selfOnly = false) => {
		if (!user?.id) {
			return;
		}
		setLeaveLoading(true);
		setLeaveStatus({ type: "", message: "" });
		try {
			const isAdminUser = isAdmin || canManageLeave;
			const nextPage = pageOverride ?? leavePage;
			const params = new URLSearchParams({
				page: String(nextPage),
				page_size: String(leavePageSize),
				actor_id: String(user.id),
			});
			if (leaveStatusFilter) {
				params.set("trang_thai", leaveStatusFilter);
			}
			if (selfOnly || !isAdminUser) {
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

	const submitLeaveForm = async (selfOnly = false) => {
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
			setLeaveStatus({ type: "error", message: "Vui lòng nhập đầy đủ thông tin." });
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
				throw new Error(data.detail || "Không thể gửi đơn nghỉ phép");
			}
			setLeaveStatus({ type: "success", message: "Đã gửi đơn nghỉ phép thành công." });
			setLeaveFormOpen(false);
			resetLeaveForm();
			fetchLeaveRequests(1, selfOnly);
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
				throw new Error(data.detail || "Không thể duyệt đơn nghỉ phép");
			}
			setLeaveStatus({ type: "success", message: "Đã duyệt đơn nghỉ phép." });
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
			setLeaveStatus({ type: "error", message: "Vui lòng nhập lý do từ chối." });
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
				throw new Error(data.detail || "Không thể từ chối đơn nghỉ phép");
			}
			setLeaveStatus({ type: "success", message: "Đã từ chối đơn nghỉ phép." });
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
			quyen_ids: [],
		});
	};

	const fetchEmployeePermissions = async (force = false) => {
		if (!force && employeePermissions.length > 0) {
			return;
		}
		setEmployeePermissionsLoading(true);
		try {
			const response = await fetch(`${API_BASE}/api/v1/quyen?limit=500`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Không thể tải danh sách quyền");
			}
			setEmployeePermissions(data || []);
		} catch (error) {
			setEmployeeStatus({ type: "error", message: error.message });
		} finally {
			setEmployeePermissionsLoading(false);
		}
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
				throw new Error(data.detail || "Không thể tải danh sách phòng ban");
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
		fetchEmployeePermissions();
		setEmployeeFormOpen(true);
	};

	const openEditEmployee = (row) => {
		setEmployeeEditingId(row.id);
		fetchEmployeeDepartments();
		fetchEmployeePermissions();
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
			quyen_ids: row.quyen_ids || [],
		});
		setEmployeeFormOpen(true);
	};

	const submitEmployeeForm = async () => {
		setEmployeeStatus({ type: "", message: "" });
		if (!employeeForm.ho_ten.trim() || !employeeForm.email.trim()) {
			setEmployeeStatus({ type: "error", message: "Vui lòng nhập họ tên và email." });
			return;
		}
		if (!employeeEditingId && !employeeForm.mat_khau.trim()) {
			setEmployeeStatus({ type: "error", message: "Vui lòng nhập mật khẩu." });
			return;
		}

		try {
			const payload = {
				...employeeForm,
				quyen_ids: (employeeForm.quyen_ids || []).map((quyenId) => Number(quyenId)),
				phong_ban_id: employeeForm.phong_ban_id
					? Number(employeeForm.phong_ban_id)
					: null,
				luong_co_ban: employeeForm.luong_co_ban
					? Number(employeeForm.luong_co_ban)
					: null,
			};
			if (employeeEditingId && !payload.mat_khau?.trim()) {
				delete payload.mat_khau;
			}

			if (employeeEditingId) {
				const response = await fetch(`${API_BASE}/api/v1/nhanvien/${employeeEditingId}?actor=admin&actor_id=${user?.id || ""}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.detail || "Không thể cập nhật nhân viên");
				}
			} else {
				const response = await fetch(`${API_BASE}/api/v1/nhanvien?actor_id=${user?.id || ""}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.detail || "Không thể thêm nhân viên");
				}
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
			await fetch(`${API_BASE}/api/v1/nhanvien/${deleteTarget.id}?actor_id=${user?.id || ""}`, { method: "DELETE" });
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
			if (user?.id) {
				params.set("actor_id", String(user.id));
			}
			const response = await fetch(`${API_BASE}/api/v1/nhanvien?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Không thể tải danh sách nhân viên");
			}
			setEmployeeRows(data.data || []);
			setEmployeeTotal(data.total || 0);
			setEmployeeTotalPages(data.total_pages || 0);
			setEmployeePage(data.page || nextPage);
			if (!data.data || data.data.length === 0) {
				setEmployeeStatus({ type: "info", message: "Không có nhân viên nào." });
			}
		} catch (error) {
			setEmployeeStatus({ type: "error", message: error.message });
		} finally {
			setEmployeeLoading(false);
		}
	};

	const fetchProjects = async (pageOverride, filtersOverride = {}) => {
		setProjectLoading(true);
		setProjectStatus({ type: "", message: "" });
		try {
			const nextPage = pageOverride ?? projectPage;
			const queryValue = filtersOverride.projectQuery ?? projectQuery;
			const statusValue = filtersOverride.projectStatusFilter ?? projectStatusFilter;
			const priorityValue = filtersOverride.projectPriorityFilter ?? projectPriorityFilter;
			const leadValue = filtersOverride.projectLeadFilter ?? projectLeadFilter;
			const params = new URLSearchParams();
			if (queryValue.trim()) {
				params.set("q", queryValue.trim());
			}
			if (statusValue) {
				params.set("trang_thai", statusValue);
			}
			if (priorityValue) {
				params.set("muc_do_uu_tien", priorityValue);
			}
			if (leadValue) {
				params.set("lead_id", leadValue);
			}
			params.set("page", String(nextPage));
			params.set("page_size", String(projectPageSize));
			const actor = isAdmin ? "admin" : "employee";
			params.set("actor", actor);
			if (actor === "employee" && user?.id) {
				params.set("nhan_vien_id", String(user.id));
			}
			const response = await fetch(
				`${API_BASE}/api/v1/du_an/danh_sach?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Không thể tải danh sách dự án");
			}
			setProjectRows(data.data || []);
			setProjectTotal(data.total || 0);
			setProjectTotalPages(data.total_pages || 0);
			setProjectPage(data.page || nextPage);
			if (!data.data || data.data.length === 0) {
				setProjectStatus({ type: "info", message: "Không có dự án nào." });
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
			if (taskProjectFilter) {
				params.set("du_an_id", taskProjectFilter);
			}
			params.set("sort_by", taskSort);
			
			const actor = canManageTasks ? "admin" : "employee";
			
			// Nhân viên chỉ xem công việc của mình
			if (actor === "employee" && user?.id) {
				params.set("scope", "mine");
				params.set("nhan_vien_id", String(user.id));
			} else {
				params.set("scope", "all");
			}
			
			params.set("page", String(nextPage));
			params.set("page_size", String(taskPageSize));
			params.set("actor", actor);
			
			const response = await fetch(
				`${API_BASE}/api/v1/cong_viec/danh_sach?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Không thể tải danh sách công việc");
			}
			setTaskRows(data.data || []);
			if (!canManageTasks) {
				fetchAssignedSubtasks();
			}
			setTaskTotal(data.total || 0);
			setTaskTotalPages(data.total_pages || 0);
			setTaskPage(data.page || nextPage);
			if (!data.data || data.data.length === 0) {
				setTaskStatus({ type: "info", message: "Không có công việc nào." });
			}
		} catch (error) {
			setTaskStatus({ type: "error", message: error.message });
		} finally {
			setTaskLoading(false);
		}
	};

	const fetchAssignedSubtasks = async () => {
		if (!user?.id) {
			setAssignedSubtasks([]);
			return;
		}
		try {
			const params = new URLSearchParams({ nhan_vien_id: String(user.id) });
			const response = await fetch(
				`${API_BASE}/api/v1/cong_viec_quy_trinh/duoc_giao/danh_sach?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach viec con duoc giao");
			}
			setAssignedSubtasks(data.data || []);
		} catch (error) {
			setTaskStatus({ type: "error", message: error.message });
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
				throw new Error(data.detail || "Không thể tải danh sách phòng ban");
			}
			setDepartmentRows(data.data || []);
			setDepartmentTotal(data.total || 0);
			setDepartmentTotalPages(data.total_pages || 0);
			setDepartmentPage(data.page || nextPage);
			if (!data.data || data.data.length === 0) {
				setDepartmentStatus({ type: "info", message: "Không có phòng ban nào." });
			}
		} catch (error) {
			setDepartmentStatus({ type: "error", message: error.message });
		} finally {
			setDepartmentLoading(false);
		}
	};


	const fetchDepartmentEmployees = async (department) => {
		setSelectedDepartment(department);
		setDepartmentEmployees([]);
		setDepartmentEmployeesStatus({ type: "", message: "" });
		setDepartmentEmployeesLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("phong_ban_id", String(department.id));
			params.set("page", "1");
			params.set("page_size", String(Math.max(Number(department.so_nhan_vien) || 0, 200)));
			const response = await fetch(`${API_BASE}/api/v1/nhanvien?${params.toString()}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Không thể tải danh sách nhân viên phòng ban");
			}
			setDepartmentEmployees(data.data || []);
			if (!data.data || data.data.length === 0) {
				setDepartmentEmployeesStatus({ type: "info", message: "Phòng ban này chưa có nhân viên." });
			}
		} catch (error) {
			setDepartmentEmployeesStatus({ type: "error", message: error.message });
		} finally {
			setDepartmentEmployeesLoading(false);
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
				throw new Error(data.detail || "Không thể tải danh sách nhân viên");
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
		setTaskUploadFile(null);
		setTaskUploadFile(null);
		setTaskEditingId(null);
		setTaskForm({
			ten_cong_viec: "",
			mo_ta: "",
			du_an_id: "",
			nguoi_giao_id: "",
			ngay_bat_dau: "",
			han_hoan_thanh: "",
			muc_do_uu_tien: "Trung bình",
			trang_thai: "Chưa bắt đầu",
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
				throw new Error(data.detail || "Không thể tải danh sách nhân viên");
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
			return taskProjects;
		}
		setTaskProjectsLoading(true);
		try {
			const params = new URLSearchParams({
				page: "1",
				page_size: "200",
			});
			const actor = isAdmin ? "admin" : "employee";
			params.set("actor", actor);
			if (actor === "employee" && user?.id) {
				params.set("nhan_vien_id", String(user.id));
			}
			const response = await fetch(
				`${API_BASE}/api/v1/du_an/danh_sach?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Không thể tải danh sách dự án");
			}
			const projects = data.data || [];
			setTaskProjects(projects);
			return projects;
		} catch (error) {
			setTaskFormStatus({ type: "error", message: error.message });
			return [];
		} finally {
			setTaskProjectsLoading(false);
		}
	};


	const fetchTaskLeaderProjects = async () => {
		if (!user?.id) {
			return [];
		}
		setTaskProjectsLoading(true);
		try {
			const params = new URLSearchParams({
				page: "1",
				page_size: "200",
				actor: "admin",
				lead_id: String(user.id),
			});
			const response = await fetch(
				`${API_BASE}/api/v1/du_an/danh_sach?${params.toString()}`
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai danh sach du an phu trach");
			}
			return data.data || [];
		} catch (error) {
			setTaskFormStatus({ type: "error", message: error.message });
			return [];
		} finally {
			setTaskProjectsLoading(false);
		}
	};

	const isInactiveProject = (project) => {
		const normalized = String(project?.trang_thai_duan || "")
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "");
		return normalized.includes("ngung hoat dong");
	};


	const openCreateTask = async () => {
		resetTaskForm();
		setTaskEditingId(null);
		setTaskStatus({ type: "", message: "" });
		setTaskFormStatus({ type: "", message: "" });
		if (user?.id) {
			setTaskForm((prev) => ({ ...prev, nguoi_giao_id: String(user.id) }));
		}
		const availableProjects = canManageTasks
			? await fetchTaskProjects()
			: await fetchTaskLeaderProjects();
		const creatableProjects = availableProjects.filter((project) => !isInactiveProject(project));
		if (creatableProjects.length === 0) {
			setTaskStatus({
				type: "error",
				message: canManageTasks
					? "Khong co du an dang hoat dong nen khong the tao cong viec."
					: "Ban chua phu trach du an dang hoat dong nao nen khong the tao cong viec.",
			});
			return;
		}
		setTaskProjects(availableProjects);
		fetchTaskEmployees(true);
		if (user?.id) {
			setTaskForm((prev) => ({ ...prev, nguoi_giao_id: String(user.id) }));
		}
		if (false && user?.id) {
			setTaskEmployees([
				{
					id: user.id,
					ho_ten: user.ho_ten || "Nhân viên",
				},
			]);
			setTaskAssignees([user.id]);
			setTaskForm((prev) => ({ ...prev, nguoi_giao_id: user.id }));
		}
		setTaskUploadFile(null);
		setTaskFormOpen(true);
	};

	const parseTaskIdList = (value) =>
		String(value || "")
			.split(",")
			.map((item) => Number(item.trim()))
			.filter((item) => Number.isFinite(item) && item > 0);

	const toggleAssignee = (employeeId) => {
		setTaskAssignees((prev) =>
			prev.includes(employeeId)
				? prev.filter((id) => id !== employeeId)
				: [...prev, employeeId]
		);
	};

	const handleTaskUploadChange = (event) => {
		setTaskUploadFile(event.target.files?.[0] || null);
	};

	const uploadTaskAttachment = async (taskId, file) => {
		if (!taskId || !file) {
			return null;
		}
		const formData = new FormData();
		formData.append("file", file);
		const response = await fetch(`${API_BASE}/api/v1/cong_viec/${taskId}/upload_tai_lieu`, {
			method: "POST",
			body: formData,
		});
		const data = await response.json().catch(() => ({}));
		if (!response.ok) {
			throw new Error(data.detail || "Không thể tải file công việc");
		}
		return data.tai_lieu_cv || null;
	};

	const submitTaskForm = async (closeDetailOnSuccess = false) => {
		const editingTaskId = taskEditingId;
		const isEditingTask = Boolean(editingTaskId);
		setTaskFormStatus({ type: "", message: "" });
		if (!taskForm.ten_cong_viec.trim() || !taskForm.mo_ta.trim()) {
			setTaskFormStatus({ type: "error", message: "Vui lòng nhập tên và mô tả." });
			return;
		}
		if (!taskForm.du_an_id) {
			setTaskFormStatus({ type: "error", message: "Vui lòng chọn dự án." });
			return;
		}
		const selectedProject = taskProjects.find(
			(project) => String(project.id) === String(taskForm.du_an_id)
		);
		if (isInactiveProject(selectedProject)) {
			setTaskFormStatus({
				type: "error",
				message: "Du an da ngung hoat dong, khong the tao hoac cap nhat cong viec.",
			});
			return;
		}
		if (!taskForm.ngay_bat_dau || !taskForm.han_hoan_thanh) {
			setTaskFormStatus({ type: "error", message: "Vui lòng chọn thời gian." });
			return;
		}
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (new Date(taskForm.han_hoan_thanh) < new Date(taskForm.ngay_bat_dau)) {
			setTaskFormStatus({ type: "error", message: "Deadline phải sau ngày bắt đầu." });
			return;
		}
		if (!isEditingTask && new Date(taskForm.han_hoan_thanh) < today) {
			setTaskFormStatus({ type: "error", message: "Deadline không được nhỏ hơn ngày hiện tại." });
			return;
		}
		if (taskAssignees.length === 0) {
			setTaskFormStatus({ type: "error", message: "Vui lòng chọn người nhận." });
			return;
		}
		if (!user?.id) {
			setTaskFormStatus({ type: "error", message: "Không xác định người dùng." });
			return;
		}

		if (!isEditingTask && !canManageTasks) {
			const leadId = selectedProject?.lead_id ?? selectedProject?.truong_du_an_id;
			if (!leadId || String(leadId) !== String(user.id)) {
				setTaskFormStatus({
					type: "error",
					message: "Ban chi duoc tao cong viec trong du an minh phu trach.",
				});
				return;
			}
		}

		const payload = {
			...taskForm,
			du_an_id: taskForm.du_an_id ? Number(taskForm.du_an_id) : null,
			nguoi_giao_id: taskForm.nguoi_giao_id ? Number(taskForm.nguoi_giao_id) : user.id,
			nguoi_nhan_ids: taskAssignees,
			actor_id: user.id,
			nguoi_thay_doi_id: user.id,
		};

		if (isEditingTask && taskUploadFile) {
			try {
				payload.tai_lieu_cv = await uploadTaskAttachment(editingTaskId, taskUploadFile);
			} catch (error) {
				setTaskFormStatus({ type: "error", message: error.message });
				return;
			}
		}

		try {
			const response = await fetch(
				isEditingTask
					? `${API_BASE}/api/v1/cong_viec/${editingTaskId}/cap_nhat_thong_tin`
					: `${API_BASE}/api/v1/cong_viec/tao_moi`,
				{
					method: isEditingTask ? "PUT" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.detail || (isEditingTask ? "Khong the cap nhat cong viec" : "Khong the tao cong viec"));
			}
			if (!isEditingTask && taskUploadFile && data.id) {
				await uploadTaskAttachment(data.id, taskUploadFile);
			}
			setTaskFormOpen(false);
			if (closeDetailOnSuccess) {
				closeTaskDetail();
			}
			resetTaskForm();
			fetchTasks(1);
			if (isEditingTask && !closeDetailOnSuccess) {
				fetchTaskHistory(editingTaskId);
				fetchTaskWorkflowSteps(editingTaskId);
			}
			setTaskStatus({
				type: "success",
				message: isEditingTask ? "Cập nhật công việc thành công." : "Tạo công việc thành công.",
			});
		} catch (error) {
			setTaskFormStatus({ type: "error", message: error.message });
		}
	};


	const fetchTaskWorkflowSteps = async (taskId) => {
		try {
			setTaskWorkflowLoading(true);
			const response = await fetch(`${API_BASE}/api/v1/cong_viec_quy_trinh?skip=0&limit=1000&cong_viec_id=${taskId}`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			const data = await response.json();
			if (response.ok) {
				// The endpoint returns an array directly, filter by cong_viec_id
				const steps = Array.isArray(data) ? data.filter((step) => Number(step.cong_viec_id) === Number(taskId)) : [];
				setTaskWorkflowSteps(steps);
			} else {
				setTaskWorkflowSteps([]);
			}
		} catch (error) {
			console.error("Error fetching workflow steps:", error);
			setTaskWorkflowSteps([]);
		} finally {
			setTaskWorkflowLoading(false);
		}
	};

	const fetchTaskHistory = async (taskId) => {
		if (!taskId) {
			setTaskHistoryLogs([]);
			return;
		}
		setTaskHistoryLoading(true);
		try {
			const params = new URLSearchParams();
			if (user?.id) params.set("nhan_vien_id", String(user.id));
			if (user?.vai_tro) params.set("vai_tro", user.vai_tro);
			const response = await fetch(`${API_BASE}/api/v1/cong_viec/${taskId}/lich_su?${params}`);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tai lich su cong viec");
			}
			setTaskHistoryLogs(Array.isArray(data) ? data : []);
		} catch (error) {
			setTaskHistoryLogs([]);
			setTaskStatus({ type: "error", message: error.message });
		} finally {
			setTaskHistoryLoading(false);
		}
	};

	const openTaskDetail = (row, options = {}) => {
		const assigneeIds = parseTaskIdList(row.nguoi_nhan_ids);
		setAssignedStepId(options.assignedStepId || null);
		setTaskDetailTarget(row);
		setTaskDetailOpen(true);
		setTaskEditingId(row.id);
		setTaskUploadFile(null);
		fetchTaskEmployees(true);
		fetchTaskProjects();
		fetchTaskWorkflowSteps(row.id);
		fetchTaskHistory(row.id);
		setTaskForm({
			ten_cong_viec: row.ten_cong_viec || "",
			mo_ta: row.mo_ta || "",
			du_an_id: row.du_an_id ? String(row.du_an_id) : "",
			nguoi_giao_id: row.nguoi_giao_id ? String(row.nguoi_giao_id) : "",
			ngay_bat_dau: row.ngay_bat_dau || "",
			han_hoan_thanh: row.han_hoan_thanh || "",
			muc_do_uu_tien: row.muc_do_uu_tien || "Trung bình",
			trang_thai: row.trang_thai || "Chưa bắt đầu",
			tai_lieu_cv: row.tai_lieu_cv || "",
		});
		setTaskAssignees(assigneeIds);
		setTaskFormStatus({ type: "", message: "" });
	};

	const closeTaskDetail = () => {
		setTaskDetailOpen(false);
		setTaskDetailTarget(null);
		setAssignedStepId(null);
		setTaskEditingId(null);
		setTaskUploadFile(null);
		setTaskHistoryLogs([]);
	};


	const submitTaskStepForm = async (payload) => {
		try {
			const response = await fetch(`${API_BASE}/api/v1/cong_viec_quy_trinh/tao_moi`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...payload, nguoi_thay_doi_id: user?.id || null }),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the tao buoc quy trinh");
			}
			fetchTasks(taskPage);
			fetchTaskWorkflowSteps(payload.cong_viec_id);
			fetchTaskHistory(payload.cong_viec_id);
			setTaskStatus({ type: "success", message: "Them buoc quy trinh thanh cong." });
			return data;
		} catch (error) {
			throw error;
		}
	};

	const submitTaskStepUpdate = async (stepId, payload, taskId) => {
		try {
			const response = await fetch(`${API_BASE}/api/v1/cong_viec_quy_trinh/${stepId}/cap_nhat`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...payload, nguoi_thay_doi_id: user?.id || null }),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.detail || "Khong the cap nhat buoc quy trinh");
			}
			const targetTaskId = taskId || payload.cong_viec_id;
			fetchTasks(taskPage);
			if (targetTaskId) {
				fetchTaskWorkflowSteps(targetTaskId);
				fetchTaskHistory(targetTaskId);
			}
			if (!canManageTasks) {
				fetchAssignedSubtasks();
			}
			setTaskStatus({ type: "success", message: "Cap nhat buoc quy trinh thanh cong." });
			return data;
		} catch (error) {
			throw error;
		}
	};

	const deleteTaskStep = async (stepId, taskId) => {
		try {
			const params = new URLSearchParams();
			if (user?.id) {
				params.set("nguoi_thay_doi_id", String(user.id));
			}
			const response = await fetch(`${API_BASE}/api/v1/cong_viec_quy_trinh/${stepId}/xoa?${params.toString()}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				let detail = "Khong the xoa buoc quy trinh";
				try {
					const data = await response.json();
					detail = data.detail || detail;
				} catch (_) {
					// ignore empty delete responses
				}
				throw new Error(detail);
			}
			fetchTaskWorkflowSteps(taskId);
			fetchTaskHistory(taskId);
			setTaskStatus({ type: "success", message: "Xoa buoc quy trinh thanh cong." });
		} catch (error) {
			throw error;
		}
	};

	const approveTask = async (taskId, action, reason = "") => {
		if (!user?.id) {
			setTaskStatus({ type: "error", message: "Khong xac dinh nguoi dung." });
			return;
		}
		try {
			const response = await fetch(`${API_BASE}/api/v1/cong_viec/${taskId}/duyet`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nguoi_duyet_id: user.id,
					action,
					ly_do_duyet: reason || undefined,
				}),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.detail || "Khong the duyet cong viec");
			}
			setTaskDetailTarget((prev) => {
				if (!prev || Number(prev.id) !== Number(taskId)) {
					return prev;
				}
				return {
					...prev,
					trang_thai_duyet: action === "duyet" ? "Đã duyệt" : "Từ chối",
					trang_thai: action === "duyet" ? "Đã hoàn thành" : "Đang thực hiện",
					trang_thai_hien_thi: action === "duyet" ? "Đã hoàn thành" : "Đang thực hiện",
					ly_do_duyet: reason || prev.ly_do_duyet,
				};
			});
			setTaskStatus({ type: "success", message: action === "duyet" ? "Da duyet cong viec." : "Da tu choi cong viec." });
			fetchTasks(taskPage);
			fetchTaskHistory(taskId);
		} catch (error) {
			setTaskStatus({ type: "error", message: error.message });
		}
	};

	const resetProjectForm = () => {
		setProjectEditingId(null);
		setProjectFormReadOnly(false);
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
		setProjectFormReadOnly(false);
		setProjectFormOpen(true);
	};

	const openEditProject = async (row, readOnly = false) => {
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
			setProjectFormReadOnly(readOnly);
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
		{ label: "Dashboard", icon: "chart", to: "/dashboard" },
		{ label: "Dự án", icon: "project", to: "/projects" },
		{ label: "Công việc", icon: "task", to: "/tasks" },
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
		{
			label: "Chấm công",
			icon: "calendar",
			to: "/attendance/manage",
			children: [
				{ label: "Quản lý chấm công", icon: "task", to: "/attendance/manage" },
				{ label: "Chấm công", icon: "calendar", to: "/attendance" },
			],
		},
		{
			label: "Nghỉ phép",
			icon: "leave",
			to: "/leave/manage",
			children: [
				{ label: "Quản lý nghỉ phép", icon: "task", to: "/leave/manage" },
				{ label: "Thống kê ngày phép", icon: "report", to: "/leave/stats" },
				{ label: "Nghỉ phép", icon: "leave", to: "/leave" },
			],
		},
		{ label: "Tính KPI", icon: "report", to: "/kpi-calculator" },
		{ label: "Tính lương", icon: "salary", to: "/salary-calculator" },
	];

	const iconMap = {
		chart: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 19V5" />
				<path d="M4 19h16" />
				<path d="M8 16v-4" />
				<path d="M12 16V8" />
				<path d="M16 16v-6" />
			</svg>
		),
		people: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
				<path d="M16 10a3 3 0 1 0 0-6" />
				<path d="M3 20a5 5 0 0 1 10 0" />
				<path d="M14 19a4.5 4.5 0 0 1 6-3.8" />
			</svg>
		),
		project: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 6h6l2 2h8v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
				<path d="M8 13h8" />
				<path d="M8 16h5" />
			</svg>
		),
		office: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 20V5a1 1 0 0 1 1-1h9v16" />
				<path d="M14 9h5a1 1 0 0 1 1 1v10" />
				<path d="M3 20h18" />
				<path d="M8 8h2" />
				<path d="M8 12h2" />
				<path d="M8 16h2" />
			</svg>
		),
		task: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M9 6h11" />
				<path d="M9 12h11" />
				<path d="M9 18h11" />
				<path d="M4 6h.01" />
				<path d="M4 12h.01" />
				<path d="M4 18h.01" />
			</svg>
		),
		calendar: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M7 3v4" />
				<path d="M17 3v4" />
				<path d="M4 8h16" />
				<path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
				<path d="M8 12h4v4H8z" />
			</svg>
		),
		leave: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M8 4h8" />
				<path d="M9 4v3" />
				<path d="M15 4v3" />
				<path d="M7 7h10l-1 13H8L7 7Z" />
				<path d="M10 11v5" />
				<path d="M14 11v5" />
			</svg>
		),
		schedule: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
				<path d="M12 7v5l3 2" />
			</svg>
		),
		salary: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 7h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
				<path d="M12 10v4" />
				<path d="M9 12h6" />
				<path d="M6 12h.01" />
				<path d="M18 12h.01" />
			</svg>
		),
		report: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M5 4h12l2 2v14H5V4Z" />
				<path d="M9 9h6" />
				<path d="M9 13h6" />
				<path d="M9 17h4" />
			</svg>
		),
		key: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M15 7a4 4 0 1 1-2.8-3.8" />
				<path d="M12 12 4 20" />
				<path d="m6 18 2 2" />
				<path d="m9 15 2 2" />
			</svg>
		),
		logout: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
				<path d="M16 17l5-5-5-5" />
				<path d="M21 12H9" />
			</svg>
		),
		library: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 5h7v15H4V5Z" />
				<path d="M13 5h7v15h-7V5Z" />
				<path d="M7 9h1" />
				<path d="M16 9h1" />
			</svg>
		),
	};

	const isAdmin = (user?.vai_tro || "").toLowerCase().includes("admin");
	const normalizePermission = (value) =>
		String(value || "")
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/d/g, "d");
	const userPermissionText = [
		...(user?.ma_quyen || []),
		...(user?.permissions || []).flatMap((permission) => [
			permission.ma_quyen,
			permission.ten_quyen,
			permission.nhom_quyen,
		]),
	]
		.map(normalizePermission)
		.join(" ");
	const userPermissionGroups = new Set(
		(user?.permissions || [])
			.map((permission) => normalizePermission(permission.nhom_quyen))
			.filter(Boolean),
	);
	const hasPermission = (aliases = []) =>
		isAdmin || aliases.some((alias) => userPermissionText.includes(normalizePermission(alias)));
	const hasPermissionGroup = (aliases = []) =>
		isAdmin || aliases.some((alias) => userPermissionGroups.has(normalizePermission(alias)));
	const canManageEmployees = hasPermissionGroup(["nhan_su", "nhanvien", "nhan vien", "employees"]);
	const canManageDepartments = hasPermissionGroup(["phong_ban", "phongban", "phong ban", "departments"]);
	const canManageAttendance = hasPermissionGroup(["cham_cong", "chamcong", "cham cong", "attendance"]);
	const canManageLeave = canManageAttendance;
	const canViewLeaveStats = canManageLeave;
	const canManageProjects = hasPermissionGroup(["du_an", "duan", "du an", "projects"]);
	const canManageTasks = hasPermissionGroup(["cong_viec", "congviec", "cong viec", "tasks"]);
	const canManagePayroll = hasPermissionGroup(["luong", "salary", "payroll"]);
	const canUseSalary = Boolean(user?.id);
	const canUseKpi = Boolean(user?.id);
	const visibleMenuItems = [
		{ label: "Dashboard", icon: "chart", to: "/dashboard" },
		...(canManageEmployees ? [{ label: "Nhân sự", icon: "people", to: "/employees" }] : []),
		{ label: "Dự án", icon: "project", to: "/projects" },
		{ label: "Công việc", icon: "task", to: "/tasks" },
		...(canManageDepartments ? [{ label: "Phòng ban", icon: "office", to: "/departments" }] : []),
		canManageAttendance
			? {
					label: "Chấm công",
					icon: "calendar",
					to: "/attendance/manage",
					children: [
						{ label: "Quản lý chấm công", icon: "task", to: "/attendance/manage" },
						{ label: "Chấm công", icon: "calendar", to: "/attendance" },
					],
			  }
			: { label: "Chấm công", icon: "calendar", to: "/attendance" },
		canManageLeave
			? {
					label: "Nghỉ phép",
					icon: "leave",
					to: "/leave/manage",
					children: [
						{ label: "Quản lý nghỉ phép", icon: "task", to: "/leave/manage" },
						...(canViewLeaveStats ? [{ label: "Thống kê ngày phép", icon: "report", to: "/leave/stats" }] : []),
						{ label: "Nghỉ phép", icon: "leave", to: "/leave" },
					],
			  }
			: { label: "Nghỉ phép", icon: "leave", to: "/leave" },
		...(canUseKpi ? [{ label: "Tính KPI", icon: "report", to: "/kpi-calculator" }] : []),
		...(canUseSalary ? [{ label: "Tính lương", icon: "salary", to: "/salary-calculator" }] : []),
	];

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
							rememberLogin={rememberLogin}
							onRememberLoginChange={handleRememberLoginChange}
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
						menuItems={visibleMenuItems}
						iconMap={iconMap}
						onLogout={handleLogout}
					/>
				}
			>
				<Route path="/" element={<Navigate to="/dashboard" replace />} />
				<Route path="/dashboard" element={<DashboardPage user={user} isAdmin={isAdmin} canManagePayroll={canManagePayroll} apiBase={API_BASE} />} />
				<Route
					path="/profile"
					element={
						<ProfilePage
							user={user}
							fetchProfile={fetchUserProfile}
							updateProfile={updateUserProfile}
						/>
					}
				/>
				<Route
					path="/change-password"
					element={<ChangePasswordPage user={user} changePassword={changeUserPassword} />}
				/>
				<Route
					path="/attendance"
					element={
						<AttendancePage
							user={user}
							isAdmin={false}
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
					path="/attendance/manage"
					element={
						canManageAttendance ? (
							<AttendancePage
								user={user}
								isAdmin={true}
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
						) : (
							<Navigate to="/attendance" replace />
						)
					}
				/>
				<Route
					path="/leave"
					element={
						<LeavePage
							user={user}
							isAdmin={false}
							scope="self"
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
							submitLeaveForm={() => submitLeaveForm(true)}
							approveLeaveRequest={approveLeaveRequest}
							rejectLeaveRequest={rejectLeaveRequest}
						/>
					}
				/>
				<Route
					path="/leave/manage"
					element={
						canManageLeave ? (
							<LeavePage
								user={user}
								isAdmin={true}
								scope="manage"
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
						) : (
							<Navigate to="/leave" replace />
						)
					}
				/>
				<Route
					path="/leave/stats"
					element={
						canViewLeaveStats ? (
							<LeaveStatsPage user={user} apiBase={API_BASE} />
						) : (
							<Navigate to="/leave" replace />
						)
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
							projectPriorityFilter={projectPriorityFilter}
							projectLeadFilter={projectLeadFilter}
							projectStatus={projectStatus}
							projectLoading={projectLoading}
							projectPage={projectPage}
							projectPageSize={projectPageSize}
							projectTotalPages={projectTotalPages}
							projectFormOpen={projectFormOpen}
							projectEditingId={projectEditingId}
							projectFormReadOnly={projectFormReadOnly}
							projectForm={projectForm}
							projectEmployees={projectEmployees}
							projectEmployeesLoading={projectEmployeesLoading}
							projectDepartments={projectDepartments}
							projectDepartmentsLoading={projectDepartmentsLoading}
							projectFormStatus={projectFormStatus}
							projectDeleteTarget={projectDeleteTarget}
							setProjectQuery={setProjectQuery}
							setProjectStatusFilter={setProjectStatusFilter}
							setProjectPriorityFilter={setProjectPriorityFilter}
							setProjectLeadFilter={setProjectLeadFilter}
							setProjectPageSize={setProjectPageSize}
							setProjectFormOpen={setProjectFormOpen}
							setProjectForm={setProjectForm}
							resetProjectForm={resetProjectForm}
							fetchProjects={fetchProjects}
							fetchProjectEmployees={fetchProjectEmployees}
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
							isAdmin={canManageTasks}
							taskRows={taskRows}
								assignedSubtasks={assignedSubtasks}
							taskTotal={taskTotal}
							taskQuery={taskQuery}
							taskStatusFilter={taskStatusFilter}
							taskProjectFilter={taskProjectFilter}
							taskSort={taskSort}
							taskStatus={taskStatus}
							taskLoading={taskLoading}
							taskPage={taskPage}
							taskPageSize={taskPageSize}
							taskTotalPages={taskTotalPages}
							taskFormOpen={taskFormOpen}
							taskFormStatus={taskFormStatus}
							taskAssignees={taskAssignees}
								taskEmployees={taskEmployees}
							taskProjects={taskProjects}
							taskProjectsLoading={taskProjectsLoading}
							taskEmployeesLoading={taskEmployeesLoading}
							taskForm={taskForm}
							taskEditingId={taskEditingId}
							setTaskQuery={setTaskQuery}
							setTaskStatusFilter={setTaskStatusFilter}
							setTaskProjectFilter={setTaskProjectFilter}
							setTaskSort={setTaskSort}
							setTaskFormOpen={setTaskFormOpen}
							setTaskForm={setTaskForm}
							setTaskAssignees={setTaskAssignees}
								resetTaskForm={resetTaskForm}
							fetchTasks={fetchTasks}
							fetchTaskEmployees={fetchTaskEmployees}
							fetchTaskProjects={fetchTaskProjects}
							openCreateTask={openCreateTask}
							toggleAssignee={toggleAssignee}
								handleTaskUploadChange={handleTaskUploadChange}
							submitTaskForm={submitTaskForm}
							submitTaskStepForm={submitTaskStepForm}
							submitTaskStepUpdate={submitTaskStepUpdate}
							approveTask={approveTask}
							deleteTaskStep={deleteTaskStep}
							setTaskPageSize={setTaskPageSize}
							taskDetailOpen={taskDetailOpen}
							taskDetailTarget={taskDetailTarget}
						assignedStepId={assignedStepId}
							openTaskDetail={openTaskDetail}
							closeTaskDetail={closeTaskDetail}
							taskWorkflowSteps={taskWorkflowSteps}
							taskWorkflowLoading={taskWorkflowLoading}
							taskHistoryLogs={taskHistoryLogs}
							taskHistoryLoading={taskHistoryLoading}
							taskUploadFile={taskUploadFile}
						/>
					}
				/>
				<Route
					path="/departments"
					element={
						canManageDepartments ? (
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
								selectedDepartment={selectedDepartment}
								departmentEmployees={departmentEmployees}
								departmentEmployeesLoading={departmentEmployeesLoading}
								departmentEmployeesStatus={departmentEmployeesStatus}
								setDepartmentQuery={setDepartmentQuery}
								setDepartmentPageSize={setDepartmentPageSize}
								setDepartmentForm={setDepartmentForm}
								setDepartmentTransferId={setDepartmentTransferId}
								fetchDepartments={fetchDepartments}
								fetchDepartmentEmployees={fetchDepartmentEmployees}
								openCreateDepartment={openCreateDepartment}
								openEditDepartment={openEditDepartment}
								submitDepartmentForm={submitDepartmentForm}
								requestDepartmentAction={requestDepartmentAction}
								confirmDepartmentAction={confirmDepartmentAction}
								closeDepartmentAction={closeDepartmentAction}
							/>
						) : (
							<Navigate to="/dashboard" replace />
						)
					}
				/>
				<Route
					path="/kpi-calculator"
					element={canUseKpi ? <KpiCalculatorPage user={user} isAdmin={isAdmin || canManagePayroll} /> : <Navigate to="/dashboard" replace />}
				/>
				<Route
					path="/salary-calculator"
					element={canUseSalary ? <SalaryCalculatorPage user={user} isAdmin={canManagePayroll} /> : <Navigate to="/dashboard" replace />}
				/>
				<Route
					path="/employees"
					element={
						canManageEmployees ? (
							<EmployeesPage
								apiBase={API_BASE}
								user={user}
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
								employeePermissions={employeePermissions}
								employeePermissionsLoading={employeePermissionsLoading}
								deleteTarget={deleteTarget}
								setEmployeeQuery={setEmployeeQuery}
								setEmployeeFormOpen={setEmployeeFormOpen}
								setEmployeeForm={setEmployeeForm}
								setEmployeeEditingId={setEmployeeEditingId}
								setEmployeePageSize={setEmployeePageSize}
								resetEmployeeForm={resetEmployeeForm}
								fetchEmployees={fetchEmployees}
								fetchEmployeeDepartments={fetchEmployeeDepartments}
								fetchEmployeePermissions={fetchEmployeePermissions}
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

