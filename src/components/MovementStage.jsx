export default function MovementStage({ room, exits = [], direction, targetRoomId, moving, onAnimationEnd, stageRef }) {
  const deck = room.deck ?? Number(room.id.charAt(0));
  const eyebrow = room.eyebrow ?? `Deck 0${deck} / Side module`;
  const leftExits = exits.filter((exit) => exit.direction === "left");
  const rightExits = exits.filter((exit) => exit.direction === "right");

  const renderExits = (side, rooms) => (
    <div className={`junction-exit junction-exit--${side}`} data-side={side}>
      {rooms.map((exit) => (
        <div
          className={`junction-door ${targetRoomId === exit.id ? "junction-door--target" : ""}`}
          data-room-id={exit.id}
          key={exit.id}
        >
          <span className="junction-door__beam" />
          <span className="junction-door__frame">
            <small>{side === "left" ? "Port" : "Starboard"}</small>
            <strong>{exit.id.slice(-1).toUpperCase()}</strong>
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <section
      ref={stageRef}
      className={`movement-stage movement-stage--${deck}`}
      aria-label={`Exploring ${room.name}`}
      data-direction={direction ?? "idle"}
      data-target-room={targetRoomId ?? "none"}
      data-moving={moving ? "true" : "false"}
    >
      <div className="movement-stage__corridor" aria-hidden="true">
        <div className="movement-stage__vanishing-point" />
        {exits.length > 0 && (
          <div className="junction-exits">
            {renderExits("left", leftExits)}
            {renderExits("right", rightExits)}
          </div>
        )}
        <div
          className={`player-character ${moving ? `player-character--${direction}` : ""}`}
          onAnimationEnd={onAnimationEnd}
        >
          <span className="player-character__head" />
          <span className="player-character__body" />
        </div>
      </div>
      <div className="movement-stage__location">
        <span>{eyebrow}</span>
        <strong>{room.name}</strong>
      </div>
      <span className="movement-stage__status" role="status" aria-live="polite">
        {moving ? `Moving ${direction}` : "Standing by"}
      </span>
    </section>
  );
}
