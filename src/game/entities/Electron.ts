/**
 * Electron entity - the player's projectile
 */

import { Vector2, ElectronState, FieldSource, GameConfig } from '../../types';
import { Vec2 } from '../../utils/math';
import { integrateStep } from '../../physics/Integrator';

export class Electron {
  private state: ElectronState;
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
    this.state = {
      position: Vec2.zero(),
      velocity: Vec2.zero(),
      trail: [],
      active: false,
    };
  }

  /**
   * Launch the electron from a position with initial velocity
   */
  launch(position: Vector2, velocity: Vector2): void {
    this.state.position = Vec2.copy(position);
    this.state.velocity = Vec2.clampLength(velocity, this.config.maxLaunchSpeed);
    this.state.trail = [Vec2.copy(position)];
    this.state.active = true;
  }

  /**
   * Reset the electron to inactive state
   */
  reset(): void {
    this.state.active = false;
    this.state.trail = [];
    this.state.velocity = Vec2.zero();
  }

  /**
   * Update the electron physics
   */
  update(sources: FieldSource[], dt: number): void {
    if (!this.state.active) return;

    const result = integrateStep(
      this.state.position,
      this.state.velocity,
      sources,
      this.config,
      dt
    );

    this.state.position = result.position;
    this.state.velocity = result.velocity;

    // Add to trail
    this.state.trail.push(Vec2.copy(this.state.position));
    
    // Limit trail length
    while (this.state.trail.length > this.config.maxTrailLength) {
      this.state.trail.shift();
    }
  }

  /**
   * Check if electron is out of bounds
   */
  isOutOfBounds(): boolean {
    const { x, y } = this.state.position;
    return (
      x < -1 ||
      x > this.config.worldWidth + 1 ||
      y < -1 ||
      y > this.config.worldHeight + 1
    );
  }

  /**
   * Check if electron hit a circular target
   */
  hitTarget(targetX: number, targetY: number, targetRadius: number): boolean {
    if (!this.state.active) return false;
    
    const dx = this.state.position.x - targetX;
    const dy = this.state.position.y - targetY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < targetRadius + this.config.electronRadius;
  }

  getPosition(): Vector2 {
    return this.state.position;
  }

  getVelocity(): Vector2 {
    return this.state.velocity;
  }

  getTrail(): Vector2[] {
    return this.state.trail;
  }

  isActive(): boolean {
    return this.state.active;
  }

  getState(): ElectronState {
    return this.state;
  }
}
