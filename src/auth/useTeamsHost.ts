import { app } from "@microsoft/teams-js";
import { useEffect, useState } from "react";
import { initializeTeams, teamsThemeToAppTheme } from "./teamsAuth";

export interface TeamsHostState {
  ready: boolean; // true quando sappiamo se siamo dentro Teams o no (non più nello stato iniziale)
  inTeams: boolean;
  theme: "light" | "dark";
}

// Inizializza l'SDK Teams una volta sola all'avvio dell'app, sincronizza il tema con quello di Teams
// (anche se l'utente lo cambia dalle impostazioni di Teams mentre l'app è aperta) e segnala a Teams
// che il caricamento è completo (altrimenti Teams mostra a lungo il proprio spinner di avvio).
// Fuori da Teams (browser standalone) resta semplicemente inTeams:false, tema di default "light":
// il toggle manuale chiaro/scuro del Designer continua a funzionare come prima.
export function useTeamsHost(): TeamsHostState {
  const [state, setState] = useState<TeamsHostState>({ ready: false, inTeams: false, theme: "light" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const inTeams = await initializeTeams();
      if (cancelled) return;
      if (!inTeams) {
        setState({ ready: true, inTeams: false, theme: "light" });
        return;
      }
      const ctx = await app.getContext();
      if (cancelled) return;
      setState({ ready: true, inTeams: true, theme: teamsThemeToAppTheme(ctx.app.theme) });
      app.registerOnThemeChangeHandler((teamsTheme) => {
        setState((s) => ({ ...s, theme: teamsThemeToAppTheme(teamsTheme) }));
      });
      app.notifySuccess();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
