import assert from 'node:assert/strict';
import { compileBlueprint } from '../services/orchestration/blueprintCompiler';
import { runOrchestrator } from '../services/BlueprintOrchestrator';
import { createBlueprintSeed } from '../services/deterministicSeed';
import { createCompositionInput, createWreathDNA, type CompositionBrief, type FormulaTemplate } from '../services/engine/compositionTemplates';
import type { InventoryItem } from '../types';

const inventory: InventoryItem[] = [
  { id: 'cedar', sku: 'CED-001', name: 'Cedar spray', category: 'greenery', color: 'green', stock: 18, role: 'greenery' },
  { id: 'rose', sku: 'ROS-001', name: 'Garden rose', category: 'floral', color: 'ivory', stock: 6, role: 'focal' },
  { id: 'ranunculus', sku: 'RAN-001', name: 'Ranunculus', category: 'floral', color: 'blush', stock: 10, role: 'secondary' },
];

const formulae: FormulaTemplate[] = ['crescent', 'focal-trio', 'full-ring', 'asymmetric-weight'];

for (const formula of formulae) {
  const seed = createBlueprintSeed('A quiet winter welcome', inventory, formula);
  const repeatSeed = createBlueprintSeed('A quiet winter welcome', [...inventory].reverse(), formula);
  assert.equal(seed, repeatSeed, 'Inventory order must not change the deterministic seed.');

  const brief: CompositionBrief = {
    title: 'Quiet Winter Welcome',
    intention: 'calm warmth with a measured evergreen rhythm',
    formula,
    diameter: 24,
    palette: ['evergreen', 'ivory', 'golden'],
    density: 'full',
    seed,
  };
  const raw = createCompositionInput(brief);
  const dna = createWreathDNA(brief);
  const first = compileBlueprint(raw, formula, dna, brief.diameter, inventory);
  const second = compileBlueprint(raw, formula, dna, brief.diameter, inventory);
  const { report } = await runOrchestrator(first, raw.emotion_profile);

  assert.equal(first.seed, seed, 'Compiled blueprint must retain the brief seed.');
  assert.ok(first.clusters.length > 0, 'Every formula template must define clusters.');
  assert.ok(first.elements.length > 0, 'Every formula template must produce placement elements.');
  assert.deepEqual(first.elements, second.elements, 'Same deterministic brief must compile to identical element placement.');
  assert.ok(first.elements.every((element) => element.theta >= 0 && element.theta < 360), 'Every element must have a normalized polar angle.');
  assert.ok(Number.isFinite(report.total), 'Every compiled blueprint must receive a finite quality score.');

  if (raw.open_arc[0] !== raw.open_arc[1]) {
    const [start, end] = raw.open_arc;
    const insideSilenceArc = (theta: number) => start <= end ? theta >= start && theta <= end : theta >= start || theta <= end;
    assert.ok(first.elements.every((element) => !insideSilenceArc(element.theta)), 'Formula silence arcs must remain clear after placement.');
  }
}

const changedInputSeed = createBlueprintSeed('A dramatic winter welcome', inventory, 'crescent');
const originalSeed = createBlueprintSeed('A quiet winter welcome', inventory, 'crescent');
assert.notEqual(changedInputSeed, originalSeed, 'Changed emotional brief must create a new deterministic seed.');

console.log('Maker workflow tests passed: deterministic seeds, formula geometry, polar placement, silence arcs, and quality reporting verified.');
