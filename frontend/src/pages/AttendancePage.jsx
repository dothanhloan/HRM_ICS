import React, { useEffect, useMemo, useState } from "react";

function AttendancePage({
	user,
	attendanceToday,
	attendanceHistory,
	attendanceStatus,
	attendanceLoading,
	fetchAttendanceToday,
	fetchAttendanceHistory,
	submitCheckIn,
	submitCheckOut,
}) {
	const [location, setLocation] = useState({
		lat: null,
		lng: null,
		address: "",
	});
	const [locationStatus, setLocationStatus] = useState({ type: "", message: "" });
	const [note, setNote] = useState("");
	const [locating, setLocating] = useState(false);

	useEffect(() => {
		if (!user?.id) {
			return;
		}
		fetchAttendanceToday(user.id);
		fetchAttendanceHistory(user.id, 1, 7);
	}, [user?.id]);

	const hasLocation = useMemo(() => {
		return (
			(location.lat !== null && location.lng !== null) ||
			(location.address && location.address.trim())
		);
	}, [location]);

	const requestLocation = () => {
		setLocationStatus({ type: "", message: "" });
		if (!navigator.geolocation) {
			setLocationStatus({ type: "error", message: "Trình duyệt không hỗ trợ định vị." });
			return;
		}
		setLocating(true);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLocation((prev) => ({
					...prev,
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				}));
				setLocationStatus({ type: "success", message: "Đã cập nhật vị trí." });
				setLocating(false);
			},
			() => {
				setLocationStatus({
					type: "error",
					message: "Không cấp quyền vị trí, không thể chấm công.",
				});
				setLocating(false);
			}
		);
	};

	const buildPayload = () => ({
		nhan_vien_id: user?.id,
		vi_tri: location.address || undefined,
		vi_do: location.lat ?? undefined,
		kinh_do: location.lng ?? undefined,
		bao_cao: note || undefined,
	});

	const handleCheckIn = async () => {
		if (!user?.id) {
			return;
		}
		if (!hasLocation) {
			setLocationStatus({
				type: "error",
				message: "Vui lòng bật định vị hoặc nhập địa chỉ trước khi check-in.",
			});
			return;
		}
		await submitCheckIn(buildPayload());
	};

	const handleCheckOut = async () => {
		if (!user?.id) {
			return;
		}
		if (!hasLocation) {
			setLocationStatus({
				type: "error",
				message: "Vui lòng bật định vị hoặc nhập địa chỉ trước khi check-out.",
			});
			return;
		}
		await submitCheckOut(buildPayload());
	};

	return (
		<section className="admin-section">
			<div className="admin-section-header">
				<div>
					<h2>Chấm công</h2>
					<p>Ghi nhận thời gian vào/ra làm việc và vị trí thực hiện.</p>
				</div>
				<div className="admin-actions">
					<button type="button" className="ghost" onClick={requestLocation}>
						{locating ? "Đang lấy vị trí..." : "Cập nhật vị trí"}
					</button>
					<button type="button" onClick={handleCheckIn}>
						Check-in
					</button>
					<button type="button" className="ghost" onClick={handleCheckOut}>
						Check-out
					</button>
				</div>
			</div>

			<div className="admin-grid">
				<div className="admin-card">
					<h3>Hôm nay</h3>
					{attendanceLoading ? (
						<p>Đang tải dữ liệu chấm công...</p>
					) : attendanceToday ? (
						<div className="card-stack">
							<p>Trạng thái: {attendanceToday.trang_thai_hien_tai || "-"}</p>
							<p>Check-in: {attendanceToday.check_in || "-"}</p>
							<p>Check-out: {attendanceToday.check_out || "-"}</p>
							<p>Số giờ làm: {attendanceToday.so_gio_lam ?? "-"}</p>
							<p>
								Vị trí check-in: {attendanceToday.check_in_location?.address || "-"}
							</p>
							<p>
								Vị trí check-out: {attendanceToday.check_out_location?.address || "-"}
							</p>
						</div>
					) : (
						<p>Chưa có dữ liệu chấm công hôm nay.</p>
					)}
				</div>

				<div className="admin-card">
					<h3>Ghi chú & vị trí</h3>
					<div className="form-group">
						<label>Địa chỉ (nếu không dùng GPS)</label>
						<input
							value={location.address}
							onChange={(event) =>
								setLocation((prev) => ({
									...prev,
									address: event.target.value,
								}))
							}
						/>
					</div>
					<div className="form-group">
						<label>Ghi chú</label>
						<textarea
							rows="3"
							value={note}
							onChange={(event) => setNote(event.target.value)}
						/>
					</div>
					<div className="card-stack">
						<p>Vĩ độ: {location.lat ?? "-"}</p>
						<p>Kinh độ: {location.lng ?? "-"}</p>
					</div>
					{locationStatus.message ? (
						<div className={`alert ${locationStatus.type}`}>
							{locationStatus.message}
						</div>
					) : null}
					{attendanceStatus.message ? (
						<div className={`alert ${attendanceStatus.type}`}>
							{attendanceStatus.message}
						</div>
					) : null}
				</div>
			</div>

			<div className="admin-table">
				<h3>Lịch sử 7 ngày gần nhất</h3>
				<table>
					<thead>
						<tr>
							<th>Ngày</th>
							<th>Check-in</th>
							<th>Check-out</th>
							<th>Trạng thái</th>
							<th>Số giờ</th>
						</tr>
					</thead>
					<tbody>
						{attendanceLoading ? (
							<tr>
								<td colSpan="5">Đang tải dữ liệu...</td>
							</tr>
						) : attendanceHistory.length === 0 ? (
							<tr>
								<td colSpan="5">Chưa có dữ liệu chấm công.</td>
							</tr>
						) : (
							attendanceHistory.map((item) => (
								<tr key={item.id}>
									<td>{item.ngay || "-"}</td>
									<td>{item.check_in || "-"}</td>
									<td>{item.check_out || "-"}</td>
									<td>{item.trang_thai_hien_tai || item.trang_thai || "-"}</td>
									<td>{item.so_gio_lam ?? "-"}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}

export default AttendancePage;
