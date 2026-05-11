import React, { useEffect, useMemo, useState } from "react";

const COMPANY_LOCATION = {
	lat: 20.980389,
	lng: 105.813893,
};

const CHECKIN_RADIUS_METERS = 200;

function AttendancePage({
	user,
	isAdmin,
	attendanceToday,
	attendanceHistory,
	attendanceStatus,
	attendanceLoading,
	fetchAttendanceToday,
	fetchAttendanceHistory,
	submitCheckIn,
	submitCheckOut,
	submitAttendanceReport,
	reviewAttendanceReport,
}) {
	const [location, setLocation] = useState({
		lat: null,
		lng: null,
		address: "",
	});
	const [locationStatus, setLocationStatus] = useState({ type: "", message: "" });
	const [note, setNote] = useState("");
	const [locating, setLocating] = useState(false);
	const [locationPromptOpen, setLocationPromptOpen] = useState(false);
	const [wfhPromptOpen, setWfhPromptOpen] = useState(false);
	const [month, setMonth] = useState(() => String(new Date().getMonth() + 1));
	const [year, setYear] = useState(() => String(new Date().getFullYear()));
	const [reportModalOpen, setReportModalOpen] = useState(false);
	const [reportTarget, setReportTarget] = useState(null);
	const [reportContent, setReportContent] = useState("");

	useEffect(() => {
		if (!user?.id) {
			return;
		}
		if (!isAdmin) {
			fetchAttendanceToday(user.id);
		}
		fetchAttendanceHistory(user.id, 1, 7, undefined, undefined, isAdmin);
	}, [user?.id]);

	const historyRows = attendanceHistory || [];

	const summaryStats = useMemo(() => {
		const normalize = (value) => String(value || "").toLowerCase();
		const totalDays = historyRows.length;
		const lateDays = historyRows.filter((row) => normalize(row.trang_thai).includes("tre"))
			.length;
		const totalHours = historyRows.reduce(
			(sum, row) => sum + (Number(row.so_gio_lam) || 0),
			0
		);
		const fullDays = historyRows.filter((row) => {
			const status = normalize(row.trang_thai_hien_tai || row.trang_thai);
			return status.includes("du_cong") || status.includes("dung_gio");
		}).length;
		return {
			totalDays,
			lateDays,
			totalHours,
			fullDays,
		};
	}, [historyRows]);

	const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
		const toRadians = (value) => (value * Math.PI) / 180;
		const earthRadius = 6371000;
		const deltaLat = toRadians(lat2 - lat1);
		const deltaLng = toRadians(lng2 - lng1);
		const a =
			Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
			Math.cos(toRadians(lat1)) *
				Math.cos(toRadians(lat2)) *
				Math.sin(deltaLng / 2) *
				Math.sin(deltaLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return earthRadius * c;
	};

	const getCurrentPosition = () =>
		new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error("Trình duyệt không hỗ trợ định vị."));
				return;
			}
			navigator.geolocation.getCurrentPosition(resolve, reject, {
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0,
			});
		});

	const requestLocation = async () => {
		setLocationStatus({ type: "", message: "" });
		setLocating(true);
		try {
			const position = await getCurrentPosition();
			setLocation((prev) => ({
				...prev,
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			}));
			setLocationStatus({ type: "success", message: "Đã cập nhật vị trí." });
			return {
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			};
		} catch (error) {
			setLocationStatus({
				type: "error",
				message:
					error?.message || "Không cấp quyền vị trí, không thể chấm công.",
			});
			return null;
		} finally {
			setLocating(false);
		}
	};

	const buildPayload = (overrideLocation = {}) => ({
		nhan_vien_id: user?.id,
		vi_tri: location.address || undefined,
		vi_do: overrideLocation.lat ?? location.lat ?? undefined,
		kinh_do: overrideLocation.lng ?? location.lng ?? undefined,
		bao_cao: note || undefined,
		loai_cham_cong: "office",
	});

	const buildWfhPayload = () => ({
		nhan_vien_id: user?.id,
		bao_cao: note || undefined,
		loai_cham_cong: "wfh",
	});

	const handleCheckInClick = () => {
		if (!user?.id) {
			return;
		}
		setLocationPromptOpen(true);
	};

	const handleConfirmLocation = async () => {
		setLocationPromptOpen(false);
		if (!user?.id) {
			return;
		}
		const coords = await requestLocation();
		if (!coords) {
			return;
		}
		const distance = getDistanceMeters(
			coords.lat,
			coords.lng,
			COMPANY_LOCATION.lat,
			COMPANY_LOCATION.lng
		);
		if (distance > CHECKIN_RADIUS_METERS) {
			setLocationStatus({
				type: "error",
				message: `Bạn đang cách công ty ${Math.round(
					distance
				)}m, ngoài phạm vi ${CHECKIN_RADIUS_METERS}m.`,
			});
			return;
		}
		await submitCheckIn(buildPayload(coords));
	};

	const handleCheckOut = async () => {
		if (!user?.id) {
			return;
		}
		await submitCheckOut(buildPayload());
	};

	const handleWfhClick = () => {
		if (!user?.id) {
			return;
		}
		setWfhPromptOpen(true);
	};

	const handleConfirmWfh = async () => {
		setWfhPromptOpen(false);
		if (!user?.id) {
			return;
		}
		await submitCheckIn(buildWfhPayload());
	};

	const handleCancelWfh = () => {
		setWfhPromptOpen(false);
		setLocationStatus({ type: "info", message: "Bạn đã hủy check-in WFH." });
	};

	const handleCancelLocation = () => {
		setLocationPromptOpen(false);
		setLocationStatus({ type: "info", message: "Bạn đã hủy yêu cầu truy cập vị trí." });
	};

	const handleFilter = () => {
		if (!user?.id) {
			return;
		}
		const monthNumber = Number(month);
		const yearNumber = Number(year);
		if (!monthNumber || !yearNumber) {
			return;
		}
		const pad = (value) => String(value).padStart(2, "0");
		const startDate = `${yearNumber}-${pad(monthNumber)}-01`;
		const lastDay = new Date(yearNumber, monthNumber, 0).getDate();
		const endDate = `${yearNumber}-${pad(monthNumber)}-${pad(lastDay)}`;
		fetchAttendanceHistory(user.id, 1, 31, startDate, endDate, isAdmin);
	};

	const refreshCurrentAttendance = () => {
		handleFilter();
		if (!isAdmin && user?.id) {
			fetchAttendanceToday(user.id);
		}
	};

	const openReportModal = (row) => {
		setReportTarget(row);
		setReportContent(row?.bao_cao_noi_dung || "");
		setReportModalOpen(true);
	};

	const closeReportModal = () => {
		setReportModalOpen(false);
		setReportTarget(null);
		setReportContent("");
	};

	const handleSubmitReport = async () => {
		if (!reportTarget?.id) {
			return;
		}
		const content = reportContent.trim();
		if (!content) {
			return;
		}
		const ok = await submitAttendanceReport({
			cham_cong_id: reportTarget.id,
			noi_dung: content,
		});
		if (ok) {
			closeReportModal();
			refreshCurrentAttendance();
		}
	};

	const handleReviewReport = async (row, action) => {
		if (!row?.id) {
			return;
		}
		let lyDo = "";
		if (action === "reject") {
			lyDo = window.prompt("Nhập lý do từ chối báo cáo:", row.bao_cao_ly_do || "") || "";
		}
		const ok = await reviewAttendanceReport({
			cham_cong_id: row.id,
			action,
			ly_do: lyDo,
		});
		if (ok) {
			refreshCurrentAttendance();
		}
	};

	const renderReportStatus = (status) => {
		if (status === "APPROVED") {
			return <span className="status-pill status-approved">Đã duyệt</span>;
		}
		if (status === "REJECTED") {
			return <span className="status-pill status-rejected">Từ chối</span>;
		}
		if (status === "PENDING") {
			return <span className="status-pill status-pending">Chờ duyệt</span>;
		}
		return <span className="status-pill status-muted">Chưa gửi</span>;
	};

	const getEmployeeReportButton = (item) => {
		const status = item?.bao_cao_trang_thai;
		const hasContent = Boolean((item?.bao_cao_noi_dung || "").trim());

		if (status === "PENDING" || hasContent) {
			return {
				label: "",
				disabled: true,
				className: "btn-report btn-report-pending",
				hidden: true,
			};
		}

		if (status === "REJECTED") {
			return {
				label: "Gửi lại",
				disabled: false,
				className: "btn-report",
				hidden: false,
			};
		}

		return {
			label: "Gửi báo cáo",
			disabled: false,
			className: "btn-report",
			hidden: false,
		};
	};

	const formatTime = (value) => {
		if (!value || value === "-") {
			return "-";
		}
		if (typeof value === "string") {
			if (value.includes(":")) {
				return value.slice(0, 8);
			}
			const durationMatch = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
			if (durationMatch) {
				const hours = String(durationMatch[1] || "0").padStart(2, "0");
				const minutes = String(durationMatch[2] || "0").padStart(2, "0");
				const seconds = String(durationMatch[3] || "0").padStart(2, "0");
				return `${hours}:${minutes}:${seconds}`;
			}
		}
		return String(value);
	};

	return (
		<section className="attendance-page">
			{!isAdmin ? (
				<div className="attendance-metrics">
					<div className="metric-card metric-purple">
						<p>Ngày đã chấm công</p>
						<h3>{summaryStats.totalDays}</h3>
					</div>
					<div className="metric-card metric-pink">
						<p>Ngày đi trễ</p>
						<h3>{summaryStats.lateDays}</h3>
					</div>
					<div className="metric-card metric-blue">
						<p>Tổng giờ làm việc</p>
						<h3>{summaryStats.totalHours.toFixed(1)}</h3>
					</div>
					<div className="metric-card metric-green">
						<p>Ngày đủ công</p>
						<h3>{summaryStats.fullDays}</h3>
					</div>
				</div>
			) : null}

			<div className="attendance-card">
				<div className="attendance-card-header">
					<div>
						<h2>Chấm công tháng {month}/{year}</h2>
						<p>Quản lý lịch sử check-in/check-out và trạng thái làm việc.</p>
					</div>
					<div className="attendance-status">
						<span className="status-label">Trạng thái hôm nay:</span>
						{attendanceToday?.check_in ? (
							<span className="status-pill status-success">
								Check-in: {attendanceToday.check_in}
							</span>
						) : (
							<span className="status-pill status-muted">Chưa check-in</span>
						)}
						{attendanceToday?.check_out ? (
							<span className="status-pill status-success">
								Check-out: {attendanceToday.check_out}
							</span>
						) : (
							<span className="status-pill status-muted">Chưa check-out</span>
						)}
					</div>
				</div>

				<div className="attendance-actions">
					{!isAdmin ? (
						<div className="attendance-buttons">
							<button
								type="button"
								className="btn-checkin"
								onClick={handleCheckInClick}
								disabled={locating}
							>
								Check-in
							</button>
							<button
								type="button"
								className="btn-checkout"
								onClick={handleCheckOut}
							>
								Check-out
							</button>
							<button type="button" className="btn-wfh" onClick={handleWfhClick}>
								WFH
							</button>
						</div>
					) : (
						<div className="attendance-buttons">
							<span className="status-pill status-muted">
								Admin chỉ xem dữ liệu chấm công
							</span>
						</div>
					)}
					<div className="attendance-filters">
						<select value={month} onChange={(event) => setMonth(event.target.value)}>
							{Array.from({ length: 12 }, (_, index) => String(index + 1)).map(
								(item) => (
									<option key={item} value={item}>
										Tháng {item}
									</option>
								)
							)}
						</select>
						<select value={year} onChange={(event) => setYear(event.target.value)}>
							{Array.from({ length: 6 }, (_, index) => String(2024 + index)).map(
								(item) => (
									<option key={item} value={item}>
										{item}
									</option>
								)
							)}
						</select>
						<button type="button" className="btn-filter" onClick={handleFilter}>
							Lọc
						</button>
					</div>
				</div>

				<div className="attendance-table">
					<table>
						<thead>
							<tr>
								{isAdmin ? <th>Nhân viên</th> : null}
								<th>Ngày</th>
								<th>Check-in</th>
								<th>Check-out</th>
								<th>Số giờ</th>
								<th>Trạng thái</th>
								<th>Báo cáo</th>
							</tr>
						</thead>
						<tbody>
							{attendanceLoading ? (
								<tr>
									<td colSpan={isAdmin ? 7 : 6}>Đang tải dữ liệu...</td>
								</tr>
							) : historyRows.length === 0 ? (
								<tr>
									<td colSpan={isAdmin ? 7 : 6}>Chưa có dữ liệu chấm công.</td>
								</tr>
							) : (
								historyRows.map((item) => (
									<tr key={item.id}>
										{isAdmin ? <td>{item.ho_ten || item.nhan_vien_id}</td> : null}
										<td>{item.ngay || "-"}</td>
										<td>{formatTime(item.check_in)}</td>
										<td>{formatTime(item.check_out)}</td>
										<td>{item.so_gio_lam ?? "-"}</td>
										<td>
											<span className="status-pill status-success">
												{item.trang_thai_hien_tai || item.trang_thai || "-"}
											</span>
										</td>
										<td>
											<div className="attendance-report-cell">
												{renderReportStatus(item.bao_cao_trang_thai)}
												{isAdmin && item.bao_cao_noi_dung ? (
													<p className="attendance-report-text">{item.bao_cao_noi_dung}</p>
												) : null}
												{isAdmin && item.bao_cao_ly_do ? (
													<p className="attendance-report-note">Lý do: {item.bao_cao_ly_do}</p>
												) : null}
												{isAdmin ? (
													item.bao_cao_trang_thai === "PENDING" ? (
														<div className="attendance-report-actions">
															<button
																type="button"
																className="btn-report"
																onClick={() => handleReviewReport(item, "approve")}
															>
																Duyệt
															</button>
															<button
																type="button"
																className="btn-report ghost"
																onClick={() => handleReviewReport(item, "reject")}
															>
																Từ chối
															</button>
														</div>
													) : null
												) : (() => {
													const button = getEmployeeReportButton(item);
													if (button.hidden) {
														return null;
													}
													return (
													<button
														type="button"
														className={button.className}
														onClick={() => openReportModal(item)}
														disabled={button.disabled}
													>
														{button.label}
													</button>
													);
												})()
											}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{reportModalOpen ? (
				<div className="modal-backdrop">
					<div className="modal">
						<div className="modal-header">
							<h3>Gửi báo cáo</h3>
							<button type="button" className="ghost" onClick={closeReportModal}>
								Đóng
							</button>
						</div>
						<div className="form-group">
							<label>Nội dung báo cáo</label>
							<textarea
								rows={6}
								placeholder="Nhập nội dung báo cáo của bạn..."
								value={reportContent}
								onChange={(event) => setReportContent(event.target.value)}
							/>
						</div>
						<div className="form-actions">
							<button type="button" className="ghost" onClick={closeReportModal}>
								Đóng
							</button>
							<button type="button" onClick={handleSubmitReport}>
								Gửi báo cáo
							</button>
						</div>
					</div>
				</div>
			) : null}


			{locationPromptOpen ? (
				<div className="modal-backdrop">
					<div className="modal confirm">
						<div className="modal-header">
							<h3>Cho phép truy cập vị trí?</h3>
							<button type="button" className="ghost" onClick={handleCancelLocation}>
								Hủy
							</button>
						</div>
						<p>
							Check-in cần vị trí trong bán kính {CHECKIN_RADIUS_METERS}m quanh công
							ty.
						</p>
						<div className="form-actions">
							<button type="button" onClick={handleConfirmLocation}>
								Cho phép
							</button>
							<button type="button" className="ghost" onClick={handleCancelLocation}>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}

			{wfhPromptOpen ? (
				<div className="modal-backdrop">
					<div className="modal confirm">
						<div className="modal-header">
							<h3>Check-in WFH?</h3>
							<button type="button" className="ghost" onClick={handleCancelWfh}>
								Hủy
							</button>
						</div>
						<p>Bạn có chắc chắn check-in làm việc tại nhà không?</p>
						<div className="form-actions">
							<button type="button" onClick={handleConfirmWfh}>
								Cho phép
							</button>
							<button type="button" className="ghost" onClick={handleCancelWfh}>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
}

export default AttendancePage;
