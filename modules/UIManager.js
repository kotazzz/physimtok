/**
 * UI Manager module
 * Handles user interface elements and interactions
 */

export default class UIManager {
  constructor(simulator) {
    this.simulator = simulator;
    
    // UI Elements
    this.elements = {
      ballsCount: document.getElementById('ballsCount'),
      simulationTime: document.getElementById('simulationTime'),
      fpsCounter: document.getElementById('fpsCounter'),
      startBtn: document.getElementById('startBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      resetBtn: document.getElementById('resetBtn'),
      gravityControl: document.getElementById('gravityControl'),
      gravityValue: document.getElementById('gravityValue'),
      timeScaleControl: document.getElementById('timeScaleControl'),
      timeScaleValue: document.getElementById('timeScaleValue'),
      maxBallsControl: document.getElementById('maxBallsControl'),
      maxBallsValue: document.getElementById('maxBallsValue'),
      bouncinessControl: document.getElementById('bouncinessControl'),
      bouncinessValue: document.getElementById('bouncinessValue'),
      presetsList: document.getElementById('presetsList'),
      presetSettingsContainer: document.getElementById('presetSettingsContainer')
    };
    
    this.initEventListeners();
  }
  
  // Update statistics display
  updateStats(ballCount, simulationTime, fps) {
    this.elements.ballsCount.textContent = ballCount;
    this.elements.simulationTime.textContent = Math.floor(simulationTime);
    this.elements.fpsCounter.textContent = fps;
  }
  
  // Update UI controls based on simulator state
  updateControls(isRunning, gravity, timeScale, maxBalls, bounciness) {
    // Update button states
    this.elements.startBtn.disabled = isRunning;
    this.elements.pauseBtn.disabled = !isRunning;
    
    // Update global slider values
    this.elements.gravityControl.value = gravity;
    this.elements.gravityValue.textContent = gravity.toFixed(2);
    
    this.elements.timeScaleControl.value = timeScale;
    this.elements.timeScaleValue.textContent = timeScale.toFixed(1);
    
    this.elements.maxBallsControl.value = maxBalls;
    this.elements.maxBallsValue.textContent = maxBalls;
    
    // Update bounciness slider if it exists
    if (this.elements.bouncinessControl) {
      this.elements.bouncinessControl.value = bounciness;
      this.elements.bouncinessValue.textContent = bounciness.toFixed(2);
    }
  }

  // Dynamically display settings for the current preset
  displayPresetSettings(preset) {
    const container = this.elements.presetSettingsContainer;
    container.innerHTML = ''; // Clear previous settings

    if (!preset || !preset.settings) {
      container.innerHTML = '<p class="text-muted">No settings for this preset.</p>';
      return;
    }

    for (const key in preset.settings) {
      const setting = preset.settings[key];
      if (!setting.label) continue; // Skip settings without labels

      const div = document.createElement('div');
      div.className = 'mb-3';

      const label = document.createElement('label');
      label.htmlFor = `preset-${key}`;
      label.className = 'form-label d-flex justify-content-between';
      label.innerHTML = `${setting.label}: <span id="preset-${key}-value">${setting.value}</span>`;

      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'form-range';
      input.id = `preset-${key}`;
      input.min = setting.min;
      input.max = setting.max;
      input.step = setting.step;
      input.value = setting.value;

      const valueSpan = label.querySelector('span');

      input.addEventListener('input', (e) => {
        const newValue = parseFloat(e.target.value);
        // Update the preset's setting value directly
        setting.value = newValue;
        valueSpan.textContent = newValue.toFixed(setting.step.toString().includes('.') ? setting.step.toString().split('.')[1].length : 0); // Format based on step
        
        // Optional: Trigger a simulator update if needed immediately
        if (this.simulator.currentPreset && typeof this.simulator.currentPreset.onSettingChange === 'function') {
          this.simulator.currentPreset.onSettingChange(this.simulator, key, newValue);
        }
      });

      div.appendChild(label);
      div.appendChild(input);
      container.appendChild(div);
    }
  }
  
  // Load available presets into UI
  loadPresets(presets) {
    this.elements.presetsList.innerHTML = '';
    
    presets.forEach((preset, index) => {
      const item = document.createElement('button');
      item.className = 'list-group-item list-group-item-action';
      item.textContent = preset.name;
      
      if (preset.description) {
        item.title = preset.description;
      }
      
      item.addEventListener('click', () => {
        // Deselect all presets
        Array.from(this.elements.presetsList.children).forEach(el => {
          el.classList.remove('active');
        });
        
        // Mark this preset as active
        item.classList.add('active');
        
        // Initialize with this preset
        this.simulator.init(preset);
        // Display settings for the newly selected preset
        this.displayPresetSettings(preset);
      });
      
      this.elements.presetsList.appendChild(item);
      
      // Auto-select the first preset and display its settings
      if (index === 0) {
        item.click();
      }
    });
  }
  
  // Initialize event listeners for controls
  initEventListeners() {
    // Playback control buttons
    this.elements.startBtn.addEventListener('click', () => this.simulator.start());
    this.elements.pauseBtn.addEventListener('click', () => this.simulator.pause());
    this.elements.resetBtn.addEventListener('click', () => this.simulator.reset());
    
    // Physics control sliders
    this.elements.gravityControl.addEventListener('input', (e) => {
      this.simulator.gravity = parseFloat(e.target.value);
      this.elements.gravityValue.textContent = this.simulator.gravity.toFixed(2);
    });
    
    this.elements.timeScaleControl.addEventListener('input', (e) => {
      this.simulator.timeScale = parseFloat(e.target.value);
      this.elements.timeScaleValue.textContent = this.simulator.timeScale.toFixed(1);
    });
    
    this.elements.maxBallsControl.addEventListener('input', (e) => {
      const maxBalls = parseInt(e.target.value);
      this.simulator.ballManager.setMaxBalls(maxBalls);
      this.elements.maxBallsValue.textContent = maxBalls;
    });
    
    // Bounciness control
    if (this.elements.bouncinessControl) {
      this.elements.bouncinessControl.addEventListener('input', (e) => {
        this.simulator.bounciness = parseFloat(e.target.value);
        this.elements.bouncinessValue.textContent = this.simulator.bounciness.toFixed(2);
      });
    }
  }
}