import React from "react";
import { Link } from "react-router-dom";

function DashboardPage({ user, isAdmin }) {
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
						<Link className="hero-btn" to="/attendance">
							Check-in nhanh
						</Link>
						<Link className="hero-btn ghost" to="/tasks">
							Xem công việc hôm nay
						</Link>
						{isAdmin ? (
							<Link className="hero-btn ghost" to="/employees">
								Quản lý nhân sự
							</Link>
						) : null}
					</div>
				</div>
				<div className="hero-panel">
					<div className="stat-grid">
						<div className="stat-card">
							<span className="stat-label">Trạng thái hôm nay</span>
							<span className="stat-value">Sẵn sàng</span>
							<span className="stat-note">Giờ làm việc 08:00 - 17:00</span>
						</div>
						<div className="stat-card">
							<span className="stat-label">Lịch họp</span>
							<span className="stat-value">2</span>
							<span className="stat-note">Cuộc họp nội bộ</span>
						</div>
						<div className="stat-card">
							<span className="stat-label">Nhiệm vụ gấp</span>
							<span className="stat-value">3</span>
							<span className="stat-note">Cập nhật trong tuần</span>
						</div>
						<div className="stat-card">
							<span className="stat-label">Thông báo mới</span>
							<span className="stat-value">5</span>
							<span className="stat-note">Từ phòng ban</span>
						</div>
					</div>
				</div>
			</section>

			<section className="quick-grid">
				<div className="quick-card">
					<span className="badge">Chấm công</span>
					<h3>Check-in / Check-out</h3>
					<p>Ghi nhận thời gian và vị trí làm việc trong ngày.</p>
					<Link className="quick-action" to="/attendance">
						Mở chấm công
					</Link>
				</div>
				<div className="quick-card">
					<span className="badge">Công việc</span>
					<h3>Theo dõi tiến độ</h3>
					<p>Danh sách nhiệm vụ, deadline và ưu tiên xử lý.</p>
					<Link className="quick-action" to="/tasks">
						Xem công việc
					</Link>
				</div>
				<div className="quick-card">
					<span className="badge">Dự án</span>
					<h3>Đồng bộ dự án</h3>
					<p>Trạng thái dự án, leader và lịch trình quan trọng.</p>
					<Link className="quick-action" to="/projects">
						Mở dự án
					</Link>
				</div>
				{isAdmin ? (
					<div className="quick-card">
						<span className="badge">Nhân sự</span>
						<h3>Điều phối nhân sự</h3>
						<p>Quản lý phòng ban, phân quyền và cập nhật hồ sơ.</p>
						<Link className="quick-action" to="/employees">
							Quản lý nhân sự
						</Link>
					</div>
				) : (
					<div className="quick-card">
						<span className="badge">Phòng ban</span>
						<h3>Kết nối nội bộ</h3>
						<p>Thông tin phòng ban, thông báo và hỗ trợ.</p>
						<Link className="quick-action" to="/departments">
							Xem phòng ban
						</Link>
					</div>
				)}
			</section>

			<section className="panel-grid">
				<div className="panel-card">
					<h3>Nhắc nhở hôm nay</h3>
					<ul className="panel-list">
						<li>08:30 - Standup nội bộ</li>
						<li>14:00 - Cập nhật tiến độ dự án</li>
						<li>16:30 - Báo cáo nhanh cuối ngày</li>
					</ul>
				</div>
				<div className="panel-card">
					<h3>Thông báo nổi bật</h3>
					<div className="panel-note">
						<p>Chính sách làm việc linh hoạt đã được cập nhật.</p>
						<p>Đừng quên hoàn thành KPI tuần trước 17:00.</p>
					</div>
				</div>
			</section>
		</>
	);
}

export default DashboardPage;
