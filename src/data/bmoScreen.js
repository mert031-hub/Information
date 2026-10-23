// Screen coordinates in the original 1149 × 1369 BMO artwork.
export const bmoScreen = { x: 435, y: 315, width: 446, height: 355, skew: -8 };

// Scale about the LCD's center. Translation is the camera's travel, not the
// much larger offset of a world scaled from its top-left corner.
export function getScreenCameraTarget(screen, viewport) {
  const slope = Math.abs(Math.tan(bmoScreen.skew * Math.PI / 180));
  return {
    x: viewport.width / 2 - (viewport.offsetX || 0) - screen.center.x,
    y: viewport.height / 2 - (viewport.offsetY || 0) - screen.center.y,
    scale: Math.max(
      viewport.width / (screen.width * 0.88),
      (viewport.height + slope * viewport.width) / (screen.height * 0.88),
    ),
    origin: screen.center,
  };
}

export function getCameraScale(progress, targetScale) {
  // Equal progress steps give equal magnification ratios: no huge early jump.
  return Math.exp(Math.log(targetScale) * progress);
}
