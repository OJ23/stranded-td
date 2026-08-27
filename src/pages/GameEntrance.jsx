import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GameEntrance.css";

const messages = [
  "SIGNAL DETECTED",
  "NEURAL RESPONSE: ACTIVE",
  "LIFE SUPPORT LINK ESTABLISHED",
  "CREW ID: UNKNOWN",
  "INITIALIZING...",
];

export default function GameEntrance() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [currentMessage, setCurrentMessage] = useState(0);
  const newGame = Boolean(state?.newGame);

  useEffect(() => {
    if (currentMessage < messages.length - 1) {
      const timer = window.setTimeout(() => {
        setCurrentMessage((previous) => previous + 1);
      }, 700);

      return () => window.clearTimeout(timer);
    }

    const enterGame = window.setTimeout(() => {
      navigate("/game", { replace: true, state: { newGame } });
    }, 1200);

    return () => window.clearTimeout(enterGame);
  }, [currentMessage, navigate, newGame]);

  return (
    <main className="entrance-screen">
      <div className="entrance-screen__grid" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />
      <p className="system-text" key={currentMessage} role="status" aria-live="polite">
        {messages[currentMessage]}
      </p>
      <span className="entrance-screen__code" aria-hidden="true">
        SE-117 // LINK {String(currentMessage + 1).padStart(2, "0")}
      </span>
    </main>
  );
}
