import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Catalog from "./routes/Catalog";
import Home from "./routes/Home";
import NotFound from "./routes/NotFound";
import ProductDetail from "./routes/ProductDetail";
import Login from "./routes/Login";
import Signup from "./routes/Signup";

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/catalog/:productId" element={<ProductDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

export default App;
