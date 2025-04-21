// Import presets and modules
import circularSplitPreset from './presets/circular-split.js';
import BallManager from './modules/BallManager.js';
import UIManager from './modules/UIManager.js';
import * as Utils from './modules/utils.js';

// Available presets
const presets = [
  circularSplitPreset
  // Add more presets here in the future
];

// Simulator class
class PhysicsSimulator {
  constructor() {
    // Canvas setup
    this.canvas = document.getElementById('simulationCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Initialize managers
    this.ballManager = new BallManager(this);
    this.uiManager = new UIManager(this);
    
    // Set canvas dimensions
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Physics parameters
    this.gravity = 0.2;
    this.friction = 0.99;
    this.ballRadius = 15;
    this.timeScale = 1.0;
    this.bounciness = 0.7; // Add bounciness parameter (restitution coefficient)
    
    // Simulation state
    this.isRunning = false;
    this.animationId = null;
    this.startTime = 0;
    this.pauseStartTime = 0; // When the pause started
    this.totalPausedTime = 0; // Accumulated paused time
    this.simulationTime = 0;
    this.currentPreset = null;
    
    // FPS calculation
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fpsUpdateInterval = 500; // Update FPS every 500ms
    this.lastFpsUpdate = 0;
    this.currentFps = 0;
    
    // Load presets and initialize
    this.uiManager.loadPresets(presets);
  }
  
  // Initialize the simulator with a specific preset
  init(preset) {
    // Clear existing animation if running
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Reset state
    this.ballManager.clear();
    this.startTime = 0;
    this.pauseStartTime = 0;
    this.totalPausedTime = 0;
    this.simulationTime = 0;
    this.isRunning = false;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.currentFps = 0;
    
    // Activate the selected preset
    this.currentPreset = preset;
    
    // Initialize the preset
    if (preset && typeof preset.init === 'function') {
      preset.init(this);
    }
    
    // Update UI
    this.updateUI();
    
    // Draw initial state
    this.render();
  }
  
  // Set physics parameters
  setPhysicsParams({ gravity, friction, bounciness }) {
    if (gravity !== undefined) {
      this.gravity = gravity;
    }
    
    if (friction !== undefined) {
      this.friction = friction;
    }
    
    if (bounciness !== undefined) {
      this.bounciness = bounciness;
    }
    
    // Update UI to reflect new parameters
    this.updateUI();
  }
  
  // Update UI elements
  updateUI() {
    this.uiManager.updateControls(
      this.isRunning,
      this.gravity,
      this.timeScale,
      this.ballManager.maxBalls,
      this.bounciness
    );
    
    this.updateStats();
  }
  
  // Update simulation statistics
  updateStats() {
    this.uiManager.updateStats(
      this.ballManager.getBallCount(),
      this.simulationTime,
      this.currentFps
    );
  }
  
  // Start the simulation
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      
      const now = performance.now();
      
      // If this is the first start
      if (this.startTime === 0) {
        this.startTime = now;
      } 
      // If we're resuming from pause
      else if (this.pauseStartTime > 0) {
        // Add the duration of this pause to totalPausedTime
        this.totalPausedTime += now - this.pauseStartTime;
        this.pauseStartTime = 0;
      }
      
      this.lastFrameTime = now;
      this.lastFpsUpdate = now;
      this.animate();
      this.updateUI();
    }
  }
  
  // Pause the simulation
  pause() {
    if (this.isRunning) {
      this.isRunning = false;
      this.pauseStartTime = performance.now(); // Mark when the pause started
      
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      
      this.updateUI();
    }
  }
  
  // Reset the simulation
  reset() {
    this.pause();
    this.init(this.currentPreset);
  }
  
  // Handle window resize
  resizeCanvas() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    
    // Re-render if paused
    if (!this.isRunning && this.currentPreset) {
      this.render();
    }
  }
  
  // Calculate FPS
  calculateFps(now) {
    this.frameCount++;
    
    // Update FPS counter every fpsUpdateInterval milliseconds
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.currentFps = Utils.calculateFps(this.frameCount, now - this.lastFpsUpdate);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
  
  // Main animation loop
  animate() {
    if (!this.isRunning) return;
    
    const now = performance.now();
    
    // Calculate delta time and FPS
    const deltaTime = (now - this.lastFrameTime) / 1000 * this.timeScale; // Convert to seconds and apply time scale
    this.lastFrameTime = now;
    this.calculateFps(now);
    
    // Update simulation time (current time minus start time minus total paused time)
    this.simulationTime = (now - this.startTime - this.totalPausedTime) / 1000;
    
    this.update(deltaTime);
    this.render();
    
    // Continue animation
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  // Update physics
  update(deltaTime) {
    // Update ball physics through the ball manager
    this.ballManager.update(deltaTime);
    
    // Update stats
    this.updateStats();
  }
  
  // Render the simulation
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Let the active preset render its environment
    if (this.currentPreset && typeof this.currentPreset.update === 'function') {
      this.currentPreset.update(this);
    }
    
    // Render balls through the ball manager
    this.ballManager.render(this.ctx);
  }
}

// Initialize the simulator
const simulator = new PhysicsSimulator();