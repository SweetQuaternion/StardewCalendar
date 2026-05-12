import "./SeasonSelector.css";

import { SEASONS } from "../data/seasons";
import type { SeasonId } from "../data/types";
import { useI18n } from "../contexts/I18nContext";

interface SeasonSelectorProps {
  selectedSeason: SeasonId;
  onSeasonChange: (season: SeasonId) => void;
}

export function SeasonSelector({ selectedSeason, onSeasonChange }: SeasonSelectorProps) {
  const { t } = useI18n();

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
            <span className="season-button-label">{t(`season.${season.id}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
