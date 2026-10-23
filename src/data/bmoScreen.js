// Kullanılan BMO görselinin ekran içi: SVG koordinatları (1149 × 1369).
// Tepki yüzü ve yakınlaşma aynı ölçüleri kullanır; hedefler birbirinden sapmaz.
export const bmoScreen = { x: 435, y: 315, width: 446, height: 355, skew: -8 };

export function getScreenCameraGeometry(svg, viewport) {
  const matrix = svg.getScreenCTM();
  const slope = Math.tan((bmoScreen.skew * Math.PI) / 180);
  const origin = new DOMPoint(
    bmoScreen.x,
    bmoScreen.y + (slope * bmoScreen.width) / 2,
  ).matrixTransform(matrix);
  const scale = Math.hypot(matrix.a, matrix.b);
  const compact = viewport.width <= 680;
  const margin = compact ? 8 : 24;
  const width = Math.min(1120, viewport.width - margin * 2);
  const height = Math.min(920, viewport.height - margin * 2);
  return {
    source: {
      x: origin.x,
      y: origin.y,
      width: bmoScreen.width * scale,
      height: bmoScreen.height * scale,
      skewY: bmoScreen.skew,
      borderRadius: 5,
      borderWidth: 2,
      padding: 1,
      opacity: 1,
    },
    destination: {
      x: (viewport.width - width) / 2,
      y: (viewport.height - height) / 2,
      width,
      height,
      skewY: 0,
      borderRadius: compact ? 18 : 28,
      borderWidth: compact ? 5 : 7,
      padding: compact ? 5 : 10,
      opacity: 1,
    },
  };
}
