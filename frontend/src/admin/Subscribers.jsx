import { adminApi } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { fmtDate } from "../lib/format";
import { ErrorBox, Loading } from "../components/Status";

export default function Subscribers() {
  const { data, error, loading, reload } = useFetch(() => adminApi.get("/subscribers"));
  const del = async (id) => { if (!confirm("Remove this email?")) return; try { await adminApi.del(`/subscribers/${id}`); reload(); } catch (e) { alert(e.message); } };
  const download = () => {
    const csv = "email,signed_up\n" + data.map((s) => `${s.email},${new Date(s.createdAt).toISOString().slice(0, 10)}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl">Newsletter</h1><p className="text-sm text-chrome mt-1">{data.length} email{data.length === 1 ? "" : "s"} from the footer sign-up box.</p></div>
        {data.length > 0 && <button className="btn btn-outline" onClick={download}>Download CSV</button>}
      </div>
      <ul className="divide-y divide-steel-line border border-steel-line rounded">
        {data.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span>{s.email} <span className="text-chrome font-mono text-xs">· {fmtDate(s.createdAt)}</span></span>
            <button onClick={() => del(s.id)} className="text-xs text-chrome hover:text-danger">Remove</button>
          </li>
        ))}
        {data.length === 0 && <li className="px-4 py-3 text-sm text-chrome">No sign-ups yet.</li>}
      </ul>
    </div>
  );
}
