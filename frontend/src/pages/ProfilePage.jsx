import React, { useEffect, useMemo, useState } from "react";

const editableFields = {
	ho_ten: "",
	so_dien_thoai: "",
	gioi_tinh: "",
	ngay_sinh: "",
	avatar_url: "",
};

const normalizeGender = (value) => {
	if (value === "Nữ" || value === "Ná»¯") {
		return "Nữ";
	}
	if (value === "Khác" || value === "KhÃ¡c") {
		return "Khác";
	}
	return value || "";
};

function ProfilePage({ user, fetchProfile, updateProfile }) {
	const [profile, setProfile] = useState(user);
	const [form, setForm] = useState(editableFields);
	const [editing, setEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState({ type: "", message: "" });

	useEffect(() => {
		let mounted = true;
		const loadProfile = async () => {
			if (!user?.id || !fetchProfile) {
				return;
			}
			setLoading(true);
			setStatus({ type: "", message: "" });
			try {
				const data = await fetchProfile(user.id);
				if (mounted && data) {
					setProfile(data);
				}
			} catch (error) {
				if (mounted) {
					setStatus({ type: "error", message: error.message });
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};
		loadProfile();
		return () => {
			mounted = false;
		};
	}, [user?.id, fetchProfile]);

	useEffect(() => {
		setForm({
			ho_ten: profile?.ho_ten || "",
			so_dien_thoai: profile?.so_dien_thoai || "",
			gioi_tinh: normalizeGender(profile?.gioi_tinh),
			ngay_sinh: profile?.ngay_sinh || "",
			avatar_url: profile?.avatar_url || "",
		});
	}, [profile]);

	const initials = useMemo(
		() =>
			(profile?.ho_ten || profile?.email || "U")
				.split(" ")
				.filter(Boolean)
				.slice(-2)
				.map((part) => part[0])
				.join("")
				.toUpperCase(),
		[profile]
	);

	const display = (value) => value || "-";

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const openEdit = () => {
		setStatus({ type: "", message: "" });
		setEditing(true);
	};

	const cancelEdit = () => {
		setForm({
			ho_ten: profile?.ho_ten || "",
			so_dien_thoai: profile?.so_dien_thoai || "",
			gioi_tinh: normalizeGender(profile?.gioi_tinh),
			ngay_sinh: profile?.ngay_sinh || "",
			avatar_url: profile?.avatar_url || "",
		});
		setEditing(false);
		setStatus({ type: "", message: "" });
	};

	const submitProfile = async (event) => {
		event.preventDefault();
		if (!profile?.id || !updateProfile) {
			return;
		}
		if (!form.ho_ten.trim()) {
			setStatus({ type: "error", message: "Vui lòng nhập họ tên." });
			return;
		}

		setSaving(true);
		setStatus({ type: "", message: "" });
		try {
			const payload = Object.fromEntries(
				Object.entries(form).map(([key, value]) => [key, value.trim() || null])
			);
			payload.gioi_tinh = normalizeGender(payload.gioi_tinh);
			const data = await updateProfile(profile.id, payload);
			if (data) {
				setProfile((prev) => ({ ...(prev || {}), ...data }));
			}
			setEditing(false);
			setStatus({ type: "success", message: "Cập nhật hồ sơ thành công." });
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		} finally {
			setSaving(false);
		}
	};

	return (
		<section className="profile-page">
			<div className="profile-card">
				<div className="profile-card-header">
					<h2>
						<span className="profile-heading-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24">
								<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
								<path d="M4 21a8 8 0 0 1 16 0" />
							</svg>
						</span>
						Hồ sơ cá nhân
					</h2>
					{editing ? null : (
						<button type="button" className="profile-edit-button" onClick={openEdit}>
							<span aria-hidden="true">✎</span>
							Chỉnh sửa
						</button>
					)}
				</div>

				{status.message ? <p className={`status ${status.type}`}>{status.message}</p> : null}
				{loading ? <p className="profile-loading">Đang tải hồ sơ...</p> : null}

				<div className="profile-layout">
					<div className="profile-identity">
						<div className="profile-avatar-large">
							{profile?.avatar_url ? (
								<img src={profile.avatar_url} alt={profile.ho_ten || "Avatar"} />
							) : (
								initials
							)}
						</div>
						<h3>{display(profile?.ho_ten)}</h3>
						<p>{display(profile?.email)}</p>
					</div>

					<div className="profile-details">
						{editing ? (
							<form className="profile-edit-form" onSubmit={submitProfile}>
								<label>
									<span>Họ tên</span>
									<input name="ho_ten" value={form.ho_ten} onChange={handleChange} required />
								</label>
								<label>
									<span>SĐT</span>
									<input name="so_dien_thoai" value={form.so_dien_thoai} onChange={handleChange} />
								</label>
								<label>
									<span>Giới tính</span>
									<select name="gioi_tinh" value={form.gioi_tinh} onChange={handleChange}>
										<option value="">Chưa chọn</option>
										<option value="Nam">Nam</option>
										<option value="Nữ">Nữ</option>
										<option value="Khác">Khác</option>
									</select>
								</label>
								<label>
									<span>Ngày sinh</span>
									<input type="date" name="ngay_sinh" value={form.ngay_sinh} onChange={handleChange} />
								</label>
								<label className="profile-form-wide">
									<span>Ảnh đại diện URL</span>
									<input name="avatar_url" value={form.avatar_url} onChange={handleChange} placeholder="https://..." />
								</label>
								<div className="profile-form-actions">
									<button type="submit" className="profile-edit-button" disabled={saving}>
										{saving ? "Đang lưu..." : "Lưu thay đổi"}
									</button>
									<button type="button" className="profile-cancel-button" onClick={cancelEdit} disabled={saving}>
										Hủy
									</button>
								</div>
							</form>
						) : (
							<>
								<div className="profile-info-panel">
									<div><span>SĐT:</span><strong>{display(profile?.so_dien_thoai)}</strong></div>
									<div><span>Giới tính:</span><strong>{display(profile?.gioi_tinh)}</strong></div>
									<div><span>Ngày sinh:</span><strong>{display(profile?.ngay_sinh)}</strong></div>
									<div><span>Phòng ban:</span><strong>{display(profile?.phong_ban || profile?.phong_ban_id)}</strong></div>
									<div><span>Chức vụ:</span><strong>{display(profile?.chuc_vu)}</strong></div>
									<div><span>Ngày vào làm:</span><strong>{display(profile?.ngay_vao_lam)}</strong></div>
									<div><span>Trạng thái:</span><strong><span className="profile-badge success">{display(profile?.trang_thai_lam_viec)}</span></strong></div>
									<div><span>Vai trò:</span><strong><span className="profile-badge info">{display(profile?.vai_tro)}</span></strong></div>
								</div>
								<div className="profile-created-panel">
									<span>Ngày tạo tài khoản:</span>
									<strong>{display(profile?.ngay_tao)}</strong>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

export default ProfilePage;
