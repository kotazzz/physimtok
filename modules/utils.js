/**
 * Utility functions for the physics simulator
 */

// Generate a random color for balls
export function getRandomColor() {
  const colors = ['#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#f1c40f'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Calculate distance between two points
export function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Check if a point is within the visible screen area with margin
export function isOnScreen(x, y, canvas, margin = 100) {
  return (
    x > -margin &&
    x < canvas.width + margin &&
    y > -margin &&
    y < canvas.height + margin
  );
}

// Convert angle to a normalized value between 0 and 2π
export function normalizeAngle(angle) {
  let normalized = angle;
  while (normalized < 0) normalized += Math.PI * 2;
  while (normalized >= Math.PI * 2) normalized -= Math.PI * 2;
  return normalized;
}

// Check if an angle is within a range (accounting for circular wrap-around)
export function isAngleInRange(angle, start, end) {
  const normalizedAngle = normalizeAngle(angle);
  const normalizedStart = normalizeAngle(start);
  const normalizedEnd = normalizeAngle(end);
  
  if (normalizedStart < normalizedEnd) {
    return normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd;
  } else {
    // Range wraps around the circle
    return normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd;
  }
}

// Calculate FPS from frame count and time interval
export function calculateFps(frameCount, timeInterval) {
  return Math.round((frameCount * 1000) / timeInterval);
}