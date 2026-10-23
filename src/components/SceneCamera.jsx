import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion, useTransform } from "motion/react";
import { bmoScreen, getCameraScale, getScreenCameraTarget } from "../data/bmoScreen.js";

export default function SceneCamera({ children, phase, fieldRef, progress, onComplete }) {
  const camera = useRef(null);
  const viewport = useRef(null);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const [target, setTarget] = useState(null);
  const reducedMotion = useReducedMotion();
  const engaged = ["zooming", "reading", "zoomingOut"].includes(phase);

  useLayoutEffect(() => {
    if (!engaged || reducedMotion) return;
    function measure() {
      const port = fieldRef.current.querySelector(".bmo-port");
      const svgMatrix = port.getScreenCTM();
      const style = getComputedStyle(camera.current);
      const [originX, originY] = style.transformOrigin.split(" ").map(parseFloat);
      // CSS transform matrices omit transform-origin. Include it before
      // unprojecting; otherwise resize would measure an already enlarged world.
      const world = new DOMMatrix()
        .translate(originX, originY)
        .multiply(new DOMMatrix(style.transform))
        .translate(-originX, -originY);
      const inverse = world.inverse();
      const bounds = viewport.current.getBoundingClientRect();
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

  const ready = reducedMotion || Boolean(target);
  useEffect(() => {
    if (!["zooming", "zoomingOut"].includes(phase) || !ready) return;
    let cancelled = false;
    const controls = animate(progress, phase === "zooming" ? 1 : 0, {
      duration: reducedMotion ? 0.12 : phase === "zoomingOut" ? 0.9 : 1.3,
      ease: [0.42, 0, 0.58, 1],
    });
    controls.then(() => {
      if (!cancelled) complete.current(phase);
    });
    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [phase, ready, reducedMotion, progress]);

  const x = useTransform(progress, [0, 1], [0, reducedMotion ? 0 : target?.x || 0]);
  const y = useTransform(progress, [0, 1], [0, reducedMotion ? 0 : target?.y || 0]);
  const scale = useTransform(() => reducedMotion ? 1 : getCameraScale(progress.get(), target?.scale || 1));

  return (
    <div className="scene-viewport" ref={viewport}>
      <motion.div
        ref={camera}
        className="scene-camera"
        data-phase={phase}
        data-moving={phase === "zooming" || phase === "zoomingOut"}
        style={{
          x, y, scale,
          transformOrigin: target ? `${target.origin.x}px ${target.origin.y}px` : "0 0",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
