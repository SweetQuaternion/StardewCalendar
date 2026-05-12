import { useEffect, useRef, useState } from "react";
import { useI18n } from "../contexts/I18nContext";
import "./BedDialog.css";

type Mode = "create" | "rename" | "delete" | "action" | "collision";

interface Props {
  open: boolean;
  mode: Mode;
  initialName?: string;
  onCancel: () => void;
  onSave?: (name: string) => void;
  onDelete?: () => void;
  onRenameRequest?: () => void;
  onDeleteRequest?: () => void;
}

export default function BedDialog({
  open,
  mode,
  initialName = "",
  onCancel,
  onSave,
  onDelete,
  onRenameRequest,
  onDeleteRequest,
}: Props) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(initialName || "");
  }, [initialName, open]);

  useEffect(() => {
    if (open && (mode === "create" || mode === "rename")) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Enter") return;

      if (mode === "create" || mode === "rename") {
        event.preventDefault();
        if (!name.trim()) return;
        onSave?.(name.trim());
        return;
      }

      if (mode === "delete") {
        event.preventDefault();
        onDelete?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [name, mode, onCancel, onDelete, onSave, open]);

  if (!open) return null;

  return (
    <div className="bd-overlay" onMouseDown={onCancel}>
      <div className="bd-dialog" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal>
        {mode === "create" && <h3 className="bd-title">{t("dialog.createBed")}</h3>}
        {mode === "rename" && <h3 className="bd-title">{t("dialog.renameBed")}</h3>}
        {mode === "delete" && <h3 className="bd-title">{t("dialog.deleteBed")}</h3>}
        {mode === "action" && <h3 className="bd-title">{t("dialog.chooseAction")}</h3>}
        {mode === "collision" && <h3 className="bd-title">{t("dialog.overlapError")}</h3>}

        {(mode === "create" || mode === "rename") && (
          <div className="bd-body">
            <label className="bd-label">{t("dialog.bedName")}</label>
            <input
              ref={inputRef}
              className="bd-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("dialog.bedNamePlaceholder")}
              aria-label={t("dialog.bedNamePlaceholder")}
            />
          </div>
        )}

        {mode === "delete" && (
          <div className="bd-body">
            <p>{t("dialog.deleteConfirm")}</p>
          </div>
        )}

        {mode === "action" && (
          <div className="bd-body">
            <p>{t("dialog.chooseActionText")}</p>
          </div>
        )}

        {mode === "collision" && (
          <div className="bd-body">
            <p>{t("dialog.overlapText")}</p>
          </div>
        )}

        <div className="bd-actions">
          {mode !== "collision" && (
            <button className="bd-btn bd-cancel" onClick={onCancel}>
              {t("dialog.cancel")}
            </button>
          )}

          {mode === "action" && (
            <>
              <button
                className="bd-btn bd-primary"
                onClick={() => {
                  onRenameRequest?.();
                }}
              >
                {t("dialog.rename")}
              </button>
              <button
                className="bd-btn bd-delete"
                onClick={() => {
                  onDeleteRequest?.();
                }}
              >
                {t("dialog.delete")}
              </button>
            </>
          )}

          {(mode === "create" || mode === "rename") && (
            <button
              className="bd-btn bd-primary"
              onClick={() => {
                if (!name.trim()) return;
                onSave?.(name.trim());
              }}
            >
              {mode === "create" ? t("dialog.create") : t("dialog.save")}
            </button>
          )}

          {mode === "delete" && (
            <button
              className="bd-btn bd-delete"
              onClick={() => {
                onDelete?.();
              }}
            >
              {t("dialog.delete")}
            </button>
          )}

          {mode === "collision" && (
            <button className="bd-btn bd-primary" onClick={onCancel}>
              {t("dialog.ok")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
