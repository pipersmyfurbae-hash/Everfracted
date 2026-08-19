import assert from 'node:assert/strict';
import { generatePlacement } from '../services/engine/placementEngine';
import type { EngineBlueprint } from '../types';

function makeBlueprint(overrides: Partial<EngineBlueprint> = {}): EngineBlueprint {
  return {
    id: 'bp-quiet-winter',
    seed: 'quiet-winter|inventory:cedar-12,rose-3|formula:crescent',
    formula: 'crescent',
    diameter: 24,
    open_arc: [280, 330],
    clusters: [
      { center: 60, spread: 34, density: 0.95 },
      { center: 150, spread: 46, density: 0.8 },
      { center: 220, spread: 52, density: 0.9 },
    ],
    elements: [],
    constraints: {
      max_elements: 60,
      collision: { focal: 18, secondary: 12, accent: 8, filler: 6 },
    },
    ...overrides,
  };
}

function angularDistance(left: number, right: number): number {
  const difference = Math.abs(left - right);
  return Math.min(difference, 360 - difference);
}

function threshold(role: string): number {
  if (role === 'greenery') return 4;
  if (role === 'filler') return 6;
  if (role === 'accent') return 8;
  if (role === 'secondary') return 12;
  return 18;
}

function requiredSpacing(left: string, right: string): number {
  if (left === 'greenery' || right === 'greenery') return 4;
  return Math.max(threshold(left), threshold(right));
}

function radialClearance(role: string): number {
  if (role === 'focal') return 0.12;
  if (role === 'secondary') return 0.08;
  if (role === 'accent') return 0.06;
  if (role === 'filler') return 0.04;
  return 0.035;
}

function requiredRadialClearance(left: string, right: string): number {
  if (left === 'greenery' || right === 'greenery') return 0.035;
  return Math.max(radialClearance(left), radialClearance(right));
}

const base = makeBlueprint();
const first = generatePlacement(base);
const second = generatePlacement(base);
assert.deepEqual(second, first, 'Identical seed and inputs must produce an identical placement sequence.');
assert.ok(first.length > 0, 'A clustered blueprint must produce placements.');

const differentSeed = generatePlacement(makeBlueprint({ seed: 'different-input-signature' }));
assert.notDeepEqual(differentSeed, first, 'A different seed must produce a different placement sequence.');

assert.ok(first.every((element) => element.theta >= 0 && element.theta < 360), 'Every theta must be normalized to [0, 360).');
assert.ok(first.every((element) => element.radius >= 0.6 && element.radius <= 0.98), 'Every placement radius must remain inside the configured working band.');
assert.ok(first.every((element) => !(element.theta >= 280 && element.theta <= 330)), 'No element may enter the enforced silence arc.');
assert.deepEqual([...first].map((element) => element.theta), [...first].map((element) => element.theta).sort((a, b) => a - b), 'Final placements must be sorted clockwise by theta.');

for (let left = 0; left < first.length; left += 1) {
  for (let right = left + 1; right < first.length; right += 1) {
    const required = requiredSpacing(first[left].role, first[right].role);
    const radialRequired = requiredRadialClearance(first[left].role, first[right].role);
    const sameAngularBand = angularDistance(first[left].theta, first[right].theta) < required;
    const sameRadialBand = Math.abs(first[left].radius - first[right].radius) < radialRequired;
    assert.ok(!(sameAngularBand && sameRadialBand), 'Collision resolution must separate colliding roles by angular or radial depth.');
  }
}

const roleCounts = first.reduce<Record<string, number>>((counts, element) => {
  counts[element.role] = (counts[element.role] || 0) + 1;
  return counts;
}, {});
assert.ok((roleCounts.focal || 0) >= 1, 'Every non-empty blueprint should retain at least one focal role.');
assert.ok((roleCounts.greenery || 0) >= (roleCounts.focal || 0), 'Greenery should remain at least as prevalent as focal material.');
assert.ok((roleCounts.secondary || 0) >= 1, 'The role plan should retain secondary hierarchy.');

const noOpenArc = generatePlacement(makeBlueprint({
  seed: 'theta-zero',
  open_arc: [0, 0],
  clusters: [{ center: 0, spread: 0, density: 0.2 }],
  constraints: { max_elements: 2, collision: { focal: 18, secondary: 12, accent: 8, filler: 6 } },
}));
assert.ok(noOpenArc.some((element) => element.theta === 0), '[0, 0] must mean no silence arc, not exclusion of 12 o’clock.');

console.log(`Placement engine tests passed: ${first.length} deterministic placements with ${roleCounts.greenery || 0} greenery, ${roleCounts.secondary || 0} secondary, and ${roleCounts.focal || 0} focal elements.`);
