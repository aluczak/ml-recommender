import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
const navigation = [
    { to: "/", label: "Home" },
    { to: "/catalog", label: "Catalog" },
];
const Layout = ({ children }) => (_jsxs("div", { className: "app-shell", children: [_jsxs("header", { className: "app-header", children: [_jsx("div", { className: "brand", children: "ML Recommender Shop" }), _jsx("nav", { children: _jsx("ul", { children: navigation.map((link) => (_jsx("li", { children: _jsx(NavLink, { to: link.to, className: ({ isActive }) => (isActive ? "active" : ""), children: link.label }) }, link.to))) }) })] }), _jsx("main", { className: "app-content", children: children }), _jsx("footer", { className: "app-footer", children: _jsx("small", { children: "Learning project \u00B7 Placeholder recommendations for now" }) })] }));
export default Layout;
