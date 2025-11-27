import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Catalog from "./routes/Catalog";
import Home from "./routes/Home";
import NotFound from "./routes/NotFound";

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

export default App;
