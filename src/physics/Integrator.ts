/**
 * Physics integrator using semi-implicit Euler method
 */

import { Vector2, FieldSource, GameConfig } from '../types';
import { Vec2 } from '../utils/math';
import { evaluateFields } from './Fields';

export interface IntegrationResult {
  position: Vector2;
  velocity: Vector2;
}

/**
 * Semi-implicit Euler integration step
 * More stable than explicit Euler for oscillatory systems
 */
export function integrateStep(
  position: Vector2,
  velocity: Vector2,
  sources: FieldSource[],
  config: GameConfig,
  dt: number
): IntegrationResult {
  // Evaluate fields at current position
  const { E, B } = evaluateFields(position, sources, config);
  
  // Calculate acceleration from Lorentz force: F = q(E + v × B)
  // In 2D with B in z-direction:
  // a_x = (q/m)(E_x + v_y * B_z)
  // a_y = (q/m)(E_y - v_x * B_z)
  const qOverM = config.qOverM;
  
  const ax = qOverM * (E.x - velocity.y * B);
  const ay = qOverM * (E.y + velocity.x * B);
  
  const acceleration = { x: ax, y: ay };
  
  // Semi-implicit Euler: update velocity first, then use new velocity for position
  let newVelocity = Vec2.add(velocity, Vec2.scale(acceleration, dt));
  
  // Clamp velocity to max speed
  newVelocity = Vec2.clampLength(newVelocity, config.maxSpeed);
  
  // Update position using new velocity
  const newPosition = Vec2.add(position, Vec2.scale(newVelocity, dt));
  
  return {
    position: newPosition,
    velocity: newVelocity,
  };
}

/**
 * Simulate multiple steps and return trajectory
 * Useful for trajectory preview
 */
export function simulateTrajectory(
  startPosition: Vector2,
  startVelocity: Vector2,
  sources: FieldSource[],
  config: GameConfig,
  steps: number,
  dt: number = config.fixedTimestep
): Vector2[] {
  const trajectory: Vector2[] = [Vec2.copy(startPosition)];
  
  let position = Vec2.copy(startPosition);
  let velocity = Vec2.copy(startVelocity);
  
  for (let i = 0; i < steps; i++) {
    const result = integrateStep(position, velocity, sources, config, dt);
    position = result.position;
    velocity = result.velocity;
    
    trajectory.push(Vec2.copy(position));
    
    // Stop if out of bounds
    if (
      position.x < 0 ||
      position.x > config.worldWidth ||
      position.y < 0 ||
      position.y > config.worldHeight
    ) {
      break;
    }
  }
  
  return trajectory;
}
