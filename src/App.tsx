import { useState } from "react";

import { PlantList } from "./components/PlantList.tsx";
import { SeasonSelector } from "./components/SeasonSelector.tsx";
import type { SeasonId } from "./data/types.ts";

export default function App() {
  const [selectedSeason, setSelectedSeason] = useState<SeasonId>("spring");

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title">🌾 Stardew Farm Planner</div>
        <div className="header-actions placeholder">Export · Import (später)</div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <SeasonSelector selectedSeason={selectedSeason} onSeasonChange={setSelectedSeason} />
          <PlantList selectedSeason={selectedSeason} />
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
