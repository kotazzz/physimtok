/**
 * Ball management module
 * Handles ball creation, physics, and lifecycle
 */

import * as Utils from './utils.js';

export default class BallManager {
  constructor(simulator) {
    this.simulator = simulator;
    this.balls = [];
    this.maxBalls = 100;  // Default max balls
  }

  // Set maximum number of balls
  setMaxBalls(max) {
    this.maxBalls = max;
    // Remove excess balls if needed
    if (this.balls.length > this.maxBalls) {
      this.balls.splice(0, this.balls.length - this.maxBalls);
    }
  }

  // Create a ball inside the circle
  createBallInCircle() {
    const ring = this.simulator.ring;
    if (!ring) return;
    
    this.limitBallCount();
    
    // Get ring parameters from the preset settings if available
    let radius = 150;
    let thickness = 10;
    
    if (this.simulator.currentPreset && this.simulator.currentPreset.settings) {
      const settings = this.simulator.currentPreset.settings;
      radius = settings.radius ? settings.radius.value : radius;
      thickness = settings.thickness ? settings.thickness.value : thickness;
    }
    
    // Calculate safe inner radius (avoiding immediate collisions)
    const innerRadius = radius - thickness - this.simulator.ballRadius - 5;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * innerRadius * 0.8;
    
    const x = ring.centerX + Math.cos(angle) * distance;
    const y = ring.centerY + Math.sin(angle) * distance;
    
    this.balls.push({
      x: x,
      y: y,
      radius: this.simulator.ballRadius,
      velocityX: 0,
      velocityY: 0,
      color: Utils.getRandomColor(),
      creationTime: performance.now()
    });
  }

  // Create a new ball at specific position with velocity
  createBall(x, y, vx, vy) {
    this.limitBallCount();
    
    this.balls.push({
      x: x,
      y: y,
      radius: this.simulator.ballRadius,
      velocityX: vx,
      velocityY: vy,
      color: Utils.getRandomColor(),
      creationTime: performance.now()
    });
  }

  // Ensure we don't exceed maximum ball count
  limitBallCount() {
    if (this.balls.length >= this.maxBalls) {
      // Remove oldest balls to make room
      this.balls.splice(0, this.balls.length + 1 - this.maxBalls);
    }
  }

  // Update all balls physics
  update(deltaTime) {
    const ballsToRemove = [];
    const gravity = this.simulator.gravity;
    const friction = this.simulator.friction;
    const canvas = this.simulator.canvas;
    
    // Update each ball's physics
    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];
      
      // Apply gravity
      ball.velocityY += gravity * deltaTime * 60;
      
      // Apply friction
      ball.velocityX *= friction;
      ball.velocityY *= friction;
      
      // Update position
      ball.x += ball.velocityX * deltaTime * 60;
      ball.y += ball.velocityY * deltaTime * 60;
      
      // Check for wall collisions
      if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.velocityX *= -0.8;
        
        // Ensure ball stays within bounds
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
        } else if (ball.x + ball.radius > canvas.width) {
          ball.x = canvas.width - ball.radius;
        }
      }

      // Let the active preset handle collisions
      if (this.simulator.currentPreset && typeof this.simulator.currentPreset.handleCollisions === 'function') {
        const shouldRemove = this.simulator.currentPreset.handleCollisions(this.simulator, ball);
        if (shouldRemove) {
          ballsToRemove.push(i);
        }
      }
      
      // Check if ball is off-screen
      if (!Utils.isOnScreen(ball.x, ball.y, canvas)) {
        ballsToRemove.push(i);
      }
    }
    
    // Remove balls marked for removal (in reverse order to avoid index shifting)
    ballsToRemove.sort((a, b) => b - a);
    for (const index of ballsToRemove) {
      this.balls.splice(index, 1);
    }
  }

  // Render all balls
  render(ctx) {
    for (const ball of this.balls) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
    }
  }

  // Get current ball count
  getBallCount() {
    return this.balls.length;
  }

  // Clear all balls
  clear() {
    this.balls = [];
  }
}