export default function NewsCartridge({ item, selected, position, onSelect }) {
  return (
    <button
      className={`cartridge ${selected ? "is-selected" : ""}`}
      style={{
        "--card-color": item.color,
        "--position": position,
        "--angle": `${position * 8}deg`,
      }}
      aria-pressed={selected}
      aria-label={`${item.category}: ${item.title}`}
      onClick={onSelect}
    >
      <span className="cartridge-top">
        <span>OOO NEWS SYSTEM</span>
        <span>01</span>
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
  );
}
