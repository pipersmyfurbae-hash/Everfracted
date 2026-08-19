import type { InventoryItem } from '../types';

function fnv1a(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, '0');
}

export function inventorySignature(inventory: InventoryItem[]): string {
  return inventory
    .map((item) => ({ sku: item.sku || item.id, qty: item.quantity ?? item.stock ?? 0, role: item.role }))
    .sort((left, right) => `${left.sku}:${left.role}`.localeCompare(`${right.sku}:${right.role}`))
    .map((item) => `${item.sku}:${item.role}:${item.qty}`)
    .join('|');
}

/**
 * Canonical seed rule from the composition PRD: memory/brief + inventory +
 * formula. This keeps an approved brief reproducible across previews, repair
 * passes, builder guides, and later public listing references.
 */
export function createBlueprintSeed(memoryInput: string, inventory: InventoryItem[], formulaId: string): string {
  const normalizedMemory = memoryInput.trim().toLowerCase().replace(/\s+/g, ' ');
  return fnv1a(`${normalizedMemory}::${inventorySignature(inventory)}::${formulaId}`);
}
