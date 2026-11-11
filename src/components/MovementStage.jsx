import { useState } from "react";
import ThreeMovementScene from "./ThreeMovementScene";

export default function MovementStage({ room, exits = [], actions = [], onAction, direction, targetRoomId, moving, collected = false, pickupFeedback, relayPulse, deckPulse, onAnimationEnd, stageRef }) {
  const deck = room.deck ?? Number(room.id.charAt(0));
  const eyebrow = room.eyebrow ?? `Deck 0${deck} / Side module`;
  const leftExits = exits.filter((exit) => exit.direction === "left");
  const rightExits = exits.filter((exit) => exit.direction === "right");
  const [signPositions, setSignPositions] = useState({});

  return (
    <section
      ref={stageRef}
      className={`movement-stage movement-stage--${deck}`}
      aria-label={`Exploring ${room.name}`}
      data-direction={direction ?? "idle"}
      data-target-room={targetRoomId ?? "none"}
      data-moving={moving ? "true" : "false"}
    >
      <ThreeMovementScene room={room} exits={exits} direction={direction} moving={moving} deck={deck} targetRoomId={targetRoomId} collected={collected} onSignPositions={setSignPositions} />
      <div className="movement-stage__corridor" aria-hidden="true">
        <div className="movement-stage__vanishing-point" />
        <div
          className={`player-character ${moving ? `player-character--${direction}` : ""}`}
          onAnimationEnd={onAnimationEnd}
        >
          <span className="player-character__head" />
          <span className="player-character__body" />
        </div>
      </div>
      {exits.length > 0 && <div className="wall-door-labels">
        {[leftExits, rightExits].map((sideExits, sideIndex) => <div className={`junction-exit junction-exit--${sideIndex ? "right" : "left"}`} data-side={sideIndex ? "right" : "left"} key={sideIndex}>
        {sideExits.map((exit, index) => <button
          className={`wall-door-label wall-door-label--${index + sideIndex * 2} junction-door ${exit.scanned ? "wall-door-label--scanned" : ""} ${targetRoomId === exit.id ? "wall-door-label--target junction-door--target" : ""}`}
          data-room-id={exit.id}
          style={signPositions[exit.id]}
          key={exit.id}
          disabled={moving}
          onClick={() => onAction?.(actions.find((action) => action.roomId === exit.id && action.title.startsWith("Enter ")))}
        >{exit.label}</button>)}
        </div>)}
      </div>}
      {room.type && <div className="movement-stage__actions" aria-label="Actions in this room">
        {actions.filter((action) => !action.title.startsWith("Return ")).map((action) => <button key={action.title} disabled={moving || action.disabled} onClick={() => onAction?.(action)}>{action.title}</button>)}
      </div>}
      {pickupFeedback && <div className={`movement-stage__pickup movement-stage__pickup--${pickupFeedback.type}`} key={pickupFeedback.key} role="status" aria-live="polite">
        <span className="movement-stage__pickup-icon" aria-hidden="true">{pickupFeedback.type === "oxygen" ? "O₂" : pickupFeedback.type === "battery" ? "+" : "⌁"}</span>
        <span className="movement-stage__pickup-copy"><strong>{pickupFeedback.type === "scanner" ? "Scanner equipped" : pickupFeedback.type === "battery" ? "Power cell acquired" : "Oxygen refilled"}</strong><small>{pickupFeedback.type === "scanner" ? "Launch key secured · scans unlocked" : pickupFeedback.type === "battery" ? "+10 battery units" : "+100 O₂"}</small></span>
      </div>}
      {relayPulse && <div className="movement-stage__relay-pulse" key={relayPulse} aria-hidden="true"><i /><i /><i /><span /></div>}
      {deckPulse && <div className={`movement-stage__deck-pulse movement-stage__deck-pulse--${deckPulse.direction}`} key={deckPulse.key} role="status" aria-live="polite"><span>Deck {String(deckPulse.deck).padStart(2, "0")}</span><strong>{deckPulse.direction === "ascending" ? "Ascending" : "Descending"}</strong><i /></div>}
      <div className="movement-stage__location">
        <span>{eyebrow}</span>
        <strong>{room.name}</strong>
      </div>
      <span className="movement-stage__status" role="status" aria-live="polite">
        {moving ? `Moving ${direction}` : "Standing by"}
      </span>
      {(room.id === "1e" || room.id === "2c") && <div className="movement-stage__next-deck" aria-label={`Advancing enters Deck 0${deck + 1}`}><span>Next deck</span><strong>0{deck + 1} ↑</strong></div>}
    </section>
  );
}
