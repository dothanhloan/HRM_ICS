import React, { useState } from "react";
import logo from "../assets/logo.jpg";

function LoginPage({
	identifier,
	password,
	status,
	loading,
	onIdentifierChange,
	onPasswordChange,
	rememberLogin,
	onRememberLoginChange,
	onSubmit,
}) {
	const [modalType, setModalType] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const closeModal = () => setModalType("");
	const openCulture = () => setModalType("culture");

	return (
		<div className="login-page">
			<div className="login-shell">
				<section className="login-card">
					<div className="login-card-left">
						<div className="login-logo">
							<div className="logo-mark">
								<img className="logo-image" src={logo} alt="ICS Cyber Security" />
							</div>
							<p className="logo-text">CYBER SECURITY</p>
						</div>
						<div className="login-links">
							<button type="button" className="link-button" onClick={openCulture}>
								Văn hóa doanh nghiệp ICS
							</button>
						</div>
					</div>
					<div className="login-card-right">
						<div className="login-heading">
							<h1>Đăng nhập hệ thống</h1>
							<p className="login-subtitle">
								Sử dụng tài khoản ICS của bạn để tiếp tục công việc hôm nay.
							</p>
						</div>
						<form className="login-form" onSubmit={onSubmit}>
							<div className="form-group">
								<label htmlFor="identifier" className="field-label"><span>✉</span>Email</label>
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
								<label htmlFor="password" className="field-label"><span>🔒</span>Password</label>
								<div className="input-shell">
									<input
										id="password"
										type={showPassword ? "text" : "password"}
										placeholder="Nhập mật khẩu"
										value={password}
										onChange={(event) => onPasswordChange(event.target.value)}
									/>
									<button
										type="button"
										className="password-toggle"
										onClick={() => setShowPassword((current) => !current)}
										aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
									>
										{showPassword ? "🙈" : "👁"}
									</button>
								</div>
							</div>
							{status.message ? <div className={`alert ${status.type}`}>{status.message}</div> : null}
							<div className="login-row">
								<label className="checkbox">
									<input
										type="checkbox"
										checked={rememberLogin}
										onChange={(event) => onRememberLoginChange(event.target.checked)}
									/>
									<span>Ghi nhớ đăng nhập</span>
								</label>
							</div>
							<button className="login-submit" type="submit" disabled={loading}>
								{loading ? "Đang xử lý..." : "Đăng nhập"}
							</button>
						</form>
					</div>
				</section>
				{modalType === "culture" ? (
					<div className="modal-backdrop" onClick={closeModal}>
						<div className="modal login-modal" onClick={(event) => event.stopPropagation()}>
							<div className="modal-header">
								<h2>Văn hóa ICS – Nội quy cơ bản</h2>
								<button type="button" className="modal-close" onClick={closeModal}>Đóng</button>
							</div>
							<div className="modal-body">
								<ol>
									<li><strong>Giờ giấc làm việc:</strong> Làm việc từ Thứ 2 – Thứ 6, 08h00 – 17h00.</li>
									<li><strong>Trang phục:</strong> Ăn mặc lịch sự, gọn gàng; ưu tiên áo sơ mi, áo polo.</li>
									<li><strong>Tác phong:</strong> Giao tiếp văn minh, tôn trọng đồng nghiệp và khách hàng.</li>
									<li><strong>An ninh – Bảo mật:</strong> Không chia sẻ thông tin nội bộ khi chưa được phép.</li>
								</ol>
							</div>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

export default LoginPage;
