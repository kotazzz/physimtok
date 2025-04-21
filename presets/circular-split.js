import * as Utils from '../modules/utils.js';

// --- Helper Functions for Segmented Ring ---

// Generate vertices for a regular polygon
function generatePolygonVertices(centerX, centerY, radius, numSegments) {
  const vertices = [];
  const angleStep = (Math.PI * 2) / numSegments;
  for (let i = 0; i < numSegments; i++) {
    const angle = i * angleStep;
    vertices.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    });
  }
  return vertices;
}

// Rotate a point around a center
function rotatePoint(pointX, pointY, centerX, centerY, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const translatedX = pointX - centerX;
  const translatedY = pointY - centerY;
  return {
    x: translatedX * cos - translatedY * sin + centerX,
    y: translatedX * sin + translatedY * cos + centerY
  };
}

// Generate line segments from vertices, applying rotation and hole
function generateRingSegments(centerX, centerY, radius, thickness, numSegments, rotationAngle, holeStartSegment, holeSegmentsCount) {
  // Generate base vertices
  const outerVertices = generatePolygonVertices(centerX, centerY, radius, numSegments);
  const innerVertices = generatePolygonVertices(centerX, centerY, radius - thickness, numSegments);
  
  // Apply rotation to all vertices
  const rotatedOuterVertices = outerVertices.map(v => 
    rotatePoint(v.x, v.y, centerX, centerY, rotationAngle));
  const rotatedInnerVertices = innerVertices.map(v => 
    rotatePoint(v.x, v.y, centerX, centerY, rotationAngle));
  
  const segments = [];
  
  // For each segment index
  for (let i = 0; i < numSegments; i++) {
    // Calculate which segment index this would be in relation to hole position
    let segmentIndex = (i - holeStartSegment) % numSegments;
    if (segmentIndex < 0) segmentIndex += numSegments;
    
    // Skip segments that are part of the hole
    if (segmentIndex < holeSegmentsCount) {
      continue;
    }

    // Get rotated points for this segment
    const p1Outer = rotatedOuterVertices[i];
    const p2Outer = rotatedOuterVertices[(i + 1) % numSegments];
    const p1Inner = rotatedInnerVertices[i];
    const p2Inner = rotatedInnerVertices[(i + 1) % numSegments];

    // Add segments (outer wall, inner wall)
    segments.push({ p1: p1Outer, p2: p2Outer, type: 'outer' }); // Outer segment
    segments.push({ p1: p2Inner, p2: p1Inner, type: 'inner' }); // Inner segment (reversed for normal)

    // Check if this segment is adjacent to the hole to add side walls
    let nextSegmentIndex = ((i + 1) - holeStartSegment) % numSegments;
    let prevSegmentIndex = ((i - 1) - holeStartSegment) % numSegments;
    
    // Normalize negative indices
    if (nextSegmentIndex < 0) nextSegmentIndex += numSegments;
    if (prevSegmentIndex < 0) prevSegmentIndex += numSegments;
    
    // Add closing side if next segment is part of the hole
    if (nextSegmentIndex < holeSegmentsCount && segmentIndex >= holeSegmentsCount) {
        segments.push({ p1: p2Outer, p2: p2Inner, type: 'side' }); // Closing side before hole
    }
    
    // Add opening side if previous segment was part of the hole
    if (prevSegmentIndex < holeSegmentsCount && segmentIndex >= holeSegmentsCount) {
        segments.push({ p1: p1Inner, p2: p1Outer, type: 'side' }); // Opening side after hole
    }
  }
  
  return segments;
}

// Check collision between a circle (ball) and a line segment
function checkLineCircleCollision(ball, segment) {
  const dx = segment.p2.x - segment.p1.x;
  const dy = segment.p2.y - segment.p1.y;
  const lenSq = dx * dx + dy * dy;

  // Parameter t representing the projection of the ball's center onto the line
  const t = ((ball.x - segment.p1.x) * dx + (ball.y - segment.p1.y) * dy) / lenSq;

  let closestX, closestY;
  if (t < 0) {
    closestX = segment.p1.x;
    closestY = segment.p1.y;
  } else if (t > 1) {
    closestX = segment.p2.x;
    closestY = segment.p2.y;
  } else {
    closestX = segment.p1.x + t * dx;
    closestY = segment.p1.y + t * dy;
  }

  const distSq = Utils.distance(ball.x, ball.y, closestX, closestY) ** 2;

  if (distSq < ball.radius * ball.radius) {
    // Collision detected
    const dist = Math.sqrt(distSq);
    const overlap = ball.radius - dist;
    
    // Collision normal (from closest point on line to ball center)
    // Avoid division by zero if dist is very small
    const normalX = dist > 1e-6 ? (ball.x - closestX) / dist : 0;
    const normalY = dist > 1e-6 ? (ball.y - closestY) / dist : 0;

    return { overlap, normalX, normalY };
  }
  return null; // No collision
}

// --- Circular Split Preset --- 
const preset = {
  name: "Segmented Ring Split",
  description: "A rotating segmented ring where balls split when hitting the bottom platform",
  
  // Preset-specific settings
  settings: {
    rotationSpeed: { label: 'Rotation Speed', value: 0.01, min: -0.05, max: 0.05, step: 0.001 },
    numSegments: { label: 'Segments', value: 12, min: 3, max: 50, step: 1 },
    holeSegments: { label: 'Hole Size (segments)', value: 2, min: 0, max: 10, step: 1 },
    radius: { label: 'Radius', value: 150, min: 50, max: 300, step: 10 },
    thickness: { label: 'Thickness', value: 15, min: 5, max: 50, step: 1 },
  },

  // Called when a setting is changed in the UI
  onSettingChange(simulator, key, value) {
    // Regenerate segments for any change in structure
    if (key === 'numSegments' || key === 'radius' || key === 'thickness' || key === 'holeSegments') {
      // Make sure hole segments doesn't exceed total segments
      if (key === 'numSegments' && this.settings.holeSegments.value >= value) {
        this.settings.holeSegments.value = Math.max(0, value - 1);
      }
      this.generateRingGeometry(simulator);
    }
  },

  // Initialize the preset state
  init: function(simulator) {
    simulator.ring = {
      centerX: simulator.canvas.width / 2,
      centerY: simulator.canvas.height / 2.4,
      rotationAngle: 0, // Current absolute rotation angle in radians
      holeSegment: 0,   // Fixed hole segment (the hole position doesn't change, the ring rotates)
      segments: [],
      color: '#4834d4'
    };

    simulator.platform = {
      y: simulator.canvas.height - 20,
      color: '#e74c3c'
    };

    // Generate initial ring geometry
    this.generateRingGeometry(simulator);

    // Create initial ball
    simulator.ballManager.createBallInCircle();

    // Set global physics parameters
    simulator.setPhysicsParams({
      gravity: 0.2,
      friction: 0.99
    });
  },

  // Generate the geometry for the ring
  generateRingGeometry: function(simulator) {
    const settings = this.settings;
    const ring = simulator.ring;
    
    // Calculate how many segments to use for the hole
    const holeSegments = Math.min(settings.holeSegments.value, settings.numSegments.value - 1);
    
    // Generate segments with the current rotation angle
    ring.segments = generateRingSegments(
      ring.centerX,
      ring.centerY,
      settings.radius.value,
      settings.thickness.value,
      settings.numSegments.value,
      ring.rotationAngle, // Apply actual rotation angle
      ring.holeSegment,   // Fixed hole segment
      holeSegments        // Number of segments in the hole
    );
  },
  
  // Update simulation state and draw elements
  update: function(simulator) {
    const ctx = simulator.ctx;
    const ring = simulator.ring;
    const platform = simulator.platform;
    const settings = this.settings;
    
    // Update ring center (for window resize)
    ring.centerX = simulator.canvas.width / 2;
    
    // Update rotation angle (continuous rotation)
    ring.rotationAngle += settings.rotationSpeed.value * simulator.timeScale;
    
    // Normalize angle to keep it in reasonable range
    ring.rotationAngle = Utils.normalizeAngle(ring.rotationAngle);
    
    // Regenerate segments with new rotation angle
    this.generateRingGeometry(simulator);
    
    // Draw platform
    ctx.fillStyle = platform.color;
    ctx.fillRect(0, platform.y, simulator.canvas.width, 20);
    
    // Draw the ring segments
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ring.segments.forEach(seg => {
      ctx.moveTo(seg.p1.x, seg.p1.y);
      ctx.lineTo(seg.p2.x, seg.p2.y);
    });
    ctx.stroke();
  },

  // Handle collisions for this preset
  handleCollisions: function(simulator, ball) {
    const platform = simulator.platform;
    const ring = simulator.ring;
    
    // 1. Platform collision with ball splitting
    if (ball.y + ball.radius > platform.y) {
      // Get ring parameters from the preset settings
      const settings = this.settings;
      const radius = settings.radius.value;
      const thickness = settings.thickness.value;
      
      // Create two new balls inside the ring instead of near the original ball
      for (let i = 0; i < 2; i++) {
        // Calculate safe inner radius (avoiding immediate collisions with the ring)
        const innerRadius = radius - thickness - simulator.ballRadius - 5;
        
        // Generate a random position inside the circle
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * innerRadius * 0.8;
        
        const x = ring.centerX + Math.cos(angle) * distance;
        const y = ring.centerY + Math.sin(angle) * distance;
        
        // Create a new ball with random velocity
        const vx = (Math.random() - 0.5) * 3;  // Random horizontal velocity
        const vy = (Math.random() - 0.5) * 3;  // Random vertical velocity
        
        simulator.ballManager.createBall(x, y, vx, vy);
      }
      
      return true; // Remove the original ball
    }

    // 2. Ring Segment collisions
    for (const segment of ring.segments) {
      const collisionInfo = checkLineCircleCollision(ball, segment);
      if (collisionInfo) {
        const { overlap, normalX, normalY } = collisionInfo;

        // Simple position correction (push out)
        ball.x += normalX * overlap;
        ball.y += normalY * overlap;

        // Reflect velocity using the bounciness parameter
        const dotProduct = ball.velocityX * normalX + ball.velocityY * normalY;
        ball.velocityX -= 2 * dotProduct * normalX * simulator.bounciness;
        ball.velocityY -= 2 * dotProduct * normalY * simulator.bounciness;
        
        // For very high bounciness, add a small "kick" to make the bounce more energetic
        if (simulator.bounciness > 1.0) {
          const kickFactor = (simulator.bounciness - 1.0) * 2;
          ball.velocityX += normalX * kickFactor;
          ball.velocityY += normalY * kickFactor;
        }
        
        break; 
      }
    }
    
    return false; // Ball should not be removed by ring collision
  }
};

export default preset;