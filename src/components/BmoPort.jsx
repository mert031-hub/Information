export default function BmoPort({ phase, color }) {
  const active = phase !== "idle";
  return (
    <svg
      className={`bmo-port ${active ? "is-active" : ""}`}
      viewBox="0 0 1149 1369"
      aria-hidden="true"
      style={{ "--port-color": color }}
    >
      <path className="port-glow" d="M445 726 L723 681" />
      {/* Sabit ön kenar, kayan kartın hazne arkasında kaldığı hissini güçlendirir. */}
      <path className="port-lip" d="M444 748 L724 703" />
      {phase === "loading" && (
        <g className="bmo-loading">
          <path d="M490 555 L810 505 L810 565 L490 615 Z" fill="#143a30" />
          <text
            x="650"
            y="568"
            transform="rotate(-8 650 568)"
            textAnchor="middle"
          >
            BİP BOP...
          </text>
        </g>
      )}
    </svg>
  );
}
