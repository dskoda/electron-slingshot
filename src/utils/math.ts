/**
 * Vector math utilities
 */

import { Vector2 } from '../types';

export const Vec2 = {
  create(x: number = 0, y: number = 0): Vector2 {
    return { x, y };
  },

  copy(v: Vector2): Vector2 {
    return { x: v.x, y: v.y };
  },

  add(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  sub(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  scale(v: Vector2, s: number): Vector2 {
    return { x: v.x * s, y: v.y * s };
  },

  dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  },

  length(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  lengthSquared(v: Vector2): number {
    return v.x * v.x + v.y * v.y;
  },

  normalize(v: Vector2): Vector2 {
    const len = Vec2.length(v);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  },

  distance(a: Vector2, b: Vector2): number {
    return Vec2.length(Vec2.sub(a, b));
  },

  distanceSquared(a: Vector2, b: Vector2): number {
    return Vec2.lengthSquared(Vec2.sub(a, b));
  },

  angle(v: Vector2): number {
    return Math.atan2(v.y, v.x);
  },

  fromAngle(angle: number, length: number = 1): Vector2 {
    return { x: Math.cos(angle) * length, y: Math.sin(angle) * length };
  },

  rotate(v: Vector2, angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos,
    };
  },

  lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  },

  clampLength(v: Vector2, maxLength: number): Vector2 {
    const len = Vec2.length(v);
    if (len <= maxLength) return Vec2.copy(v);
    return Vec2.scale(Vec2.normalize(v), maxLength);
  },

  zero(): Vector2 {
    return { x: 0, y: 0 };
  },
};

// Utility functions
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}
