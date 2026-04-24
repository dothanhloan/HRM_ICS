import React, { useState } from "react";
import logo from "../assets/logo.jpg";

function LoginPage({
	identifier,
	password,
	status,
	loading,
	onIdentifierChange,
	onPasswordChange,
	onSubmit,
}) {
	const [modalType, setModalType] = useState("");

	const closeModal = () => setModalType("");
	const openCulture = () => setModalType("culture");
	const openGuide = () => setModalType("guide");

	return (
		<div className="login-page">
			<div className="login-shell">
				<section className="login-card">
					<div className="login-card-left">
						<div className="login-logo">
							<div className="logo-mark">
								<img
									className="logo-image"
									src={logo}
									alt="ICS Cyber Security"
								/>
							</div>
							<p className="logo-text">CYBER SECURITY</p>
						</div>
						<div className="login-links">
							<button type="button" className="link-button" onClick={openCulture}>
								Văn hóa doanh nghiệp ICS
							</button>
							<button type="button" className="link-button" onClick={openGuide}>
								Hướng dẫn sử dụng Website
							</button>
						</div>
					</div>
					<div className="login-card-right">
						<div className="login-heading">
							<p className="login-tagline">Mùa hè vẫy gọi tới ICS</p>
							<h1>Chào mừng bạn trở lại</h1>
							<p className="login-subtitle">
								Hãy đăng nhập để tiếp tục công việc hôm nay.
							</p>
						</div>
						<form className="login-form" onSubmit={onSubmit}>
							<div className="form-group">
								<label htmlFor="identifier">Email</label>
								<div className="input-shell">
									<input
										id="identifier"
										type="text"
										placeholder="name@company.com"
										value={identifier}
										onChange={(event) => onIdentifierChange(event.target.value)}
									/>
								</div>
							</div>
							<div className="form-group">
								<label htmlFor="password">Password</label>
								<div className="input-shell">
									<input
										id="password"
										type="password"
										placeholder="Nhập mật khẩu"
										value={password}
										onChange={(event) => onPasswordChange(event.target.value)}
									/>
								</div>
							</div>
							{status.message ? (
								<div className={`alert ${status.type}`}>{status.message}</div>
							) : null}
							<div className="login-row">
								<label className="checkbox">
									<input type="checkbox" />
									<span>Ghi nhớ đăng nhập</span>
								</label>
								<a className="helper-link" href="#">
									Quên mật khẩu?
								</a>
							</div>
							<button className="login-submit" type="submit" disabled={loading}>
								{loading ? "Đang xử lý..." : "Đăng nhập"}
							</button>
						</form>
					</div>
				</section>
				{modalType ? (
					<div className="modal-backdrop" onClick={closeModal}>
						<div className="modal login-modal" onClick={(event) => event.stopPropagation()}>
							<div className="modal-header">
								<h2>
									{modalType === "culture"
										? "Văn hóa ICS – Nội quy cơ bản"
										: "Hướng dẫn sử dụng Website"}
								</h2>
								<button type="button" className="modal-close" onClick={closeModal}>
									Đóng
								</button>
							</div>
							{modalType === "culture" ? (
								<div className="modal-body">
									<ol>
										<li>
											<strong>Giờ giấc làm việc:</strong> Làm việc từ Thứ 2 – Thứ 6,
											thời gian: 08h00 – 17h00 (nghỉ trưa 12h00 – 13h00).
											Có mặt đúng giờ, hạn chế đi muộn hoặc về sớm.
										</li>
										<li>
											<strong>Trang phục:</strong> Ăn mặc lịch sự, gọn gàng; ưu tiên
											áo sơ mi, áo polo, quần/váy công sở.
										</li>
										<li>
											<strong>Tác phong:</strong> Giao tiếp văn minh, tôn trọng đồng
											nghiệp và khách hàng. Thái độ chủ động, trách nhiệm.
										</li>
										<li>
											<strong>An ninh – Bảo mật:</strong> Không chia sẻ thông tin nội bộ
											ra ngoài khi chưa được phép. Tuân thủ nghiêm ngặt quy định ATTT.
										</li>
									</ol>
								</div>
							) : (
								<div className="modal-body">
									<div className="video-placeholder">
										<p>Video hướng dẫn sẽ được cập nhật tại đây.</p>
									</div>
								</div>
							)}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

export default LoginPage;
