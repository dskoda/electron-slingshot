/**
 * Field calculation utilities
 * Computes electric and magnetic fields from various sources
 */

import { Vector2, FieldSource, Rectangle, GameConfig } from '../types';
import { Vec2 } from '../utils/math';

/**
 * Result of field evaluation at a point
 */
export interface FieldResult {
  E: Vector2; // Electric field
  B: number;  // Magnetic field (z-component only, out of page)
}

/**
 * Check if a point is inside a rectangle
 */
function isInRectangle(point: Vector2, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Calculate electric field from a point charge at a given position
 */
function pointChargeField(
  position: Vector2,
  chargePos: Vector2,
  charge: number,
  config: GameConfig
): Vector2 {
  const r = Vec2.sub(position, chargePos);
  const rMagSq = Vec2.lengthSquared(r) + config.softeningRadius * config.softeningRadius;
  const rMag = Math.sqrt(rMagSq);
  
  if (rMag < 0.001) return Vec2.zero();
  
  // E = k * q * r / |r|^3
  const magnitude = (config.coulombK * charge) / (rMagSq * rMag);
  
  return Vec2.scale(r, magnitude);
}

/**
 * Calculate electric field from a line charge (approximated by segments)
 */
function lineChargeField(
  position: Vector2,
  start: Vector2,
  end: Vector2,
  chargeDensity: number,
  segments: number,
  config: GameConfig
): Vector2 {
  let E = Vec2.zero();
  
  for (let i = 0; i < segments; i++) {
    const t = (i + 0.5) / segments;
    const segmentPos = Vec2.lerp(start, end, t);
    const segmentCharge = chargeDensity * Vec2.distance(start, end) / segments;
    
    const segmentField = pointChargeField(position, segmentPos, segmentCharge, config);
    E = Vec2.add(E, segmentField);
  }
  
  return E;
}

/**
 * Evaluate total E and B fields at a position from all sources
 */
export function evaluateFields(
  position: Vector2,
  sources: FieldSource[],
  config: GameConfig
): FieldResult {
  let E = Vec2.zero();
  let B = 0;
  
  for (const source of sources) {
    switch (source.type) {
      case 'point_charge': {
        const field = pointChargeField(position, source.position, source.charge, config);
        E = Vec2.add(E, field);
        break;
      }
      
      case 'uniform_E': {
        // Check if in region (if defined)
        if (!source.region || isInRectangle(position, source.region)) {
          E = Vec2.add(E, source.field);
        }
        break;
      }
      
      case 'line_charge': {
        const segments = source.segments ?? 10;
        const field = lineChargeField(
          position,
          source.start,
          source.end,
          source.chargeDensity,
          segments,
          config
        );
        E = Vec2.add(E, field);
        break;
      }
      
      case 'B_region': {
        if (isInRectangle(position, source.region)) {
          B += source.Bz;
        }
        break;
      }
      
      case 'dipole': {
        // A dipole is just two point charges
        const posField = pointChargeField(position, source.positive, source.charge, config);
        const negField = pointChargeField(position, source.negative, -source.charge, config);
        E = Vec2.add(E, Vec2.add(posField, negField));
        break;
      }
    }
  }
  
  return { E, B };
}

/**
 * Generate a grid of field vectors for visualization
 */
export function generateFieldGrid(
  sources: FieldSource[],
  config: GameConfig,
  spacing: number
): { position: Vector2; field: Vector2 }[] {
  const grid: { position: Vector2; field: Vector2 }[] = [];
  
  for (let x = spacing / 2; x < config.worldWidth; x += spacing) {
    for (let y = spacing / 2; y < config.worldHeight; y += spacing) {
      const position = { x, y };
      const { E } = evaluateFields(position, sources, config);
      
      // Only include if field is significant
      if (Vec2.length(E) > 0.01) {
        grid.push({ position, field: E });
      }
    }
  }
  
  return grid;
}
