import { Link } from "react-router-dom";

export default function GameHeader({ onRestart, onSave, saveConfirmed }) {
  return (
    <header className="game-header">
      <Link className="wordmark wordmark--small" to="/" aria-label="Stranded home">
        STRANDED<span className="wordmark__dot">.</span>
      </Link>
      <div className="header-actions">
        <span className="system-state">
          <i aria-hidden="true" /> System unstable
        </span>
        <div className="header-controls">
          <button className="text-button" type="button" onClick={onSave}>
            {saveConfirmed ? "Saved" : "Save"}
          </button>
          <button className="text-button" type="button" onClick={onRestart}>
            Restart
          </button>
        </div>
      </div>
    </header>
  );
}
