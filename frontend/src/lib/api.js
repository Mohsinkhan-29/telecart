const BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "telecart-admin-token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = "GET", body, admin = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (admin && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Can't reach the server. Is the backend running?");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && admin) {
    setToken(null);
    window.dispatchEvent(new Event("telecart-logout"));
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: "POST", body }),
};
export const adminApi = {
  get: (p) => request(`/admin${p}`, { admin: true }),
  post: (p, body = {}) => request(`/admin${p}`, { method: "POST", body, admin: true }),
  put: (p, body) => request(`/admin${p}`, { method: "PUT", body, admin: true }),
  patch: (p, body = {}) => request(`/admin${p}`, { method: "PATCH", body, admin: true }),
  del: (p) => request(`/admin${p}`, { method: "DELETE", admin: true }),
  // unauthenticated admin endpoints (login, forgot/reset password)
  open: (p, body) => request(`/admin${p}`, { method: "POST", body }),
};
