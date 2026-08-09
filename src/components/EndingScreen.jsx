import { useEffect } from "react";
import { endingCopy } from "../data/story";
import { sounds } from "../utils/sounds";

export default function EndingScreen({ ending, onRestart, onContinue }) {
  const copy = endingCopy[ending];

  useEffect(() => {
    sounds.playEnding(ending);
    return () => sounds.stopEnding();
  }, [ending]);

  return (
    <main className={`ending ending--${ending}`}>
      <div className="ending__noise" />
      <div className="ending__content">
        <p className="ending__kicker">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.text}</p>
        <div className="ending__actions">
          <button className="primary-button" type="button" onClick={onRestart}>
            {onContinue ? "Restart story" : "Start from beginning"}
          </button>
          {onContinue && (
            <button className="secondary-button" type="button" onClick={onContinue}>Continue exploring</button>
          )}
        </div>
      </div>
      <span className="ending__code">END / {ending.toUpperCase()}</span>
    </main>
  );
}
