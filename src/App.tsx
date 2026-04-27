import React from "react";

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title">🌾 Stardew Farm Planner</div>
        <div className="header-actions placeholder">Export · Import (später)</div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="placeholder">Season selector (placeholder)</div>
          <div style={{ height: "0.75em" }} />
          <div className="placeholder">Pflanzenliste (placeholder)</div>
        </aside>

        <main className="main-area">
          <section className="bed-panel">
            <div style={{ flex: 1 }} className="placeholder">
              Beet-Kalender (placeholder)
            </div>
            <div style={{ width: "16em", minWidth: "16em" }} className="placeholder">
              Beet-Info (placeholder)
            </div>
          </section>
          <section className="map-area">
            <div className="center" style={{ height: "100%" }}>
              <div className="placeholder">Karte: Klicke und ziehe, um ein Beet anzulegen 🌱</div>
            </div>
          </section>
        </main>

        <aside className="season-panel">
          <div className="placeholder">Saisonübersicht (placeholder)</div>
        </aside>
      </div>
    </div>
  );
}
