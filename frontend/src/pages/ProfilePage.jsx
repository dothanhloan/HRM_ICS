import React, { useEffect, useMemo, useState } from "react";

function ProfilePage({ user, fetchProfile }) {
	const [profile, setProfile] = useState(user);
	const [loading, setLoading] = useState(false);
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
					<button type="button" className="profile-edit-button">
						<span aria-hidden="true">✎</span>
						Chỉnh sửa
					</button>
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
						<div className="profile-info-panel">
							<div>
								<span>SĐT:</span>
								<strong>{display(profile?.so_dien_thoai)}</strong>
							</div>
							<div>
								<span>Giới tính:</span>
								<strong>{display(profile?.gioi_tinh)}</strong>
							</div>
							<div>
								<span>Ngày sinh:</span>
								<strong>{display(profile?.ngay_sinh)}</strong>
							</div>
							<div>
								<span>Phòng ban:</span>
								<strong>{display(profile?.phong_ban || profile?.phong_ban_id)}</strong>
							</div>
							<div>
								<span>Chức vụ:</span>
								<strong>{display(profile?.chuc_vu)}</strong>
							</div>
							<div>
								<span>Ngày vào làm:</span>
								<strong>{display(profile?.ngay_vao_lam)}</strong>
							</div>
							<div>
								<span>Trạng thái:</span>
								<strong>
									<span className="profile-badge success">
										{display(profile?.trang_thai_lam_viec)}
									</span>
								</strong>
							</div>
							<div>
								<span>Vai trò:</span>
								<strong>
									<span className="profile-badge info">{display(profile?.vai_tro)}</span>
								</strong>
							</div>
						</div>

						<div className="profile-created-panel">
							<span>Ngày tạo tài khoản:</span>
							<strong>{display(profile?.ngay_tao)}</strong>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default ProfilePage;
