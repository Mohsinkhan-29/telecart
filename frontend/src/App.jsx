import { Link, Navigate, Route, Routes } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import { About, Contact, Policies } from "./pages/InfoPages";
import AdminLayout from "./admin/AdminLayout";
import { Login, ForgotPassword, ResetPassword } from "./admin/AuthPages";
import Dashboard from "./admin/Dashboard";
import Catalog from "./admin/Catalog";
import ProductForm from "./admin/ProductForm";
import Orders from "./admin/Orders";
import Ledger from "./admin/Ledger";
import CustomerLedger from "./admin/CustomerLedger";
import Knowledge from "./admin/Knowledge";
import SiteContent from "./admin/SiteContent";
import Categories from "./admin/Categories";
import Subscribers from "./admin/Subscribers";

const NotFound = () => (
  <section className="tc-sec">
    <div className="tc-wrap tc-empty">
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Page not found</h1>
      <p style={{ color: "var(--mute)", marginBottom: 24 }}>The page you are looking for has moved or no longer exists.</p>
      <Link to="/products" className="tc-btn tc-btn-lime">Browse products</Link>
    </div>
  </section>
);

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="delivery-returns" element={<Policies />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="ledger/:id" element={<CustomerLedger />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="catalog/new" element={<ProductForm />} />
        <Route path="catalog/:id" element={<ProductForm />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="content" element={<SiteContent />} />
        <Route path="categories" element={<Categories />} />
        <Route path="subscribers" element={<Subscribers />} />
      </Route>
    </Routes>
  );
}
