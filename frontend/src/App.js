import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Catalog from "./routes/Catalog";
import Home from "./routes/Home";
import NotFound from "./routes/NotFound";
const App = () => (_jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/catalog", element: _jsx(Catalog, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFound, {}) })] }) }));
export default App;
