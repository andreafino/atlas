import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useTeamsHost } from "./auth/useTeamsHost";
import { DiagramRoute } from "./routes/DiagramRoute";
import { EditorHomePage } from "./routes/EditorHomePage";
import { ProjectDashboardPage } from "./routes/ProjectDashboardPage";
import { ProjectListPage } from "./routes/ProjectListPage";

function App() {
  const { ready, inTeams, theme } = useTeamsHost();

  // Il tema di Teams vale solo come punto di partenza: il toggle chiaro/scuro del Designer
  // continua a funzionare come override manuale dopo il primo render (stesso attributo, "ultimo
  // scrittore vince" — in pratica Teams lo imposta una volta sola all'avvio).
  useEffect(() => {
    if (inTeams) document.documentElement.dataset.theme = theme;
  }, [inTeams, theme]);

  if (!ready) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", background: "var(--paper)", color: "var(--muted)", fontFamily: "'Source Sans 3','Segoe UI',system-ui,sans-serif" }}>
        Caricamento…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {inTeams ? (
          <>
            <Route path="/" element={<ProjectListPage />} />
            <Route path="/progetti/:projectId" element={<ProjectDashboardPage />} />
            <Route path="/progetti/:projectId/diagrammi/:diagramId" element={<DiagramRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="*" element={<EditorHomePage />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
