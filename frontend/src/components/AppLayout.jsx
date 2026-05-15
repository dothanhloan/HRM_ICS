import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpg";

function AppLayout({ user, menuItems, iconMap, onLogout }) {
	const location = useLocation();
	const [accountOpen, setAccountOpen] = useState(false);
	const accountRef = useRef(null);

	const isItemActive = (item) => {
		if (item.children?.some((child) => location.pathname === child.to)) {
			return true;
		}
		return location.pathname === item.to;
	};

	const initials = (user?.ho_ten || user?.email || "U")
		.split(" ")
		.filter(Boolean)
		.slice(-2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (accountRef.current && !accountRef.current.contains(event.target)) {
				setAccountOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="home-shell">
			<aside className="home-sidebar">
				<div className="sidebar-brand">
					<img className="brand-logo" src={logo} alt="ICS" />
				</div>
				<nav className="sidebar-menu">
					{menuItems.map((item) => {
						const hasChildren = Boolean(item.children?.length);
						const active = isItemActive(item);
						return (
							<div key={item.label} className={`sidebar-group ${active ? "active" : ""}`}>
								<NavLink
									to={item.to}
									className={({ isActive }) =>
										`sidebar-item ${isActive || active ? "active" : ""}`
									}
								>
									<span className={`sidebar-icon icon-${item.icon}`}>
										{iconMap[item.icon]}
									</span>
									<span>{item.label}</span>
									{hasChildren ? (
										<span className="sidebar-caret" aria-hidden="true">
											{active ? "^" : "v"}
										</span>
									) : null}
								</NavLink>
								{hasChildren && active ? (
									<div className="sidebar-submenu">
										{item.children.map((child) => (
											<NavLink
												key={child.label}
												to={child.to}
												className={({ isActive }) =>
													`sidebar-subitem ${isActive ? "active" : ""}`
												}
											>
												<span className={`sidebar-icon icon-${child.icon}`}>
													{iconMap[child.icon]}
												</span>
												<span>{child.label}</span>
											</NavLink>
										))}
									</div>
								) : null}
							</div>
						);
					})}
				</nav>
			</aside>
			<main className="home-main">
				<header className="home-header">
					<div className="header-spacer" aria-hidden="true" />
					<div className="account-menu" ref={accountRef}>
						<button
							type="button"
							className="account-trigger"
							onClick={() => setAccountOpen((open) => !open)}
							aria-expanded={accountOpen}
						>
							<span className="account-avatar">
								{user.avatar_url ? (
									<img src={user.avatar_url} alt={user.ho_ten || "Avatar"} />
								) : (
									initials
								)}
							</span>
							<span className="account-name">{user.ho_ten}</span>
							<span className="account-caret" aria-hidden="true" />
						</button>
						{accountOpen ? (
							<div className="account-dropdown">
								<Link to="/profile" onClick={() => setAccountOpen(false)}>
									<span className="dropdown-icon profile-icon" aria-hidden="true">
										{iconMap.people}
									</span>
									Hồ sơ cá nhân
								</Link>
								<Link to="/change-password" onClick={() => setAccountOpen(false)}>
									<span className="dropdown-icon password-icon" aria-hidden="true">
										{iconMap.key}
									</span>
									Đổi mật khẩu
								</Link>
								<button type="button" onClick={onLogout}>
									<span className="dropdown-icon logout-icon" aria-hidden="true">
										{iconMap.logout}
									</span>
									Đăng xuất
								</button>
							</div>
						) : null}
					</div>
				</header>
				<Outlet />
			</main>
		</div>
	);
}

export default AppLayout;
