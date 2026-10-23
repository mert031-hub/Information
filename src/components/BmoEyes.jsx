import { useEffect, useRef } from "react";

export default function BmoEyes() {
  const surface = useRef(null);
  const eyes = useRef(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };
    let frame = 0;
    let previousTime = 0;

    function animate(time) {
      const blend = 1 - Math.exp(-Math.min(time - previousTime, 64) / 240);
      previousTime = time;
      current.x += (target.x - current.x) * blend;
      current.y += (target.y - current.y) * blend;
      eyes.current.setAttribute("transform", `translate(${current.x} ${current.y})`);
      if (Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.02) {
        frame = requestAnimationFrame(animate);
      } else {
        frame = 0;
      }
    }

    function start() {
      if (!frame) {
        previousTime = performance.now();
        frame = requestAnimationFrame(animate);
      }
    }

    function follow(event) {
      if (preference.matches || event.pointerType === "touch") return;
      const bounds = surface.current.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width * 0.573) / window.innerWidth;
      const y = (event.clientY - bounds.top - bounds.height * 0.293) / window.innerHeight;
      target = { x: Math.max(-1, Math.min(1, x * 2)) * 12, y: Math.max(-1, Math.min(1, y * 2)) * 8 };
      start();
    }

    function reset() {
      target = { x: 0, y: 0 };
      start();
    }

    function updatePreference() {
      if (!preference.matches) return;
      cancelAnimationFrame(frame);
      frame = 0;
      target = current = { x: 0, y: 0 };
      eyes.current.removeAttribute("transform");
    }

    window.addEventListener("pointermove", follow, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    preference.addEventListener("change", updatePreference);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", follow);
      document.documentElement.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      preference.removeEventListener("change", updatePreference);
    };
  }, []);

  return (
    <svg ref={surface} className="bmo-eyes" viewBox="0 0 1149 1369" aria-hidden="true">
      {/* Cover only the printed eyes; the original screen and smile remain visible. */}
      <ellipse cx="558" cy="415" rx="18" ry="28" fill="#d2f9dd" />
      <ellipse cx="759" cy="388" rx="18" ry="28" fill="#d3fade" />
      <g ref={eyes} fill="#153a30">
        <ellipse cx="558" cy="415" rx="12" ry="22" transform="rotate(7 558 415)" />
        <ellipse cx="759" cy="388" rx="12" ry="21" transform="rotate(7 759 388)" />
      </g>
    </svg>
  );
}
