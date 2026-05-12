import "./DayNavigator.css";
import type { Bed, Plant, SeasonId } from "../data/types";
import { getDayTasks } from "../utils/calculations";
import type { DayTask } from "../utils/calculations";

interface DayNavigatorProps {
  currentDay: number;
  selectedSeason: SeasonId;
  onDayChange: (day: number) => void;
  beds: Bed[];
  plants: Plant[];
  bedsFromPrevSeason: Bed[];
  agriculturist?: boolean;
  onTaskHover?: (bedId: string | null) => void;
  onTaskClick?: (bedId: string) => void;
}

export default function DayNavigator({
  currentDay,
  selectedSeason,
  onDayChange,
  beds,
  plants,
  bedsFromPrevSeason,
  agriculturist = false,
  onTaskHover,
  onTaskClick,
}: DayNavigatorProps) {
  const tasks = getDayTasks(
    currentDay,
    beds,
    plants,
    selectedSeason,
    bedsFromPrevSeason,
    agriculturist,
  );
  const SEASON_LABELS: Record<SeasonId, string> = {
    spring: "Frühling",
    summer: "Sommer",
    fall: "Herbst",
    winter: "Winter",
  };
  const seasonLabel = SEASON_LABELS[selectedSeason] ?? selectedSeason;

  return (
    <aside
      className="day-navigator"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          onDayChange(Math.max(1, currentDay - 1));
        } else if (e.key === "ArrowRight") {
          onDayChange(Math.min(28, currentDay + 1));
        }
      }}
    >
      <div className="day-nav-top">
        <button
          type="button"
          className="day-nav-arrow"
          onClick={() => onDayChange(Math.max(1, currentDay - 1))}
          disabled={currentDay === 1}
        >
          ‹
        </button>

        <div className="day-nav-heading">
          {currentDay}. {seasonLabel}
        </div>

        <button
          type="button"
          className="day-nav-arrow"
          onClick={() => onDayChange(Math.min(28, currentDay + 1))}
          disabled={currentDay === 28}
        >
          ›
        </button>
      </div>

      <div className="day-nav-tasks">
        {tasks.length === 0 ? (
          <div className="day-nav-empty">Heute ist nichts zu tun. Genieße den Tag! 🌤️</div>
        ) : (
          tasks.map((t: DayTask) => {
            const textParts: string[] = [];
            if (t.harvest && t.sow && t.harvest.id === t.sow.id) {
              textParts.push(`${t.harvest.name} ernten und neu aussäen`);
            } else {
              if (t.harvest) textParts.push(`${t.harvest.name} ernten`);
              if (t.sow) textParts.push(`${t.sow.name} säen`);
            }

            return (
              <div
                key={t.bedId}
                className="day-nav-task-row"
                onMouseEnter={() => onTaskHover?.(t.bedId)}
                onMouseLeave={() => onTaskHover?.(null)}
                onClick={() => onTaskClick?.(t.bedId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onTaskClick?.(t.bedId);
                }}
              >
                <div className="day-nav-task-bed">{t.bedName}</div>
                <div className="day-nav-task-text">{textParts.join(" · ")}</div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
