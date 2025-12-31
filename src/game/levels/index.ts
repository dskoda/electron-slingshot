/**
 * Level definitions - 10 progressive levels teaching electrostatics
 */

import { LevelDefinition } from '../../types';

export const LEVELS: LevelDefinition[] = [
  // Level 1: Ballistics baseline - no fields
  {
    id: 1,
    name: "Ballistics Baseline",
    description: "Learn to aim! No fields here - just point and shoot.",
    hint: "Drag from the launch point toward the target. The arrow shows your shot direction and speed.",
    learningObjective: "Master the launch controls before adding electric fields.",
    launchPoint: { x: 5, y: 10 },
    target: { x: 27, y: 10, radius: 1.5 },
    maxShots: 5,
    sources: [],
    obstacles: [],
  },

  // Level 2: Uniform E-field (gravity analog)
  {
    id: 2,
    name: "Electric Gravity",
    description: "A uniform electric field pushes electrons down - like gravity!",
    hint: "The downward E-field curves your path. Aim higher than the target!",
    learningObjective: "Uniform electric fields create constant acceleration, like gravity.",
    launchPoint: { x: 3, y: 15 },
    target: { x: 27, y: 8, radius: 1.3 },
    maxShots: 5,
    sources: [
      {
        type: 'uniform_E',
        field: { x: 0, y: 0.1 }, // Pushes electrons down (they're negative)
      },
    ],
    obstacles: [],
  },

  // Level 3: Single repelling charge
  {
    id: 3,
    name: "Deflection Zone",
    description: "A negative charge repels the electron. Navigate around it!",
    hint: "Negative charges repel electrons. Aim to curve around the charge.",
    learningObjective: "Like charges repel - the electron bends away from negative charges.",
    launchPoint: { x: 3, y: 10 },
    target: { x: 27, y: 10, radius: 1.5 },
    maxShots: 5,
    sources: [
      {
        type: 'point_charge',
        position: { x: 20, y: 15 },
        charge: -0.003, // Negative charge repels electron
      },
      {
        type: 'point_charge',
        position: { x: 7, y: 3 },
        charge: -0.003,
      },
    ],
    obstacles: [],
  },

  // Level 4: Attractive well
  {
    id: 4,
    name: "Attractive Well",
    description: "A positive charge attracts the electron. Don't crash into it!",
    hint: "Positive charges attract electrons. Use just enough speed to swing by!",
    learningObjective: "Opposite charges attract - electrons are pulled toward positive charges.",
    launchPoint: { x: 3, y: 10 },
    target: { x: 27, y: 10, radius: 1.5 },
    maxShots: 5,
    sources: [
      {
        type: 'point_charge',
        position: { x: 15, y: 10 },
        charge: 0.005,
      },
      {
        type: 'point_charge',
        position: { x: 15, y: 20 },
        charge: 0.005,
      },
      {
        type: 'point_charge',
        position: { x: 15, y: 0 },
        charge: 0.005,
      },
    ],
    obstacles: [],
  },

  // Level 5: Dipole gate
  {
    id: 5,
    name: "Dipole Gate",
    description: "Navigate between a positive and negative charge pair.",
    hint: "The dipole creates a channel - the electron is pushed and pulled through the gap!",
    learningObjective: "Dipoles create electric field that are the superposition of the point charge fields.",
    launchPoint: { x: 3, y: 10 },
    target: { x: 27, y: 10, radius: 1.5 },
    maxShots: 5,
    sources: [
      {
        type: 'dipole',
        positive: { x: 15, y: 7 },
        negative: { x: 15, y: 13 },
        charge: 0.01,
      },
    ],
    obstacles: [],
  },

  // Level 6: Multi-charge maze
  {
    id: 6,
    name: "Charge Maze",
    description: "Multiple charges create a complex field. Find the path!",
    hint: "Each charge contributes to the total field - watch for superposition effects!",
    learningObjective: "Electric fields superpose - the total field is the sum of fields from all sources.",
    launchPoint: { x: 3, y: 10 },
    target: { x: 27, y: 12, radius: 1.1 },
    maxShots: 6,
    sources: [
      { type: 'point_charge', position: { x: 10, y: 6 }, charge: -0.002 },
      { type: 'point_charge', position: { x: 10, y: 14 }, charge: -0.002 },
      { type: 'point_charge', position: { x: 20, y: 10 }, charge: 0.0015 },
      { type: 'point_charge', position: { x: 18, y: 8 }, charge: 0.0015 },
      { type: 'point_charge', position: { x: 18, y: 17 }, charge: -0.0015 },
      { type: 'point_charge', position: { x: 24, y: 18 }, charge: 0.0015 },
    ],
    obstacles: [],
  },

  // Level 7: Magnetic region
  {
    id: 7,
    name: "Magnetic Deflection",
    description: "Enter a magnetic field region and watch the electron curve!",
    hint: "Magnetic fields curve moving charges without changing their speed. The Lorentz force is perpendicular to velocity!",
    learningObjective: "Magnetic fields exert force perpendicular to velocity, causing circular motion.",
    launchPoint: { x: 3, y: 5 },
    target: { x: 27, y: 15, radius: 1.5 },
    maxShots: 5,
    sources: [
      {
        type: 'B_region',
        region: { x: 8, y: 0, width: 14, height: 20 },
        Bz: -0.005, // Positive = out of page, curves right for electron moving right
      },
    ],
    obstacles: [],
  },

  // Level 8: Combined E + B
  {
    id: 8,
    name: "E × B Drift",
    description: "Electric and magnetic fields together - master both forces!",
    hint: "E accelerates, B curves. Time your entry carefully!",
    learningObjective: "Combined E and B fields create complex trajectories from the Lorentz force.",
    launchPoint: { x: 3, y: 10 },
    target: { x: 27, y: 10, radius: 1.3 },
    maxShots: 6,
    sources: [
      {
        type: 'uniform_E',
        field: { x: 0, y: 0.2 },
        region: { x: 0, y: 0, width: 10, height: 20 },
      },
      {
        type: 'uniform_E',
        field: { x: -0.2, y: 0.0 },
        region: { x: 10.0, y: 0, width: 5, height: 6 },
      },
      {
        type: 'B_region',
        region: { x: 15, y: 0, width: 15, height: 20 },
        Bz: -0.01,
      },
    ],
    obstacles: [],
  },

  // Level 9: Line charge (charge distribution)
  {
    id: 9,
    name: "Charged Rod",
    description: "A line of charge creates a spreading field pattern.",
    hint: "The field from a line charge spreads radially outward - curve around it!",
    learningObjective: "Charge distributions create more complex field patterns.",
    launchPoint: { x: 3, y: 10 },
    target: { x: 27, y: 5, radius: 1.3 },
    maxShots: 5,
    sources: [
      {
        type: 'line_charge',
        start: { x: 15, y: 2 },
        end: { x: 15, y: 12 },
        chargeDensity: -0.0008,
        segments: 15,
      },
      {
        type: 'B_region',
        region: { x: 7.5, y: 0, width: 15, height: 20 },
        Bz: 0.01,
      },
    ],
    obstacles: [],
  },

  // Level 10: Master challenge
  {
    id: 10,
    name: "Master Challenge",
    description: "Navigate the ultimate obstacle course.",
    hint: "Think about superposition, magnetic fields, and so on. Plan carefully.",
    learningObjective: "Combine all concepts: point charges, dipoles, line charges, and magnetic regions.",
    launchPoint: { x: 3, y: 10 },
    target: { x: 27, y: 15, radius: 1.0 },
    maxShots: 8,
    sources: [
      { type: 'point_charge', position: { x: 8, y: 5 }, charge: -0.002 },
      { type: 'point_charge', position: { x: 10, y: 12 }, charge: 0.002 },
      {
        type: 'B_region',
        region: { x: 12, y: 5, width: 6, height: 10 },
        Bz: 0.01,
      },
      {
        type: 'B_region',
        region: { x: 12, y: 15, width: 6, height: 10 },
        Bz: -0.01,
      },
      { type: 'point_charge', position: { x: 22, y: 10 }, charge: -0.001 },
      {
        type: 'uniform_E',
        field: { x: -0.05, y: -0.1 },
        region: { x: 22, y: 6, width: 8, height: 12 },
      },
      {
        type: 'line_charge',
        start: { x: 20, y: 4 },
        end: { x: 30, y: 4 },
        chargeDensity: 0.0008,
        segments: 10,
      },
    ],
    obstacles: [],
  },
];

/**
 * Get a level by ID (1-indexed)
 */
export function getLevel(id: number): LevelDefinition | undefined {
  return LEVELS.find(level => level.id === id);
}

/**
 * Get total number of levels
 */
export function getLevelCount(): number {
  return LEVELS.length;
}
