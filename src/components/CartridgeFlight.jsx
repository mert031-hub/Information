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
      // Kart haznenin ALT/ÖN tarafından gelir. Üst kenarı önce içeri kayar.
      const pitch = 48;
      const projectedHalfHeight =
        (height * scale * Math.cos((pitch * Math.PI) / 180)) / 2;
      const pose = (distance) => ({
        x: x + normal.x * distance - width / 2,
        y: y + normal.y * distance - height / 2,
        scale,
        rotate: -9,
        rotateX: pitch,
        rotateY: -4,
        opacity: 1,
      });
      setGeometry({
        width,
        height,
        perspectiveOrigin: `${x}px ${y}px`,
        home: {
          x: source.x - bounds.left + source.width / 2 - width / 2,
          y: source.y - bounds.top + source.height / 2 - height / 2,
          rotate: parseFloat(getComputedStyle(slot).getPropertyValue("--tilt")),
          scale: 1,
          rotateX: 0,
          rotateY: 0,
          opacity: 1,
        },
        dock: pose(projectedHalfHeight + 8),
        inside: pose(-projectedHalfHeight - 8),
        mask: `polygon(0 ${y + x * 0.158}px, 100% ${y - (bounds.width - x) * 0.158}px, 100% 100%, 0 100%)`,
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
    approaching: {
      ...dock,
      x: [home.x, dock.x + 6, dock.x],
      y: [home.y, dock.y + 22, dock.y],
      scale: [1, dock.scale * 1.06, dock.scale],
    },
    inserting: inside,
    ejecting: dock,
    returning: home,
  };
  const durations = {
    approaching: 0.84,
    inserting: 0.48,
    ejecting: 0.42,
    returning: 0.7,
  };
  const initial = {
    approaching: home,
    inserting: dock,
    ejecting: inside,
    returning: dock,
  }[phase];
  return (
    <div
      className="flight-mask"
      aria-hidden="true"
      style={{
        perspective: reducedMotion ? "none" : 900,
        perspectiveOrigin: geometry.perspectiveOrigin,
        clipPath:
          !reducedMotion && ["inserting", "ejecting"].includes(phase)
            ? mask
            : "none",
      }}
    >
      <motion.div
        key={reducedMotion ? phase : "flight"}
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
          ease: [0.4, 0, 0.2, 1],
          ...(phase === "approaching" ? { times: [0, 0.72, 1] } : {}),
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
