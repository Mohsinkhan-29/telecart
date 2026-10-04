import { Link } from "react-router-dom";
import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { ErrorBox, Loading } from "../components/Status";
import { formatPKR } from "../lib/format";

export default function Catalog() {
  const { data, error, loading, reload } = useFetch(() => adminApi.get("/products"));
  const toggle = async (id) => { try { await adminApi.patch(`/products/${id}/toggle`); reload(); } catch (e) { alert(e.message); } };
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl">Catalog</h1>
        <Link to="/admin/catalog/new" className="btn btn-primary">+ New product</Link>
      </div>
      <div className="overflow-x-auto border border-steel-line rounded">
        <table className="w-full text-sm">
          <thead><tr><th className="th">Product</th><th className="th">Category</th><th className="th">Price</th><th className="th">Stock</th><th className="th">Status</th><th className="th" /></tr></thead>
          <tbody>
            {data.map((p) => {
              const prices = p.variants.map((v) => v.price);
              return (
                <tr key={p.id}>
                  <td className="td"><Link to={`/admin/catalog/${p.id}`} className="hover:text-amber font-semibold">{p.name}</Link>
                    <div className="text-xs text-chrome">{p.brand} · {p.variants.length} variant{p.variants.length === 1 ? "" : "s"}</div></td>
                  <td className="td">{p.categoryName}</td>
                  <td className="td font-mono">{prices.length ? formatPKR(Math.min(...prices)) : "—"}</td>
                  <td className="td font-mono">{p.variants.reduce((n, v) => n + v.stock, 0)}</td>
                  <td className="td">{p.isActive ? <span className="text-ok">Live</span> : <span className="text-chrome">Hidden</span>}</td>
                  <td className="td text-right"><button onClick={() => toggle(p.id)} className="text-xs text-chrome hover:text-amber">{p.isActive ? "Hide" : "Show"}</button></td>
                </tr>
              );
            })}
            {data.length === 0 && <tr><td className="td text-chrome" colSpan={6}>No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
