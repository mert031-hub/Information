import { useEffect, useId } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { getBmoReaction } from "../data/reactions.js";
import { bmoScreen } from "../data/bmoScreen.js";
import { faceExpressions } from "../data/faceExpressions.js";

export function HappyBmoFace({ category, phase, progress }) {
  const reducedMotion = useReducedMotion();
  const mood = useMotionValue(0);
  const reaction = getBmoReaction(category);
  const expression = ["approaching", "zoomingOut"].includes(phase)
    ? "smile"
    : ["ejecting", "returning"].includes(phase) ? "neutral" : reaction.style;
  const target = expression === "neutral" ? 0 : expression === "smile" ? 1 : 2;
  const clipId = useId();

  useEffect(() => {
    const controls = animate(mood, target, {
      duration: reducedMotion ? 0 : target === 2 ? 0.38 : 0.32,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [mood, target, reducedMotion]);

  const shapes = [faceExpressions.neutral, faceExpressions.smile, faceExpressions[reaction.style]];
  const eye = useTransform(mood, [0, 1, 2], shapes.map(shape => shape.eye));
  const mouth = useTransform(mood, [0, 1, 2], shapes.map(shape => shape.mouth));
  const cheeks = useTransform(mood, [0, 1, 2], [0, 0.12, 0.24]);
  const tongue = useTransform(mood, [0, 1, 2], [0, 0, 0.85]);
  const sparkles = useTransform(mood, [0, 1, 2], [0, 0, reaction.style === "yay" ? 0.75 : 0]);
  const faceOpacity = useTransform(progress, [0, 0.3, 0.64, 1], [1, 1, 0, 0]);

  return (
    <g className="happy-bmo-face" data-expression={expression}>
      <rect width="446" height="355" rx="10" fill="#d2f9dd" />
      <motion.g className="bmo-face-features" style={{ opacity: faceOpacity }}>
        <g fill="#173f34">
          <g transform="translate(123 118)">
            <motion.path className="bmo-happy-eye" d={eye} />
          </g>
          <g transform="translate(324 118)">
            <motion.path className="bmo-happy-eye" d={eye} />
          </g>
        </g>
        <motion.g className="bmo-cheeks" fill="#e4b5a0" style={{ opacity: cheeks }}>
          <ellipse cx="112" cy="160" rx="20" ry="8" />
          <ellipse cx="334" cy="160" rx="20" ry="8" />
        </motion.g>
        <defs>
          <clipPath id={clipId}>
            <motion.path d={mouth} />
          </clipPath>
        </defs>
        <motion.path className="bmo-happy-mouth" d={mouth} fill="#173f34" />
        <g clipPath={`url(#${clipId})`}>
          <motion.path
            className="bmo-tongue"
            d="M192 240 Q223 216 254 240 L254 270 L192 270 Z"
            fill="#dfa8a0"
            style={{ opacity: tongue }}
          />
        </g>
        <motion.g fill="#5b9c64" style={{ opacity: sparkles }}>
          <path d="M65 85 L70 99 L84 104 L70 109 L65 123 L60 109 L46 104 L60 99 Z" />
          <path d="M378 67 L382 78 L393 82 L382 86 L378 97 L374 86 L363 82 L374 78 Z" />
        </motion.g>
      </motion.g>
    </g>
  );
}

export default function BmoReaction({ phase, category, progress }) {
  const reducedMotion = useReducedMotion();
  if (phase === "idle") return null;
  return (
    <motion.svg
      className="bmo-screen-reaction"
      viewBox="0 0 1149 1369"
      aria-hidden="true"
      data-reaction={getBmoReaction(category).style}
      initial={{ opacity: reducedMotion ? 1 : 0 }}
      animate={{ opacity: phase === "returning" ? 0 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
    >
      <g transform={`translate(${bmoScreen.x} ${bmoScreen.y}) skewY(${bmoScreen.skew})`}>
        <HappyBmoFace category={category} phase={phase} progress={progress} />
      </g>
    </motion.svg>
  );
}
