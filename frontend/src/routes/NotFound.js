import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
const NotFound = () => (_jsxs("section", { className: "not-found", children: [_jsx("h2", { children: "404" }), _jsx("p", { children: "The page you requested does not exist yet." }), _jsx(Link, { to: "/", className: "button", children: "Back to home" })] }));
export default NotFound;
