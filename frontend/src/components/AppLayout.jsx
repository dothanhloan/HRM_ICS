import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import logo from "../assets/logo.jpg";

function AppLayout({ user, menuItems, iconMap, onLogout }) {
	return (
		<div className="home-shell">
			<aside className="home-sidebar">
				<div className="sidebar-brand">
					<img className="brand-logo" src={logo} alt="ICS" />
				</div>
				<nav className="sidebar-menu">
					{menuItems.map((item) => (
						<NavLink
							key={item.label}
							to={item.to}
							className={({ isActive }) =>
								`sidebar-item ${isActive ? "active" : ""}`
							}
						>
							<span className="sidebar-icon">{iconMap[item.icon]}</span>
							<span>{item.label}</span>
						</NavLink>
					))}
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
