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
      container.innerHTML = '<p class="text-muted"><i class="fas fa-info-circle me-2"></i>No settings for this preset.</p>';
      return;
    }

    for (const key in preset.settings) {
      const setting = preset.settings[key];
      if (!setting.label) continue; // Skip settings without labels

      const div = document.createElement('div');
      div.className = 'control-item mb-3';

      // Choose an appropriate icon based on setting key
      const icon = this.getSettingIcon(key);

      // Create the control header with label and value
      const controlHeader = document.createElement('div');
      controlHeader.className = 'control-header d-flex justify-content-between';
      
      // Label with icon
      const labelDiv = document.createElement('div');
      labelDiv.className = 'control-label';
      labelDiv.innerHTML = `<i class="${icon} me-2"></i><span>${setting.label}</span>`;
      
      // Value display
      const valueDiv = document.createElement('div');
      valueDiv.className = 'control-value';
      valueDiv.id = `preset-${key}-value`;
      valueDiv.textContent = setting.value.toString();
      
      controlHeader.appendChild(labelDiv);
      controlHeader.appendChild(valueDiv);

      // Create the input control container
      const inputDiv = document.createElement('div');
      inputDiv.className = 'control-input';

      // Create the range input
      const input = document.createElement('input');
      input.type = 'range';
      input.className = 'form-range';
      input.id = `preset-${key}`;
      input.min = setting.min;
      input.max = setting.max;
      input.step = setting.step;
      input.value = setting.value;

      input.addEventListener('input', (e) => {
        const newValue = parseFloat(e.target.value);
        // Update the preset's setting value directly
        setting.value = newValue;
        valueDiv.textContent = newValue.toFixed(setting.step.toString().includes('.') ? setting.step.toString().split('.')[1].length : 0); // Format based on step
        
        // Optional: Trigger a simulator update if needed immediately
        if (this.simulator.currentPreset && typeof this.simulator.currentPreset.onSettingChange === 'function') {
          this.simulator.currentPreset.onSettingChange(this.simulator, key, newValue);
        }
      });

      inputDiv.appendChild(input);
      div.appendChild(controlHeader);
      div.appendChild(inputDiv);
      container.appendChild(div);
    }
  }

  // Helper function to get appropriate icon for a setting
  getSettingIcon(settingKey) {
    const key = settingKey.toLowerCase();
    
    if (key.includes('speed') || key.includes('velocity')) {
      return 'fas fa-tachometer-alt';
    } else if (key.includes('rotation')) {
      return 'fas fa-sync-alt';
    } else if (key.includes('radius') || key.includes('size')) {
      return 'fas fa-expand';
    } else if (key.includes('segment')) {
      return 'fas fa-grip-lines';
    } else if (key.includes('hole')) {
      return 'fas fa-circle-notch';
    } else if (key.includes('thickness')) {
      return 'fas fa-ruler-vertical';
    }
    
    return 'fas fa-sliders-h';
  }
  
  // Load available presets into UI
  loadPresets(presets) {
    this.elements.presetsList.innerHTML = '';
    
    presets.forEach((preset, index) => {
      const item = document.createElement('button');
      item.className = 'list-group-item list-group-item-action d-flex align-items-center border-0';
      
      // Add icon based on preset type or use a default one
      const icon = this.getPresetIcon(preset.name);
      
      // Create icon element
      const iconEl = document.createElement('i');
      iconEl.className = `${icon} me-3`;
      
      // Add the icon and name to the button
      item.appendChild(iconEl);
      
      // Add preset name in a span
      const nameSpan = document.createElement('span');
      nameSpan.textContent = preset.name;
      item.appendChild(nameSpan);
      
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
  
  // Helper function to get an appropriate icon based on preset name
  getPresetIcon(presetName) {
    const name = presetName.toLowerCase();
    
    if (name.includes('ring') || name.includes('circle') || name.includes('orbit')) {
      return 'fas fa-circle-notch';
    } else if (name.includes('ball') || name.includes('bounce')) {
      return 'fas fa-basketball-ball';
    } else if (name.includes('gravity') || name.includes('planet')) {
      return 'fas fa-globe';
    } else if (name.includes('pendulum') || name.includes('swing')) {
      return 'fas fa-sync-alt';
    } else if (name.includes('split') || name.includes('divide')) {
      return 'fas fa-object-ungroup';
    }
    
    // Default icon
    return 'fas fa-atom';
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