import { getBmoReaction } from "../data/reactions.js";
import { bmoScreen } from "../data/bmoScreen.js";

export function HappyBmoFace({ category, phase }) {
  const reaction = getBmoReaction(category);
  const expression = phase === "approaching" ? "smile" : reaction.style;
  const eyePath = expression === "yay"
    ? "M107 136 L130 111 L153 136 M293 136 L316 111 L339 136"
    : "M109 131 Q130 95 151 131 M295 131 Q316 95 337 131";
  return (
    <g className="happy-bmo-face" data-expression={expression}>
      <rect width="446" height="355" rx="10" fill="#d2f9dd" />
      <g fill="none" stroke="#173f34" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
        <path d={eyePath} />
      </g>
      <g className="bmo-cheeks" fill="#efb8a7" opacity="0.48">
        <ellipse cx="112" cy="165" rx="22" ry="10" />
        <ellipse cx="334" cy="165" rx="22" ry="10" />
      </g>
      <g className="bmo-happy-mouth" key={expression}>
        {expression === "smile" ? (
          <path d="M170 178 Q223 242 276 178" fill="none" stroke="#173f34" strokeWidth="10" strokeLinecap="round" />
        ) : expression === "woohoo" ? (
          <>
            <path d="M184 180 Q223 198 262 180 C258 271 188 271 184 180 Z" fill="#173f34" />
            <path d="M203 237 Q223 219 243 237 Q223 258 203 237" fill="#e6aaa2" />
          </>
        ) : (
          <>
            <path d="M164 175 Q223 196 282 175 Q269 254 223 253 Q177 253 164 175 Z" fill="#173f34" />
            <path d="M195 237 Q223 217 251 237 Q223 258 195 237" fill="#e6aaa2" />
          </>
        )}
      </g>
      {expression === "yay" && (
        <g fill="#5b9c64">
          <path d="M65 85 L71 102 L88 108 L71 114 L65 131 L59 114 L42 108 L59 102 Z" />
          <path d="M378 67 L383 80 L396 85 L383 90 L378 103 L373 90 L360 85 L373 80 Z" />
        </g>
      )}
    </g>
  );
}

export default function BmoReaction({ phase, category }) {
  if (!["approaching", "inserting", "zooming", "reading", "zoomingOut"].includes(phase)) return null;
  return (
    <svg className="bmo-screen-reaction" viewBox="0 0 1149 1369" aria-hidden="true" data-reaction={getBmoReaction(category).style}>
      <g transform={`translate(${bmoScreen.x} ${bmoScreen.y}) skewY(${bmoScreen.skew})`}>
        <HappyBmoFace category={category} phase={phase} />
      </g>
    </svg>
  );
}
