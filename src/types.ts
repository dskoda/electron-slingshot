/**
 * Core types for the Electron Slingshot game
 */

// 2D Vector type
export interface Vector2 {
  x: number;
  y: number;
}

// Game state
export type GameState = 'aiming' | 'simulating' | 'win' | 'fail' | 'menu';

// Field source types
export interface PointChargeSource {
  type: 'point_charge';
  position: Vector2;
  charge: number; // positive = positive charge, negative = negative charge
}

export interface UniformEFieldSource {
  type: 'uniform_E';
  field: Vector2; // E-field vector
  region?: Rectangle; // optional region, if undefined applies everywhere
}

export interface LineChargeSource {
  type: 'line_charge';
  start: Vector2;
  end: Vector2;
  chargeDensity: number; // charge per unit length
  segments?: number; // number of segments for approximation (default 10)
}

export interface MagneticRegionSource {
  type: 'B_region';
  region: Rectangle;
  Bz: number; // magnetic field strength (out of page positive)
}

export interface DipoleSource {
  type: 'dipole';
  positive: Vector2;
  negative: Vector2;
  charge: number; // magnitude of each charge
}

export type FieldSource = 
  | PointChargeSource 
  | UniformEFieldSource 
  | LineChargeSource 
  | MagneticRegionSource
  | DipoleSource;

// Geometry
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

// Obstacle types
export interface WallObstacle {
  type: 'wall';
  rect: Rectangle;
}

export type Obstacle = WallObstacle;

// Level definition
export interface LevelDefinition {
  id: number;
  name: string;
  description: string;
  hint: string;
  learningObjective: string;
  
  // Game setup
  launchPoint: Vector2;
  target: Circle;
  maxShots: number;
  
  // Field sources
  sources: FieldSource[];
  
  // Obstacles
  obstacles?: Obstacle[];
  
  // World bounds (optional, defaults to canvas size)
  bounds?: Rectangle;
}

// Electron state
export interface ElectronState {
  position: Vector2;
  velocity: Vector2;
  trail: Vector2[];
  active: boolean;
}

// Input state
export interface InputState {
  mousePosition: Vector2;
  isMouseDown: boolean;
  dragStart: Vector2 | null;
  dragCurrent: Vector2 | null;
}

// Game configuration
export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  worldWidth: number;
  worldHeight: number;
  pixelsPerUnit: number;
  
  // Physics constants (scaled for gameplay)
  qOverM: number; // charge-to-mass ratio (scaled)
  coulombK: number; // Coulomb constant (scaled)
  maxSpeed: number;
  maxLaunchSpeed: number;
  launchSpeedScale: number;
  
  // Simulation
  fixedTimestep: number;
  maxTrailLength: number;
  
  // Electron
  electronRadius: number;
  
  // Softening for point charges
  softeningRadius: number;
}

// Rendering options
export interface RenderOptions {
  showFieldVectors: boolean;
  showTrajectoryPreview: boolean;
  fieldGridSpacing: number;
  previewSteps: number;
}
