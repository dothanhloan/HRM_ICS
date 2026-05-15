import React, { useState } from "react";

function ChangePasswordPage({ user, changePassword }) {
	const [form, setForm] = useState({
		old_password: "",
		new_password: "",
		confirm_password: "",
	});
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState({ type: "", message: "" });

	const updateField = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setStatus({ type: "", message: "" });
		if (!form.old_password || !form.new_password || !form.confirm_password) {
			setStatus({ type: "error", message: "Vui lòng nhập đầy đủ thông tin." });
			return;
		}
		if (form.new_password !== form.confirm_password) {
			setStatus({ type: "error", message: "Mật khẩu mới không khớp." });
			return;
		}
		setLoading(true);
		try {
			await changePassword({
				user_id: user.id,
				old_password: form.old_password,
				new_password: form.new_password,
			});
			setForm({ old_password: "", new_password: "", confirm_password: "" });
			setStatus({ type: "success", message: "Đổi mật khẩu thành công." });
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="password-page">
			<div className="password-card">
				<h2>
					<span className="profile-heading-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24">
							<path d="M15 7a4 4 0 1 1-2.8-3.8" />
							<path d="M12 12 4 20" />
							<path d="m6 18 2 2" />
							<path d="m9 15 2 2" />
						</svg>
					</span>
					Đổi mật khẩu
				</h2>

				<form className="password-form" onSubmit={handleSubmit}>
					{status.message ? <p className={`status ${status.type}`}>{status.message}</p> : null}
					<label>
						Mật khẩu cũ
						<input
							type="password"
							value={form.old_password}
							onChange={(event) => updateField("old_password", event.target.value)}
						/>
					</label>
					<label>
						Mật khẩu mới
						<input
							type="password"
							value={form.new_password}
							onChange={(event) => updateField("new_password", event.target.value)}
						/>
					</label>
					<label>
						Nhập lại mật khẩu mới
						<input
							type="password"
							value={form.confirm_password}
							onChange={(event) => updateField("confirm_password", event.target.value)}
						/>
					</label>
					<button type="submit" disabled={loading}>
						{loading ? "Đang đổi..." : "Đổi mật khẩu"}
					</button>
				</form>
			</div>
		</section>
	);
}

export default ChangePasswordPage;
