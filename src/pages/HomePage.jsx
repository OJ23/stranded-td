import { useMemo } from "react";
import { Link } from "react-router-dom";
import homeBackground from "../../images/8.jpeg";
import { loadGame } from "../utils/gameState";

export default function HomePage() {
  const hasSave = useMemo(() => Boolean(loadGame()), []);

  return (
    <main
      className="home"
      style={{ "--home-background-image": `url(${homeBackground})` }}
    >
      <div className="starfield" aria-hidden="true" />
      <header className="home-nav">
        <span className="wordmark wordmark--small">STRANDED<span className="wordmark__dot">.</span></span>
        <span className="mission-code">Mission SE-117 / Signal lost</span>
      </header>

      <section className="hero">
        <div className="hero__signal" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">A choice-driven survival story</p>
        <h1 className="wordmark">STRANDED<span className="wordmark__dot">.</span></h1>
        <p className="hero__intro">
          You wake alone aboard a  dying spacecraft to alarms, empty corridors, and a ship drifting through deep space. The ship says someone else survived.
          Your oxygen says you do not have long.
          <p>What do you do?</p>
        </p>
        
        <div className="hero__actions">
          <Link className="primary-button" to="/game" state={{ newGame: !hasSave }}>
            {hasSave ? "Continue transmission" : "Begin transmission"}
            <span aria-hidden="true">↗</span>
          </Link>
          {hasSave && (
            <Link className="secondary-button" to="/game" state={{ newGame: true }}>
              New story
            </Link>
          )}
        </div>
      </section>

      <footer className="home-footer">
        <span>O₂ supply: critical</span>
        <span>Synthesized audio: optional</span>
        <span>Use 1–9 to choose</span>
      </footer>
    </main>
  );
}
