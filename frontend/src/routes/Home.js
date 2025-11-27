import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
const Home = () => (_jsx("section", { className: "home", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Welcome to the learning shop" }), _jsx("h1", { children: "Discover curated products backed by data." }), _jsx("p", { children: "Browse the sample catalog, play with the cart, and soon experience machine-learning driven recommendations." }), _jsxs("div", { className: "cta-row", children: [_jsx(Link, { to: "/catalog", className: "button", children: "Explore catalog" }), _jsx("button", { className: "button button-secondary", type: "button", disabled: true, children: "Personalized picks (coming soon)" })] })] }) }));
export default Home;
