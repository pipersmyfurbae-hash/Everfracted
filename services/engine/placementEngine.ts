import { EngineBlueprint, EngineElement, Role } from '../../types';

const ROLE_PRIORITY: Record<Role, number> = {
  focal: 0,
  secondary: 1,
  accent: 2,
  filler: 3,
  greenery: 4,
};

/** Stable FNV-1a seed hash; identical blueprints produce identical layouts. */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32 gives a compact deterministic pseudo-random stream. */
function createRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSpread(random: () => number, spread: number): number {
  return (random() - 0.5) * spread;
}

function randomRange(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

function normalize(theta: number): number {
  return (theta + 360) % 360;
}

function isInsideOpenArc(theta: number, arc: [number, number]): boolean {
  const [start, end] = arc;
  // [0, 0] is the canonical "no silence arc" representation.
  if (start === end) return false;
  if (start <= end) return theta >= start && theta <= end;
  return theta >= start || theta <= end;
}

function radiusToLayer(radius: number): 'inner' | 'mid' | 'outer' | 'edge' {
  if (radius < 0.4) return 'inner';
  if (radius < 0.7) return 'mid';
  if (radius < 0.9) return 'outer';
  return 'edge';
}

function roleToScale(role: Role): number {
  switch (role) {
    case 'focal': return 1.3;
    case 'secondary': return 1.0;
    case 'accent': return 0.8;
    case 'filler': return 0.65;
    case 'greenery': return 0.72;
  }
}

/**
 * Creates a deterministic role sequence that honors the 60/30/10 composition
 * principle: 60% greenery, 30% secondary/filler, and 10% focal/accent.
 */
function buildRolePlan(total: number, random: () => number): Role[] {
  const focal = Math.max(1, Math.round(total * 0.05));
  const accent = Math.max(1, Math.round(total * 0.05));
  const secondary = Math.max(1, Math.round(total * 0.18));
  const filler = Math.max(1, Math.round(total * 0.12));
  const greenery = Math.max(0, total - focal - accent - secondary - filler);
  const roles: Role[] = [
    ...Array<Role>(focal).fill('focal'),
    ...Array<Role>(accent).fill('accent'),
    ...Array<Role>(secondary).fill('secondary'),
    ...Array<Role>(filler).fill('filler'),
    ...Array<Role>(greenery).fill('greenery'),
  ];

  // Deterministic Fisher–Yates shuffle prevents roles from pooling in early clusters.
  for (let index = roles.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [roles[index], roles[swap]] = [roles[swap], roles[index]];
  }
  return roles;
}

function getCollisionThreshold(role: Role, blueprint: EngineBlueprint): number {
  const collision = blueprint.constraints?.collision;
  if (role === 'greenery') return 4;
  return collision?.[role] || (role === 'filler' ? 6 : 8);
}

function angularDistance(a: number, b: number): number {
  const difference = Math.abs(a - b);
  return Math.min(difference, 360 - difference);
}

/**
 * Greenery is a structural underlayer rather than a competing bloom. It may
 * share an arc with focal or secondary material at its smaller spacing radius;
 * bloom-to-bloom pairs retain the larger collision threshold.
 */
function requiredAngularSpacing(left: Role, right: Role, blueprint: EngineBlueprint): number {
  if (left === 'greenery' || right === 'greenery') return getCollisionThreshold('greenery', blueprint);
  return Math.max(getCollisionThreshold(left, blueprint), getCollisionThreshold(right, blueprint));
}

function radialClearance(role: Role): number {
  if (role === 'focal') return 0.12;
  if (role === 'secondary') return 0.08;
  if (role === 'accent') return 0.06;
  if (role === 'filler') return 0.04;
  return 0.035;
}

function requiredRadialClearance(left: Role, right: Role): number {
  if (left === 'greenery' || right === 'greenery') return radialClearance('greenery');
  return Math.max(radialClearance(left), radialClearance(right));
}

function resolveCollisions(elements: EngineElement[], blueprint: EngineBlueprint): EngineElement[] {
  // Larger or visually dominant roles secure placement before low-weight material.
  const priorityOrdered = [...elements].sort((left, right) => ROLE_PRIORITY[left.role] - ROLE_PRIORITY[right.role]);
  const result: EngineElement[] = [];

  for (const element of priorityOrdered) {
    const collides = result.some((existing) => {
      const angularConflict = angularDistance(element.theta, existing.theta) < requiredAngularSpacing(
        element.role,
        existing.role,
        blueprint,
      );
      const radialConflict = Math.abs(element.radius - existing.radius) < requiredRadialClearance(element.role, existing.role);
      return angularConflict && radialConflict;
    });
    if (!collides) result.push(element);
  }

  return result.sort((left, right) => left.theta - right.theta);
}

/**
 * Generate seeded polar-coordinate placements. Cluster centers shape the
 * silhouette; role allocation preserves an approximate 60/30/10 hierarchy;
 * collision resolution preserves high-weight focal clarity.
 */
export function generatePlacement(blueprint: EngineBlueprint): EngineElement[] {
  const random = createRandom(blueprint.seed || blueprint.id);
  const clusterCount = Math.max(1, blueprint.clusters.length);
  const maxElements = Math.max(clusterCount, blueprint.constraints?.max_elements || 80);
  const clusterPlans = blueprint.clusters.map((cluster, clusterIndex) => ({
    cluster,
    clusterIndex,
    elementCount: Math.max(1, Math.round((maxElements / clusterCount) * Math.max(0.1, Math.min(cluster.density, 1)))),
  }));
  const totalPlanned = clusterPlans.reduce((sum, item) => sum + item.elementCount, 0);
  const roles = buildRolePlan(totalPlanned, random);
  const placed: EngineElement[] = [];
  let roleIndex = 0;

  for (const { cluster, clusterIndex, elementCount } of clusterPlans) {
    for (let index = 0; index < elementCount; index += 1) {
      const theta = normalize(cluster.center + randomSpread(random, cluster.spread));
      const role = roles[roleIndex] || 'greenery';
      roleIndex += 1;
      if (isInsideOpenArc(theta, blueprint.open_arc)) continue;

      // Focal and secondary elements sit nearer the working radius; greenery
      // receives a broader outer range to preserve silhouette and flow.
      const radius = role === 'focal'
        ? randomRange(random, 0.68, 0.82)
        : role === 'secondary'
          ? randomRange(random, 0.64, 0.88)
          : role === 'greenery'
            ? randomRange(random, 0.7, 0.98)
            : randomRange(random, 0.6, 0.94);

      placed.push({
        id: `el_${clusterIndex}_${index}`,
        role,
        theta,
        radius,
        layer: radiusToLayer(radius),
        scale: roleToScale(role),
        rotation: randomRange(random, -20, 20),
      });
    }
  }

  return resolveCollisions(placed, blueprint);
}
