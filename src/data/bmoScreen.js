// Screen coordinates in the original 1149 × 1369 BMO artwork.
export const bmoScreen = { x: 435, y: 315, width: 446, height: 355, skew: -8 };

// Move the whole world toward the viewer's camera, centered on BMO's LCD.
// The slight inverse skew straightens its glass as we enter the screen.
export function getScreenCameraTarget(screen, viewport) {
  const skewY = -bmoScreen.skew;
  const slope = Math.tan(skewY * Math.PI / 180);
  const scale = Math.max(
    viewport.width / (screen.width * 0.88),
    viewport.height / (screen.height * 0.88),
  );
  return {
    x: viewport.width / 2 - (viewport.offsetX || 0) - screen.center.x * scale,
    y: viewport.height / 2 - (viewport.offsetY || 0) - (screen.center.y + slope * screen.center.x) * scale,
    scale,
    skewY,
  };
}
