import "./SeasonSelector.css";

import { SEASONS } from "../data/seasons";
import type { SeasonId } from "../data/types";

interface SeasonSelectorProps {
  selectedSeason: SeasonId;
  onSeasonChange: (season: SeasonId) => void;
}

export function SeasonSelector({ selectedSeason, onSeasonChange }: SeasonSelectorProps) {
  return (
    <div className="season-selector">
      {SEASONS.map((season) => {
        const isActive = selectedSeason === season.id;

        return (
          <button
            key={season.id}
            type="button"
            className={`season-button${isActive ? " active" : ""}`}
            onClick={() => onSeasonChange(season.id)}
          >
            <span className="season-button-emoji">{season.emoji}</span>
            <span className="season-button-label">{season.label}</span>
          </button>
        );
      })}
    </div>
  );
}
