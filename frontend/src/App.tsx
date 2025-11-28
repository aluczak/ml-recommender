import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Catalog from "./routes/Catalog";
import Home from "./routes/Home";
import NotFound from "./routes/NotFound";
import ProductDetail from "./routes/ProductDetail";
import Login from "./routes/Login";
import Signup from "./routes/Signup";
import Cart from "./routes/Cart";
import CheckoutSuccess from "./routes/CheckoutSuccess";

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/catalog/:productId" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/cart/confirmation" element={<CheckoutSuccess />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

export default App;
