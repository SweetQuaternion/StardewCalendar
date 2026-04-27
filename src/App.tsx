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
          <div className="spacer-sm" />
          <div className="placeholder">Pflanzenliste (placeholder)</div>
        </aside>

        <main className="main-area">
          <section className="bed-panel">
            <div className="placeholder bed-calendar-placeholder">Beet-Kalender (placeholder)</div>
            <div className="placeholder bed-info-placeholder">Beet-Info (placeholder)</div>
          </section>
          <section className="map-area">
            <div className="center full-height">
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
