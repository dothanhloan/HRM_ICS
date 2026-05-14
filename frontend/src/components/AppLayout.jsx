import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpg";

function AppLayout({ user, menuItems, iconMap, onLogout }) {
	const location = useLocation();
	const isItemActive = (item) => {
		if (item.children?.some((child) => location.pathname === child.to)) {
			return true;
		}
		return location.pathname === item.to;
	};

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
							<div
								key={item.label}
								className={`sidebar-group ${active ? "active" : ""}`}
							>
								<NavLink
									to={item.to}
									className={({ isActive }) =>
										`sidebar-item ${isActive || active ? "active" : ""}`
									}
								>
									<span className="sidebar-icon">{iconMap[item.icon]}</span>
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
												<span className="sidebar-icon">{iconMap[child.icon]}</span>
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
					<div>
						<h1>Xin chào, {user.ho_ten}</h1>
						<p>
							Vai trò: {user.vai_tro || "Nhân viên"} • Email: {user.email}
						</p>
					</div>
					<button type="button" onClick={onLogout}>
						Đăng xuất
					</button>
				</header>
				<Outlet />
			</main>
		</div>
	);
}

export default AppLayout;
