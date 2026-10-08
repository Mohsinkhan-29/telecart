import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminApi } from "../lib/api";

function Shell({ title, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="spec-plate w-full max-w-sm"><h1 className="text-xl mb-5">{title}</h1>{children}</div>
    </div>
  );
}
function useSubmit(fn) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await fn(Object.fromEntries(new FormData(e.target))); } catch (err) { setMsg(err.message); }
    setBusy(false);
  };
  return { busy, msg, setMsg, submit };
}
const Field = ({ name, label, type = "text" }) => (
  <div><label className="label">{label}</label><input name={name} type={type} required className="input" /></div>
);

export function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const { busy, msg, submit } = useSubmit(async (f) => { await login(f.email, f.password); navigate("/admin/dashboard"); });
  if (token) return <Navigate to="/admin/dashboard" replace />;
  return (
    <Shell title="Admin login">
      <form onSubmit={submit} className="space-y-4">
        <Field name="email" label="Email" type="email" /><Field name="password" label="Password" type="password" />
        {msg && <p className="text-sm text-danger">{msg}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "…" : "Log in"}</button>
      </form>
      <Link to="/admin/forgot-password" className="block text-sm text-chrome hover:text-[#c5e813] mt-4">Forgot password?</Link>
    </Shell>
  );
}

export function ForgotPassword() {
  const { busy, msg, setMsg, submit } = useSubmit(async (f) => { setMsg((await adminApi.open("/forgot-password", { email: f.email })).message); });
  return (
    <Shell title="Reset password">
      <form onSubmit={submit} className="space-y-4">
        <Field name="email" label="Admin email" type="email" />
        {msg && <p className="text-sm text-[#c5e813]">{msg}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "…" : "Email me a reset link"}</button>
      </form>
      <Link to="/admin/login" className="block text-sm text-chrome hover:text-[#c5e813] mt-4">Back to login</Link>
    </Shell>
  );
}

export function ResetPassword() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { busy, msg, submit } = useSubmit(async (f) => {
    await adminApi.open("/reset-password", { token: sp.get("token") || "", password: f.password });
    navigate("/admin/login");
  });
  return (
    <Shell title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <Field name="password" label="New password (8+ characters)" type="password" />
        {msg && <p className="text-sm text-danger">{msg}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "…" : "Save password"}</button>
      </form>
    </Shell>
  );
}
