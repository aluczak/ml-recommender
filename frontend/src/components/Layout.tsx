import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Catalog" },
];

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const displayName = user?.full_name?.trim() || user?.email;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">ML Recommender Shop</div>
        <nav className="primary-nav">
          <ul>
            {navigation.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={({ isActive }) => (isActive ? "active" : "")}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="auth-nav">
          {user ? (
            <div className="user-pill">
              <span className="user-name">{displayName}</span>
              <button type="button" className="button button-ghost button-small" onClick={logout}>
                Log out
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <NavLink to="/login" className={({ isActive }) => (isActive ? "active" : "")}>Log in</NavLink>
              <NavLink to="/signup" className="button button-secondary button-small">
                Sign up
              </NavLink>
            </div>
          )}
        </div>
      </header>
      <main className="app-content">{children}</main>
      <footer className="app-footer">
        <small>Learning project - Placeholder recommendations for now</small>
      </footer>
    </div>
  );
};

export default Layout;
