import { useLayoutEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CartridgeFace } from "./NewsCartridge.jsx";

export default function CartridgeFlight({
  item,
  index,
  phase,
  fieldRef,
  onComplete,
}) {
  const [geometry, setGeometry] = useState(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    function measure() {
      const field = fieldRef.current;
      const slot = field.querySelector(`[data-slot="${index}"]`);
      const card = slot.querySelector(".cartridge");
      const port = field.querySelector(".bmo-port");
      const bounds = field.getBoundingClientRect();
      const source = card.getBoundingClientRect();
      // SVG koordinatını ekrana çevir: object-fit boşlukları ve mobil ölçek dahil.
      const matrix = port.getScreenCTM();
      const target = new DOMPoint(584, 714).matrixTransform(matrix);
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      const scale = (282 * Math.hypot(matrix.a, matrix.b) * 0.8) / width;
      const normal = {
        x: Math.sin((9 * Math.PI) / 180),
        y: Math.cos((9 * Math.PI) / 180),
      };
      const x = target.x - bounds.left;
      const y = target.y - bounds.top;
      const pose = (distance) => ({
        x: x + normal.x * distance - width / 2,
        y: y + normal.y * distance - height / 2,
        scale,
        rotate: -9,
        opacity: 1,
      });
      setGeometry({
        width,
        height,
        home: {
          x: source.x - bounds.left + source.width / 2 - width / 2,
          y: source.y - bounds.top + source.height / 2 - height / 2,
          rotate: parseFloat(getComputedStyle(slot).getPropertyValue("--tilt")),
          scale: 1,
          opacity: 1,
        },
        dock: pose((-height * scale) / 2 - 5),
        inside: pose((height * scale) / 2 + 5),
        mask: `polygon(0 0, 100% 0, 100% ${y - (bounds.width - x) * 0.158}px, 0 ${y + x * 0.158}px)`,
      });
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(fieldRef.current);
    observer.observe(fieldRef.current.querySelector(".bmo-area"));
    return () => observer.disconnect();
  }, [index, fieldRef]);

  if (!geometry) return null;
  const { home, dock, inside, mask } = geometry;
  const poses = {
    approaching: dock,
    inserting: inside,
    loading: { ...inside, opacity: 0 },
    ejecting: dock,
    returning: home,
  };
  const durations = {
    approaching: 0.62,
    inserting: 0.3,
    loading: 0.32,
    ejecting: 0.3,
    returning: 0.58,
  };
  const initial = {
    approaching: home,
    inserting: dock,
    loading: inside,
    ejecting: inside,
    returning: dock,
  }[phase];
  return (
    <div
      className="flight-mask"
      aria-hidden="true"
      style={{
        clipPath:
          !reducedMotion && ["inserting", "ejecting", "loading"].includes(phase)
            ? mask
            : "none",
      }}
    >
      <motion.div
        key={phase}
        className="flying-cartridge"
        style={{
          width: geometry.width,
          height: geometry.height,
          "--card-color": item.color,
        }}
        initial={reducedMotion ? { ...home, opacity: 0 } : initial}
        animate={reducedMotion ? { ...home, opacity: [0, 0] } : poses[phase]}
        transition={{
          duration: reducedMotion ? 0.04 : durations[phase],
          ease: [0.22, 0.7, 0.25, 1],
        }}
        onAnimationComplete={() => onComplete(phase)}
      >
        <div className="cartridge cartridge-visual">
          <CartridgeFace item={item} position={index} />
        </div>
      </motion.div>
    </div>
  );
}
