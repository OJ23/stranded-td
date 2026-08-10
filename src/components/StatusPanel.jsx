import { getCorridor, sideRooms, STARTING_OXYGEN } from "../data/story";

export default function StatusPanel({ state }) {
  const oxygenMeterMax = Math.max(STARTING_OXYGEN, state.oxygen);
  const oxygenPercent = Math.min((state.oxygen / STARTING_OXYGEN) * 100, 100);
  const reserve = state.oxygen <= 30 ? "Critical" : state.oxygen <= 70 ? "Low" : "Stable";
  const currentRoom = getCorridor(state.currentRoom) ?? sideRooms[state.currentRoom];

  return (
    <aside className="status-panel" aria-label="Player status">
      <div className="panel-label">
        <span>Survival telemetry</span>
        <span>Live</span>
      </div>

      <section className="oxygen-block">
        <div className="oxygen-value">
          <strong>{state.oxygen}</strong>
          <span>O₂</span>
        </div>
        <div>
          <p className="metric-name">Oxygen reserve</p>
          <p className={`metric-state metric-state--${reserve.toLowerCase()}`}>{reserve}</p>
        </div>
      </section>
      <div className="meter" role="meter" aria-label="Oxygen" aria-valuenow={state.oxygen} aria-valuemin="0" aria-valuemax={oxygenMeterMax}>
        <span style={{ width: `${oxygenPercent}%` }} />
      </div>

      <div className="status-grid">
        <div>
          <span>Battery</span>
          <strong>{String(state.battery).padStart(2, "0")} <small>units</small></strong>
        </div>
        <div>
          <span>Deck</span>
          <strong>0{state.currentRoom.charAt(0)}</strong>
        </div>
      </div>

      <div className="current-location">
        <span>Current location</span>
        <strong>{currentRoom?.name ?? "Unknown sector"}</strong>
        <small>{currentRoom?.label ?? state.currentRoom.toUpperCase()}</small>
      </div>

      <div className="inventory">
        <p className="panel-label">Equipment</p>
        <div className="inventory-list">
          <span className={state.inventory.includes("scanner") ? "is-equipped" : ""}>
            <i>⌁</i> Scanner
          </span>
          <span className={state.inventory.includes("engineer-key") ? "is-equipped" : ""}>
            <i>⌗</i> Launch key
          </span>
        </div>
      </div>

      <div className="signal-log">
        <p className="panel-label">Latest signal</p>
        <p>{state.lastEvent}</p>
      </div>
    </aside>
  );
}
