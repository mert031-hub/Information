export default function NewsCartridge({
  item,
  selected,
  position,
  onSelect,
  onHover,
  away,
  busy,
}) {
  return (
    <div
      className={`cartridge-slot ${away ? "is-away" : ""}`}
      data-slot={position}
      onPointerEnter={(event) => {
        if (!busy && !away && event.pointerType !== "touch") onHover();
      }}
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
        aria-disabled={busy || away}
        tabIndex={away ? -1 : 0}
        onClick={() => {
          if (!busy && !away) onSelect();
        }}
        onFocus={(event) => {
          if (!busy && !away && event.currentTarget.matches(":focus-visible"))
            onHover();
        }}
      >
        <CartridgeFace item={item} position={position} />
      </button>
    </div>
  );
}

// Aynı kart yüzü, sahnedeki düğmede ve uçuş katmanında kullanılır.
export function CartridgeFace({ item, position }) {
  return (
    <>
      <span className="cartridge-top">
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
      </span>
      <span className="cartridge-grip">
        <i />
        <i />
        <i />
      </span>
      <span className="cartridge-notch" />
    </>
  );
}
