import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { normalizeMarketplaceCommerce, toPublicCommerce } from '../services/commerceMode';
import { ECOSYSTEM_SCHEMA } from '../services/ecosystemContracts';

const MIGRATION_ID = 'hybrid-commerce-v1';
const BATCH_LIMIT = 400;

type Mode = 'dry-run' | 'apply' | 'rollback';
type BackupRecord = { collection: 'marketplace_listings' | 'moodoor_public_listings'; documentId: string; original: Record<string, unknown> };

function modeFromArgs(args: string[]): Mode {
  const actions = args.filter((value) => value === '--apply' || value === '--rollback');
  if (actions.length > 1) throw new Error('Use only one of --apply or --rollback.');
  if (actions[0] === '--apply') return 'apply';
  if (actions[0] === '--rollback') return 'rollback';
  return 'dry-run';
}

function stableBackupId(collection: string, documentId: string): string {
  return `${collection}__${documentId}`.replace(/\//g, '_');
}

function existingMap(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

if (getApps().length === 0) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

const db = getFirestore();
const mode = modeFromArgs(process.argv.slice(2));

async function writeChunks<T>(items: T[], write: (batch: FirebaseFirestore.WriteBatch, item: T) => void): Promise<void> {
  for (let index = 0; index < items.length; index += BATCH_LIMIT) {
    const batch = db.batch();
    items.slice(index, index + BATCH_LIMIT).forEach((item) => write(batch, item));
    await batch.commit();
  }
}

async function rollback(): Promise<void> {
  const backupSnapshot = await db.collection('migration_backups').doc(MIGRATION_ID).collection('documents').get();
  if (backupSnapshot.empty) {
    console.log(`No backups found for ${MIGRATION_ID}; nothing to roll back.`);
    return;
  }

  const records = backupSnapshot.docs.map((entry) => entry.data() as BackupRecord);
  await writeChunks(records, (batch, record) => {
    batch.set(db.collection(record.collection).doc(record.documentId), record.original);
  });
  console.log(`Restored ${records.length} document(s) from ${MIGRATION_ID} backups. Backups were retained for audit and repeatability.`);
}

async function migrate(): Promise<void> {
  const [marketplaceSnapshot, publicSnapshot, backupSnapshot] = await Promise.all([
    db.collection('marketplace_listings').get(),
    db.collection('moodoor_public_listings').get(),
    db.collection('migration_backups').doc(MIGRATION_ID).collection('documents').get(),
  ]);
  const backupIds = new Set(backupSnapshot.docs.map((entry) => entry.id));
  const marketplaceById = new Map(marketplaceSnapshot.docs.map((entry) => [entry.id, entry.data()]));

  const canonicalChanges = marketplaceSnapshot.docs.flatMap((entry) => {
    const raw = entry.data();
    if (raw.commerceMigrationId === MIGRATION_ID) return [];
    const commerce = normalizeMarketplaceCommerce(raw.commerce) || { mode: 'enquiry', provider: null, variantId: null } as const;
    return [{ id: entry.id, raw, commerce }];
  });

  const projectionChanges = publicSnapshot.docs.flatMap((entry) => {
    const raw = entry.data();
    if (raw.commerceMigrationId === MIGRATION_ID) return [];
    const canonical = typeof raw.listingId === 'string' ? marketplaceById.get(raw.listingId) : undefined;
    const commerce = toPublicCommerce(canonical?.commerce || raw.commerce);
    return [{ id: entry.id, raw, commerce }];
  });

  console.log(`${mode}: ${canonicalChanges.length} canonical listing(s) and ${projectionChanges.length} public projection(s) require ${MIGRATION_ID}.`);
  if (mode === 'dry-run') {
    console.log('No documents were changed. Re-run with --apply after reviewing this count.');
    return;
  }

  const backups: BackupRecord[] = [
    ...canonicalChanges.map((change) => ({ collection: 'marketplace_listings' as const, documentId: change.id, original: change.raw })),
    ...projectionChanges.map((change) => ({ collection: 'moodoor_public_listings' as const, documentId: change.id, original: change.raw })),
  ];

  await writeChunks(backups.filter((record) => !backupIds.has(stableBackupId(record.collection, record.documentId))), (batch, record) => {
    batch.create(db.collection('migration_backups').doc(MIGRATION_ID).collection('documents').doc(stableBackupId(record.collection, record.documentId)), record);
  });

  await writeChunks(canonicalChanges, (batch, change) => {
    batch.update(db.collection('marketplace_listings').doc(change.id), {
      schemaVersion: ECOSYSTEM_SCHEMA.marketplaceListing,
      commerce: change.commerce,
      commerceMigrationId: MIGRATION_ID,
      commerceMigratedAt: new Date(),
    });
  });

  await writeChunks(projectionChanges, (batch, change) => {
    batch.update(db.collection('moodoor_public_listings').doc(change.id), {
      schemaVersion: ECOSYSTEM_SCHEMA.moodoorPublicListing,
      commerce: change.commerce,
      commerceMigrationId: MIGRATION_ID,
      commerceMigratedAt: new Date(),
    });
  });

  console.log(`Applied ${MIGRATION_ID}. Original documents are backed up and can be restored with --rollback.`);
}

try {
  if (mode === 'rollback') await rollback();
  else await migrate();
} catch (error) {
  console.error(`Hybrid commerce migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
