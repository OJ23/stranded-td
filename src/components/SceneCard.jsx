export default function SceneCard({ room, children }) {
  return (
    <article className="scene-card">
      <div className="scene-card__topline">
        <span>{room.eyebrow ?? "Side module / Interior"}</span>
        <span className="room-code">{room.id.toUpperCase()}</span>
      </div>
      <div className="scene-copy">
        <p className="chapter">{room.deck ? `Chapter ${room.deck}` : "Detour"}</p>
        <h1>{room.name}</h1>
        <p className="scene-text">{room.text}</p>
        {room.objective && (
          <div className="objective">
            <span>Current directive</span>
            <p>{room.objective}</p>
          </div>
        )}
      </div>
      {children}
    </article>
  );
}
