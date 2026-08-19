import type { Cluster, EmotionProfile, WreathDNA } from '../../types';

export type FormulaTemplate = 'crescent' | 'focal-trio' | 'full-ring' | 'asymmetric-weight';

export type CompositionBrief = {
  title: string;
  intention: string;
  formula: FormulaTemplate;
  diameter: number;
  palette: string[];
  density: 'airy' | 'balanced' | 'full';
  seed: string;
};

function densityMultiplier(density: CompositionBrief['density']): number {
  if (density === 'airy') return 0.72;
  if (density === 'full') return 1;
  return 0.86;
}

function scaleDensity(clusters: Cluster[], density: CompositionBrief['density']): Cluster[] {
  const factor = densityMultiplier(density);
  return clusters.map((cluster) => ({ ...cluster, density: Math.min(1, cluster.density * factor) }));
}

function templateClusters(formula: FormulaTemplate, density: CompositionBrief['density']): { clusters: Cluster[]; openArc: [number, number] } {
  switch (formula) {
    case 'full-ring':
      return {
        clusters: scaleDensity([
          { center: 0, spread: 78, density: 0.95 },
          { center: 90, spread: 78, density: 0.95 },
          { center: 180, spread: 78, density: 0.95 },
          { center: 270, spread: 78, density: 0.95 },
        ], density),
        openArc: [0, 0],
      };
    case 'focal-trio':
      return {
        clusters: scaleDensity([
          { center: 60, spread: 76, density: 0.95 },
          { center: 180, spread: 88, density: 1 },
          { center: 300, spread: 76, density: 0.95 },
        ], density),
        openArc: [0, 0],
      };
    case 'asymmetric-weight':
      return {
        clusters: scaleDensity([
          { center: 155, spread: 82, density: 1 },
          { center: 220, spread: 78, density: 0.95 },
          { center: 285, spread: 54, density: 0.7 },
          { center: 55, spread: 42, density: 0.45 },
        ], density),
        openArc: [320, 25],
      };
    case 'crescent':
    default:
      return {
        clusters: scaleDensity([
          { center: 105, spread: 60, density: 0.72 },
          { center: 165, spread: 86, density: 1 },
          { center: 230, spread: 76, density: 0.92 },
          { center: 285, spread: 44, density: 0.55 },
        ], density),
        openArc: [315, 45],
      };
  }
}

export function createWreathDNA(brief: CompositionBrief): WreathDNA {
  const { clusters } = templateClusters(brief.formula, brief.density);
  return {
    cluster_count: clusters.length,
    cluster_weight_distribution: brief.formula === 'asymmetric-weight' || brief.formula === 'crescent' ? 0.68 : 0.5,
    cluster_spread_deg: Math.round(clusters.reduce((total, cluster) => total + cluster.spread, 0) / clusters.length),
    density_profile: brief.density === 'airy' ? 0.52 : brief.density === 'full' ? 0.9 : 0.72,
    greenery_direction: brief.formula === 'crescent' || brief.formula === 'asymmetric-weight' ? 'outward' : 'balanced',
    silhouette_bias: brief.formula === 'full-ring' || brief.formula === 'focal-trio' ? 'structured' : 'mixed',
    greenery_ratio: 0.6,
    focal_ratio: 0.05,
    silence_arc: brief.formula === 'full-ring' || brief.formula === 'focal-trio' ? 0 : 90,
    focal_depth: 0.82,
    style_signature: brief.density === 'airy' ? 'editorial' : 'abundant',
    color_bias: 'neutral',
  };
}

export function createCompositionInput(brief: CompositionBrief): {
  blueprint_id: string;
  seed: string;
  open_arc: [number, number];
  clusters: Cluster[];
  emotion_profile: EmotionProfile;
} {
  const { clusters, openArc } = templateClusters(brief.formula, brief.density);
  return {
    blueprint_id: `EC-${brief.seed.slice(0, 12).toUpperCase()}`,
    seed: brief.seed,
    open_arc: openArc,
    clusters,
    emotion_profile: {
      colors: brief.palette,
      contrast: brief.formula === 'asymmetric-weight' ? 'high' : 'medium',
      shapes: brief.formula === 'full-ring' ? 'rounded' : 'mixed',
      density: brief.density,
      textures: brief.formula === 'focal-trio' ? 'mixed' : 'soft',
      intent: brief.intention.toLowerCase(),
    },
  };
}
