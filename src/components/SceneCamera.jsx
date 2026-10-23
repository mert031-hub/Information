import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { bmoScreen, getScreenCameraTarget } from "../data/bmoScreen.js";

const home = { x: 0, y: 0, scale: 1, skewY: 0 };

export default function SceneCamera({ children, phase, fieldRef, onComplete }) {
  const camera = useRef(null);
  const viewport = useRef(null);
  const [target, setTarget] = useState(null);
  const reducedMotion = useReducedMotion();
  const engaged = ["zooming", "reading", "zoomingOut"].includes(phase);
  const inside = phase === "zooming" || phase === "reading";

  useLayoutEffect(() => {
    if (!engaged || reducedMotion) return;
    function measure() {
      const port = fieldRef.current.querySelector(".bmo-port");
      const svgMatrix = port.getScreenCTM();
      const worldMatrix = new DOMMatrix(getComputedStyle(camera.current).transform);
      const inverse = worldMatrix.inverse();
      const bounds = viewport.current.getBoundingClientRect();
      // Remove the current camera transform before measuring. Resizing while
      // zoomed must never compound the previous magnification.
      const point = (x, y) => {
        const projected = new DOMPoint(x, y).matrixTransform(svgMatrix);
        return new DOMPoint(projected.x - bounds.x, projected.y - bounds.y)
          .matrixTransform(inverse);
      };
      const slope = Math.tan(bmoScreen.skew * Math.PI / 180);
      const center = point(
        bmoScreen.x + bmoScreen.width / 2,
        bmoScreen.y + bmoScreen.height / 2 + slope * bmoScreen.width / 2,
      );
      const left = point(bmoScreen.x, bmoScreen.y);
      const right = point(bmoScreen.x + bmoScreen.width, bmoScreen.y);
      const bottom = point(bmoScreen.x, bmoScreen.y + bmoScreen.height);
      setTarget(getScreenCameraTarget({
        center,
        width: Math.hypot(right.x - left.x, right.y - left.y),
        height: Math.hypot(bottom.x - left.x, bottom.y - left.y),
      }, {
        width: window.innerWidth,
        height: window.innerHeight,
        offsetX: bounds.x,
        offsetY: bounds.y,
      }));
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(fieldRef.current.querySelector(".bmo-area"));
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [engaged, reducedMotion, fieldRef]);

  return (
    <div className="scene-viewport" ref={viewport}>
      <motion.div
        ref={camera}
        className="scene-camera"
        data-phase={phase}
        data-moving={phase === "zooming" || phase === "zoomingOut"}
        initial={false}
        animate={!reducedMotion && inside && target ? target : home}
        transition={{
          duration: reducedMotion ? 0 : phase === "zoomingOut" ? 0.9 : 1.2,
          ease: phase === "zoomingOut" ? [0.42, 0, 0.4, 1] : [0.45, 0, 0.2, 1],
        }}
        onAnimationComplete={() => {
          if (!reducedMotion && target && ["zooming", "zoomingOut"].includes(phase))
            onComplete(phase);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
