/**
 * Default game configuration
 */

import { GameConfig, RenderOptions } from './types';

// Set to true to always show "Show Fields" and "Show Preview" buttons
export const DEBUG_MODE = true;

export const DEFAULT_CONFIG: GameConfig = {
  canvasWidth: 900,
  canvasHeight: 600,
  worldWidth: 30,  // World units
  worldHeight: 20, // World units
  pixelsPerUnit: 30, // 900/30 = 30 pixels per unit
  
  // Physics constants (scaled for gameplay, not realistic)
  qOverM: -500, // Negative because electron has negative charge
  coulombK: 1000, // Scaled Coulomb constant
  maxSpeed: 50, // Maximum speed in world units/second
  maxLaunchSpeed: 30, // Maximum launch speed
  launchSpeedScale: 8, // Multiplier for drag distance to speed
  
  // Simulation
  fixedTimestep: 1 / 120, // 120 Hz physics
  maxTrailLength: 150,
  
  // Electron
  electronRadius: 0.3,
  
  // Softening for point charges to avoid singularities
  softeningRadius: 0.5,
};

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  showFieldVectors: false,
  showTrajectoryPreview: false,
  fieldGridSpacing: 2, // World units between field vector arrows
  previewSteps: 300, // Number of simulation steps for preview
};
