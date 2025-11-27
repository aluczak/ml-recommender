import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

const navigation = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Catalog" },
];

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
  <div className="app-shell">
    <header className="app-header">
      <div className="brand">ML Recommender Shop</div>
      <nav>
        <ul>
          {navigation.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
    <main className="app-content">{children}</main>
    <footer className="app-footer">
      <small>Learning project - Placeholder recommendations for now</small>
    </footer>
  </div>
);

export default Layout;
