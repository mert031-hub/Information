import { motion, useReducedMotion } from "motion/react";
import { getBmoReaction } from "../data/reactions.js";
import { bmoScreen } from "../data/bmoScreen.js";

// Aynı mutlu yüz hem küçük BMO ekranında hem yakınlaşan ekranın içinde görünür.
export function HappyBmoFace({ category }) {
  const reaction = getBmoReaction(category);
  return (
    <g className="happy-bmo-face">
      <rect width="446" height="355" rx="10" fill="#cef3d6" />
      <g fill="none" stroke="#173f34" strokeWidth="10" strokeLinecap="round">
        <path d="M110 125 Q130 88 150 125 M296 125 Q316 88 336 125" />
        <path d="M180 155 Q223 220 266 155" />
      </g>
      <g fill="#537e56">
        <path d="M63 62 L68 78 L84 83 L68 88 L63 104 L58 88 L42 83 L58 78 Z" />
        <path d="M376 164 L381 176 L393 181 L381 186 L376 198 L371 186 L359 181 L371 176 Z" />
      </g>
      <text
        x="223"
        y="280"
        textAnchor="middle"
        fill="#173f34"
        fontSize="58"
        fontFamily="var(--pixel)"
      >
        {reaction.text}
      </text>
    </g>
  );
}

export default function BmoReaction({ phase, category, onComplete }) {
  const reducedMotion = useReducedMotion();
  if (!["celebrating", "zooming", "reading", "zoomingOut"].includes(phase))
    return null;
  const face = <HappyBmoFace category={category} />;
  return (
    <svg
      className="bmo-screen-reaction"
      viewBox="0 0 1149 1369"
      aria-hidden="true"
    >
      <g
        transform={`translate(${bmoScreen.x} ${bmoScreen.y}) skewY(${bmoScreen.skew})`}
      >
        {phase === "celebrating" ? (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1] }}
            transition={{
              duration: reducedMotion ? 0.12 : 0.95,
              times: [0, 0.12, 1],
            }}
            onAnimationComplete={() => onComplete("celebrating")}
          >
            {face}
          </motion.g>
        ) : (
          face
        )}
      </g>
    </svg>
  );
}
