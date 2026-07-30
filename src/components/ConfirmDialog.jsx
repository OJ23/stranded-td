import { useEffect, useRef } from "react";

export default function ConfirmDialog({ open, onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="restart-title" onMouseDown={(event) => event.stopPropagation()}>
        <p className="panel-label">Confirm reset</p>
        <h2 id="restart-title">Abandon this run?</h2>
        <p>Your saved progress will be permanently cleared.</p>
        <div>
          <button ref={cancelRef} className="secondary-button" type="button" onClick={onCancel}>Keep playing</button>
          <button className="danger-button" type="button" onClick={onConfirm}>Restart</button>
        </div>
      </div>
    </div>
  );
}
