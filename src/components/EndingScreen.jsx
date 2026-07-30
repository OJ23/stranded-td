import { endingCopy } from "../data/story";

export default function EndingScreen({ ending, onRestart, onContinue }) {
  const copy = endingCopy[ending];
  return (
    <main className={`ending ending--${ending}`}>
      <div className="ending__noise" />
      <div className="ending__content">
        <p className="ending__kicker">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.text}</p>
        <div className="ending__actions">
          <button className="primary-button" type="button" onClick={onRestart}>Restart story</button>
          <button className="secondary-button" type="button" onClick={onContinue}>Continue exploring</button>
        </div>
      </div>
      <span className="ending__code">END / {ending.toUpperCase()}</span>
    </main>
  );
}
