/**
 * Main Game class - orchestrates the game loop, state, and systems
 */

import { GameState, GameConfig, RenderOptions, LevelDefinition, Vector2 } from '../types';
import { Vec2 } from '../utils/math';
import { DEFAULT_CONFIG, DEFAULT_RENDER_OPTIONS } from '../config';
import { Input } from './Input';
import { Electron } from '../game/entities/Electron';
import { Renderer } from '../game/render/Renderer';
import { getLevel, getLevelCount } from '../game/levels';
import { simulateTrajectory } from '../physics/Integrator';

export class Game {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private renderOptions: RenderOptions;
  
  private input: Input;
  private renderer: Renderer;
  private electron: Electron;
  
  private state: GameState = 'aiming';
  private currentLevel: LevelDefinition;
  private currentLevelIndex: number = 1;
  private shotsRemaining: number = 0;
  private tries: number = 0;
  
  private lastTime: number = 0;
  private accumulator: number = 0;
  
  // Callbacks for UI updates
  private onStateChange?: (state: GameState, message?: string) => void;
  private onShotsChange?: (shots: number) => void;
  private onLevelChange?: (level: LevelDefinition) => void;
  private onAimChange?: (speedPercent: number, angleDegrees: number) => void;
  private onTriesChange?: (tries: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this._ctx = ctx;
    
    this.config = { ...DEFAULT_CONFIG };
    this.renderOptions = { ...DEFAULT_RENDER_OPTIONS };
    
    // Initialize systems
    this.input = new Input(canvas, this.config.pixelsPerUnit);
    this.renderer = new Renderer(ctx, this.config);
    this.electron = new Electron(this.config);
    
    // Load first level
    const level = getLevel(1);
    if (!level) throw new Error('Could not load level 1');
    this.currentLevel = level;
    this.shotsRemaining = level.maxShots;
  }

  /**
   * Start the game loop
   */
  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * Main game loop
   */
  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Accumulate time for fixed timestep physics
    this.accumulator += deltaTime;
    
    // Update physics at fixed timestep
    while (this.accumulator >= this.config.fixedTimestep) {
      this.update(this.config.fixedTimestep);
      this.accumulator -= this.config.fixedTimestep;
    }
    
    // Render
    this.render();
    
    requestAnimationFrame(this.gameLoop);
  };

  /**
   * Update game state
   */
  private update(dt: number): void {
    if (this.state === 'simulating') {
      // Update electron physics
      this.electron.update(this.currentLevel.sources, dt);
      
      // Check win condition
      if (this.electron.hitTarget(
        this.currentLevel.target.x,
        this.currentLevel.target.y,
        this.currentLevel.target.radius
      )) {
        this.state = 'win';
        this.onStateChange?.('win', 'Target hit!');
        return;
      }
      
      // Check fail condition (out of bounds)
      if (this.electron.isOutOfBounds()) {
        this.electron.reset();
        this.state = 'aiming';
        return;
      }
    }
    
    if (this.state === 'aiming') {
      // Check for launch - can click anywhere
      const drag = this.input.consumeDrag();
      if (drag) {
        this.launchElectron(drag.vector);
      }
    }
  }

  /**
   * Launch the electron
   */
  private launchElectron(dragVector: Vector2): void {
    // Direct velocity: launch in the direction of the drag
    const launchVelocity = Vec2.scale(dragVector, this.config.launchSpeedScale);
    const clampedVelocity = Vec2.clampLength(launchVelocity, this.config.maxLaunchSpeed);
    
    if (Vec2.length(clampedVelocity) < 0.5) return; // Ignore tiny drags
    
    this.electron.launch(this.currentLevel.launchPoint, clampedVelocity);
    this.tries++;
    this.onTriesChange?.(this.tries);
    this.onShotsChange?.(this.shotsRemaining);
    this.state = 'simulating';
  }

  /**
   * Render the game
   */
  private render(): void {
    this.renderer.clear();
    this.renderer.drawGrid();
    
    // Draw magnetic regions first (background)
    for (const source of this.currentLevel.sources) {
      if (source.type === 'B_region') {
        this.renderer.drawFieldSources([source]);
      }
    }
    
    // Draw uniform E fields
    for (const source of this.currentLevel.sources) {
      if (source.type === 'uniform_E') {
        this.renderer.drawFieldSources([source]);
      }
    }
    
    // Draw field vectors if enabled
    if (this.renderOptions.showFieldVectors) {
      this.renderer.drawFieldVectors(
        this.currentLevel.sources,
        this.renderOptions,
        this.currentLevel.id
      );
    }
    
    // Draw target
    this.renderer.drawTarget(
      this.currentLevel.target.x,
      this.currentLevel.target.y,
      this.currentLevel.target.radius
    );
    
    // Draw charge sources (on top of background)
    for (const source of this.currentLevel.sources) {
      if (source.type === 'point_charge' || source.type === 'line_charge' || source.type === 'dipole') {
        this.renderer.drawFieldSources([source]);
      }
    }
    
    // Draw launch point
    this.renderer.drawLaunchPoint(this.currentLevel.launchPoint);
    
    // Draw instruction message for level 1
    if (this.currentLevel.id === 1) {
      this.renderer.drawInstructionMessage('Click and drag to aim and shoot the electron');
    }
    
    // Draw aiming vector when dragging
    if (this.state === 'aiming') {
      const inputState = this.input.getState();
      if (inputState.isMouseDown && inputState.dragStart && inputState.dragCurrent) {
        const dragVector = Vec2.sub(inputState.dragCurrent, inputState.dragStart);
        this.renderer.drawAimingVector(this.currentLevel.launchPoint, dragVector);
        
        // Update HUD with aiming info
        const aimInfo = this.renderer.getAimingInfo(dragVector);
        this.onAimChange?.(aimInfo.speedPercent, aimInfo.angleDegrees);
        
        // Draw trajectory preview if enabled
        if (this.renderOptions.showTrajectoryPreview) {
          const launchVelocity = Vec2.clampLength(
            Vec2.scale(dragVector, this.config.launchSpeedScale),
            this.config.maxLaunchSpeed
          );
          const trajectory = simulateTrajectory(
            this.currentLevel.launchPoint,
            launchVelocity,
            this.currentLevel.sources,
            this.config,
            this.renderOptions.previewSteps
          );
          this.renderer.drawTrajectoryPreview(trajectory);
        }
      } else {
        // Reset aim display when not dragging
        this.onAimChange?.(0, 0);
      }
    }
    
    // Draw electron if active
    if (this.electron.isActive()) {
      this.renderer.drawElectron(this.electron.getPosition(), this.electron.getTrail());
      
      // Draw force vector on electron if field vectors are shown
      if (this.renderOptions.showFieldVectors) {
        this.renderer.drawForceVector(this.electron.getPosition(), this.currentLevel.sources);
      }
    }
  }

  /**
   * Load a level by index
   */
  loadLevel(levelIndex: number): void {
    const level = getLevel(levelIndex);
    if (!level) {
      console.error(`Level ${levelIndex} not found`);
      return;
    }
    
    this.currentLevel = level;
    this.currentLevelIndex = levelIndex;
    this.shotsRemaining = level.maxShots;
    this.tries = 0;
    this.electron.reset();
    this.input.clearDrag();
    this.state = 'aiming';
    this.renderer.clearFieldCache();
    
    // Reset render options when changing levels
    this.renderOptions.showFieldVectors = false;
    this.renderOptions.showTrajectoryPreview = false;
    
    this.onLevelChange?.(level);
    this.onShotsChange?.(this.shotsRemaining);
    this.onTriesChange?.(this.tries);
    this.onStateChange?.('aiming');
  }

  /**
   * Reset current level (preserves tries count)
   */
  resetLevel(): void {
    const currentTries = this.tries;
    this.loadLevel(this.currentLevelIndex);
    this.tries = currentTries;
    this.onTriesChange?.(this.tries);
  }

  /**
   * Go to next level
   */
  nextLevel(): void {
    if (this.currentLevelIndex < getLevelCount()) {
      this.loadLevel(this.currentLevelIndex + 1);
    }
  }

  /**
   * Toggle field visualization
   */
  toggleFieldVectors(): boolean {
    this.renderOptions.showFieldVectors = !this.renderOptions.showFieldVectors;
    return this.renderOptions.showFieldVectors;
  }

  /**
   * Toggle trajectory preview
   */
  toggleTrajectoryPreview(): boolean {
    this.renderOptions.showTrajectoryPreview = !this.renderOptions.showTrajectoryPreview;
    return this.renderOptions.showTrajectoryPreview;
  }

  /**
   * Get current level info
   */
  getCurrentLevel(): LevelDefinition {
    return this.currentLevel;
  }

  /**
   * Get current level index
   */
  getCurrentLevelIndex(): number {
    return this.currentLevelIndex;
  }

  /**
   * Get total level count
   */
  getTotalLevels(): number {
    return getLevelCount();
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return this.state;
  }

  /**
   * Get shots remaining
   */
  getShotsRemaining(): number {
    return this.shotsRemaining;
  }

  /**
   * Register callbacks
   */
  onStateChanged(callback: (state: GameState, message?: string) => void): void {
    this.onStateChange = callback;
  }

  onShotsChanged(callback: (shots: number) => void): void {
    this.onShotsChange = callback;
  }

  onLevelChanged(callback: (level: LevelDefinition) => void): void {
    this.onLevelChange = callback;
  }

  onAimChanged(callback: (speedPercent: number, angleDegrees: number) => void): void {
    this.onAimChange = callback;
  }

  onTriesChanged(callback: (tries: number) => void): void {
    this.onTriesChange = callback;
  }

  getTries(): number {
    return this.tries;
  }
}
