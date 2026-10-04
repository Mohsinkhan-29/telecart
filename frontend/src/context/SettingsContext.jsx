import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { withDefaults } from "../lib/siteDefaults";

const SettingsCtx = createContext(withDefaults());

/** Loads Site content from the API once and fills in defaults for anything not edited. */
export function SettingsProvider({ children }) {
  const [state, setState] = useState({ settings: withDefaults(), ready: false });

  const load = () =>
    api.get("/settings").then(
      (saved) => setState({ settings: withDefaults(saved), ready: true }),
      () => setState((s) => ({ ...s, ready: true })) // API down: keep defaults
    );

  useEffect(() => {
    load();
    // The admin editor fires this after saving, so an open storefront tab can refresh.
    const onChange = () => load();
    window.addEventListener("telecart-settings", onChange);
    return () => window.removeEventListener("telecart-settings", onChange);
  }, []);

  return <SettingsCtx.Provider value={state}>{children}</SettingsCtx.Provider>;
}

export const useSettings = () => useContext(SettingsCtx).settings;
export const useSettingsReady = () => useContext(SettingsCtx).ready;
