export default function NewsCartridge({ item, selected, position, onSelect }) {
  return (
    <div
      className="cartridge-slot"
      data-slot={position}
      style={{
        "--card-color": item.color,
        "--float-duration": `${4.8 + position * 0.35}s`,
        "--float-delay": `${position * -0.85}s`,
      }}
    >
      <button
        className={`cartridge ${selected ? "is-selected" : ""}`}
        aria-pressed={selected}
        aria-label={`${item.category}: ${item.title}`}
        onClick={onSelect}
      >
        <span className="cartridge-top">
          <span>OOO NEWS SYSTEM</span>
          <span>{String(position + 1).padStart(2, "0")}</span>
        </span>
        <span className="cartridge-label">
          <span className="cartridge-art">
            <img
              src={item.image}
              alt=""
              style={{ objectPosition: item.imagePosition }}
            />
          </span>
          <span className="cartridge-category">{item.label}</span>
          <span className="cartridge-caption">{item.subtitle}</span>
          <span className="cartridge-label-bottom">
            <span>BMO™</span>
            <span>NEWS CARTRIDGE</span>
          </span>
        </span>
        <span className="cartridge-grip">
          <i />
          <i />
          <i />
        </span>
        <span className="cartridge-notch" />
      </button>
    </div>
  );
}
