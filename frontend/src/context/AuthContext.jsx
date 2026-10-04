import { createContext, useContext, useEffect, useState } from "react";
import { adminApi, getToken, setToken } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTok] = useState(getToken());
  useEffect(() => {
    const onLogout = () => setTok(null);
    window.addEventListener("telecart-logout", onLogout);
    return () => window.removeEventListener("telecart-logout", onLogout);
  }, []);

  const login = async (email, password) => {
    const d = await adminApi.open("/login", { email, password });
    setToken(d.token); setTok(d.token);
  };
  const logout = () => { setToken(null); setTok(null); };
  return <AuthCtx.Provider value={{ token, login, logout }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
