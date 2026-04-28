import { useEffect, useRef, useState } from "react";
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
        {mode === "create" && <h3 className="bd-title">Neues Beet erstellen</h3>}
        {mode === "rename" && <h3 className="bd-title">Beet umbenennen</h3>}
        {mode === "delete" && <h3 className="bd-title">Beet löschen</h3>}
        {mode === "action" && <h3 className="bd-title">Aktion wählen</h3>}
        {mode === "collision" && <h3 className="bd-title">⚠️ Überlappung nicht erlaubt</h3>}

        {(mode === "create" || mode === "rename") && (
          <div className="bd-body">
            <label className="bd-label">Name</label>
            <input
              ref={inputRef}
              className="bd-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Beetname"
              aria-label="Beetname"
            />
          </div>
        )}

        {mode === "delete" && (
          <div className="bd-body">
            <p>
              Soll dieses Beet wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht
              werden.
            </p>
          </div>
        )}

        {mode === "action" && (
          <div className="bd-body">
            <p>Wähle eine Aktion für dieses Beet.</p>
          </div>
        )}

        {mode === "collision" && (
          <div className="bd-body">
            <p>
              Dieses Beet überlappt mit einem anderen Beet. Bitte versuche es an einer anderen
              Stelle.
            </p>
          </div>
        )}

        <div className="bd-actions">
          {mode !== "collision" && (
            <button className="bd-btn bd-cancel" onClick={onCancel}>
              Abbrechen
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
                Umbenennen
              </button>
              <button
                className="bd-btn bd-delete"
                onClick={() => {
                  onDeleteRequest?.();
                }}
              >
                Löschen
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
              {mode === "create" ? "Anlegen" : "Speichern"}
            </button>
          )}

          {mode === "delete" && (
            <button
              className="bd-btn bd-delete"
              onClick={() => {
                onDelete?.();
              }}
            >
              Löschen
            </button>
          )}

          {mode === "collision" && (
            <button className="bd-btn bd-primary" onClick={onCancel}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
