import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SHOP } from "../lib/format";

const LINKS = [
  ["/admin/dashboard", "Dashboard"], ["/admin/orders", "Orders"], ["/admin/ledger", "Ledger"],
  ["/admin/catalog", "Catalog"], ["/admin/categories", "Categories"], 
  // ["/admin/content", "Site content"],
  ["/admin/subscribers", "Newsletter"], ["/admin/knowledge", "Chatbot"],
];

export default function AdminLayout() {
  const { token, logout } = useAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 bg-asphalt-2 border-b md:border-b-0 md:border-r border-steel-line p-5 flex md:flex-col gap-4">
        <div className="font-display uppercase tracking-wide text-sm">{SHOP} <span className="text-amber">Admin</span></div>
        <nav className="flex md:flex-col gap-1 flex-1 overflow-x-auto">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `px-3 py-2 rounded text-sm font-display uppercase tracking-wide whitespace-nowrap hover:bg-steel hover:text-amber ${isActive ? "bg-steel text-amber" : "text-chrome-light"}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="hidden md:block pt-4 border-t border-steel-line">
          <button onClick={logout} className="btn btn-outline w-full text-xs py-2">Log out</button>
          <Link to="/" className="block text-center text-xs text-chrome hover:text-amber mt-3">View store ↗</Link>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 min-w-0"><Outlet /></main>
    </div>
  );
}
