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
    </svg>
  );
}
