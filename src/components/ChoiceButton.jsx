export default function ChoiceButton({ index, title, detail, variant = "default", roomId, ...props }) {
  return (
    <button className={`choice choice--${variant}`} type="button" {...props}>
      <span className="choice__index">{String(index).padStart(2, "0")}</span>
      <span className="choice__copy">
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </span>
      <span className="choice__arrow" aria-hidden="true">↗</span>
    </button>
  );
}
