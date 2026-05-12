import "./DayNavigator.css";
import type { Bed, Plant, SeasonId } from "../data/types";
import { getDayTasks } from "../utils/calculations";
import type { DayTask } from "../utils/calculations";
import { useI18n } from "../contexts/I18nContext";

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
  const { t, language } = useI18n();
  const SEASON_LABELS: Record<SeasonId, string> = {
    spring: t("season.spring"),
    summer: t("season.summer"),
    fall: t("season.fall"),
    winter: t("season.winter"),
  };
  const seasonLabel = SEASON_LABELS[selectedSeason] ?? selectedSeason;
  const dateLabel =
    language === "en" ? `${seasonLabel} ${currentDay}` : `${currentDay}. ${seasonLabel}`;

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

        <div className="day-nav-heading">{dateLabel}</div>

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
          <div className="day-nav-empty">{t("day.noTasks")}</div>
        ) : (
          tasks.map((t_val: DayTask) => {
            const textParts: string[] = [];
            const formatPattern = (patternKey: string, plantName: string) =>
              t(patternKey).replace("{plant}", plantName);

            if (t_val.harvest && t_val.sow && t_val.harvest.id === t_val.sow.id) {
              const plantLabel = t(`plant.name.${t_val.harvest.id}`);
              textParts.push(formatPattern("task.harvestAndResow", plantLabel));
            } else {
              if (t_val.harvest) {
                const plantLabel = t(`plant.name.${t_val.harvest.id}`);
                textParts.push(formatPattern("task.harvest", plantLabel));
              }
              if (t_val.sow) {
                const plantLabel = t(`plant.name.${t_val.sow.id}`);
                textParts.push(formatPattern("task.sow", plantLabel));
              }
            }

            return (
              <div
                key={t_val.bedId}
                className="day-nav-task-row"
                onMouseEnter={() => onTaskHover?.(t_val.bedId)}
                onMouseLeave={() => onTaskHover?.(null)}
                onClick={() => onTaskClick?.(t_val.bedId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onTaskClick?.(t_val.bedId);
                }}
              >
                <div className="day-nav-task-bed">{t_val.bedName}</div>
                <div className="day-nav-task-text">{textParts.join(" · ")}</div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
