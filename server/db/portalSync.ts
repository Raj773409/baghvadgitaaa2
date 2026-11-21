import path from 'node:path';
import { eq } from 'drizzle-orm';
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { getDbPool } from './client.ts';
import * as schema from './schema.ts';
import type {
  EntryPassRecord,
  ParticipantNotificationRecord,
  ParticipantRecord,
  PaymentRecord,
  PlatformStore,
} from '../store.ts';

/**
 * Durable MySQL persistence for the participant / payment / pass / notification domain.
 *
 * The in-memory PlatformStore stays the read model (so every existing route keeps working
 * synchronously), while MySQL is the durable system of record:
 *   - boot:     run migrations, then hydrate the store from MySQL (MySQL wins on conflicts)
 *   - mutation: write-through upsert of the changed rows
 *
 * This matters on hosts with an ephemeral filesystem (e.g. Render), where the JSON store
 * is wiped on every deploy/restart. When DATABASE_URL is unset everything here is a no-op.
 */

type Db = MySql2Database<typeof schema>;

let db: Db | null = null;
let ready = false;

function getDrizzle(): Db | null {
  if (db) return db;
  const pool = getDbPool();
  if (!pool) return null;
  db = drizzle(pool, { schema, mode: 'default' });
  return db;
}

export function isMysqlPersistenceEnabled(): boolean {
  return Boolean(getDbPool());
}

export function isMysqlReady(): boolean {
  return ready;
}

const toDate = (iso: string | null | undefined): Date | null => (iso ? new Date(iso) : null);
const toIso = (d: Date | string | null | undefined): string | null =>
  d ? (d instanceof Date ? d.toISOString() : new Date(d).toISOString()) : null;

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function participantToRow(p: ParticipantRecord): typeof schema.participants.$inferInsert {
  return {
    id: p.id,
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    noOfPersons: p.noOfPersons,
    donationAmountInr: Math.round(p.donationAmountInr),
    registrationType: p.registrationType,
    country: p.country,
    city: p.city,
    assistanceVisa: p.assistance.visa,
    assistanceAccommodation: p.assistance.accommodation,
    assistanceLocalTransport: p.assistance.localTransport,
    eventsCurtainRaiser: p.events.curtainRaiser,
    eventsMahotsav: p.events.mahotsav,
    preferredLanguage: p.preferredLanguage ?? null,
    familyOrGroupMembers: p.familyOrGroupMembers ?? null,
    organisationName: p.organisationName ?? null,
    organisationRole: p.organisationRole ?? null,
    volunteerSkills: p.volunteerSkills ?? null,
    parayanaCity: p.parayanaCity ?? null,
    assistanceNotes: p.assistanceNotes ?? null,
    verificationStatus: p.verificationStatus,
    paymentStatus: p.paymentStatus,
    referenceCode: p.referenceCode,
    createdAt: new Date(p.createdAt),
  };
}

function rowToParticipant(r: typeof schema.participants.$inferSelect): ParticipantRecord {
  return {
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    noOfPersons: r.noOfPersons,
    donationAmountInr: r.donationAmountInr,
    registrationType: r.registrationType,
    country: r.country,
    city: r.city,
    assistance: {
      visa: r.assistanceVisa,
      accommodation: r.assistanceAccommodation,
      localTransport: r.assistanceLocalTransport,
    },
    events: { curtainRaiser: r.eventsCurtainRaiser, mahotsav: r.eventsMahotsav },
    preferredLanguage: r.preferredLanguage ?? undefined,
    familyOrGroupMembers: r.familyOrGroupMembers ?? undefined,
    organisationName: r.organisationName ?? undefined,
    organisationRole: r.organisationRole ?? undefined,
    volunteerSkills: r.volunteerSkills ?? undefined,
    parayanaCity: r.parayanaCity ?? undefined,
    assistanceNotes: r.assistanceNotes ?? undefined,
    verificationStatus: r.verificationStatus as ParticipantRecord['verificationStatus'],
    paymentStatus: r.paymentStatus as ParticipantRecord['paymentStatus'],
    referenceCode: r.referenceCode,
    createdAt: toIso(r.createdAt) ?? new Date().toISOString(),
  };
}

function paymentToRow(p: PaymentRecord): typeof schema.payments.$inferInsert {
  return {
    id: p.id,
    participantId: p.participantId,
    participantName: p.participantName,
    amountInr: Math.round(p.amountInr),
    currency: p.currency,
    gateway: p.gateway,
    gatewayReference: p.gatewayReference,
    gatewayOrderId: p.gatewayOrderId,
    status: p.status,
    createdAt: new Date(p.createdAt),
    mode: p.mode ?? null,
    methodFamily: p.methodFamily ?? null,
    methodProvider: p.methodProvider ?? null,
    methodLabel: p.methodLabel ?? null,
    receiptNumber: p.receiptNumber ?? null,
    capturedAt: toDate(p.capturedAt),
    failureReason: p.failureReason ?? null,
    attempts: p.attempts ?? 0,
  };
}

function rowToPayment(r: typeof schema.payments.$inferSelect): PaymentRecord {
  return {
    id: r.id,
    participantId: r.participantId,
    participantName: r.participantName,
    amountInr: r.amountInr,
    currency: 'INR',
    gateway: r.gateway as PaymentRecord['gateway'],
    gatewayReference: r.gatewayReference,
    gatewayOrderId: r.gatewayOrderId,
    status: r.status as PaymentRecord['status'],
    createdAt: toIso(r.createdAt) ?? new Date().toISOString(),
    mode: (r.mode as PaymentRecord['mode']) ?? undefined,
    methodFamily: (r.methodFamily as PaymentRecord['methodFamily']) ?? null,
    methodProvider: r.methodProvider,
    methodLabel: r.methodLabel,
    receiptNumber: r.receiptNumber,
    capturedAt: toIso(r.capturedAt),
    failureReason: r.failureReason,
    attempts: r.attempts,
  };
}

function passToRow(p: EntryPassRecord): typeof schema.entryPasses.$inferInsert {
  return { ...p, issuedAt: new Date(p.issuedAt), checkedInAt: toDate(p.checkedInAt) };
}

function rowToPass(r: typeof schema.entryPasses.$inferSelect): EntryPassRecord {
  return {
    ...r,
    eventKey: r.eventKey as EntryPassRecord['eventKey'],
    status: r.status as EntryPassRecord['status'],
    issuedAt: toIso(r.issuedAt) ?? new Date().toISOString(),
    checkedInAt: toIso(r.checkedInAt),
  };
}

function notificationToRow(
  n: ParticipantNotificationRecord,
): typeof schema.participantNotifications.$inferInsert {
  return { ...n, createdAt: new Date(n.createdAt) };
}

function rowToNotification(
  r: typeof schema.participantNotifications.$inferSelect,
): ParticipantNotificationRecord {
  return {
    ...r,
    kind: r.kind as ParticipantNotificationRecord['kind'],
    tone: r.tone as ParticipantNotificationRecord['tone'],
    createdAt: toIso(r.createdAt) ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Boot: migrate + hydrate
// ---------------------------------------------------------------------------

function mergeById<T extends { id: string }>(target: T[], incoming: T[]): number {
  const index = new Map(target.map((item, i) => [item.id, i]));
  let added = 0;
  for (const row of incoming) {
    const at = index.get(row.id);
    if (at === undefined) {
      target.push(row);
      added++;
    } else {
      target[at] = row;
    }
  }
  return added;
}

export async function initPortalPersistence(store: PlatformStore, rootDir: string): Promise<void> {
  const d = getDrizzle();
  if (!d) {
    console.info('[db] DATABASE_URL not set — using the JSON file store only (not durable on ephemeral hosts).');
    return;
  }
  try {
    await migrate(d, { migrationsFolder: path.resolve(rootDir, 'server/db/migrations') });

    const [participants, payments, passes, notifications] = await Promise.all([
      d.select().from(schema.participants),
      d.select().from(schema.payments),
      d.select().from(schema.entryPasses),
      d.select().from(schema.participantNotifications),
    ]);

    const snapshot = store.getSnapshot();
    const added =
      mergeById(snapshot.participants, participants.map(rowToParticipant)) +
      mergeById(snapshot.payments, payments.map(rowToPayment)) +
      mergeById(snapshot.entryPasses, passes.map(rowToPass)) +
      mergeById(snapshot.participantNotifications, notifications.map(rowToNotification));

    const byNewest = (a: { createdAt?: string; issuedAt?: string }, b: { createdAt?: string; issuedAt?: string }) =>
      (b.createdAt ?? b.issuedAt ?? '').localeCompare(a.createdAt ?? a.issuedAt ?? '');
    snapshot.participants.sort(byNewest);
    snapshot.payments.sort(byNewest);
    snapshot.participantNotifications.sort(byNewest);
    store.save();

    ready = true;
    console.info(
      `[db] MySQL persistence active — hydrated ${participants.length} participants, ${payments.length} payments, ` +
        `${passes.length} passes, ${notifications.length} notifications (${added} new locally).`,
    );
  } catch (err) {
    console.error('[db] MySQL init failed; continuing on the JSON store only:', err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Write-through (serialised so rapid successive writes land in order)
// ---------------------------------------------------------------------------

let queue: Promise<void> = Promise.resolve();

function enqueue(label: string, op: (d: Db) => Promise<unknown>): void {
  const d = getDrizzle();
  if (!d) return;
  queue = queue
    .then(() => op(d))
    .then(() => undefined)
    .catch((err) => {
      console.error(`[db] write-through failed (${label}):`, err instanceof Error ? err.message : err);
    });
}

export function persistParticipant(p: ParticipantRecord): void {
  const row = participantToRow(p);
  enqueue(`participant ${p.id}`, (d) =>
    d.insert(schema.participants).values(row).onDuplicateKeyUpdate({ set: row }),
  );
}

export function persistPayment(p: PaymentRecord): void {
  const row = paymentToRow(p);
  enqueue(`payment ${p.id}`, (d) => d.insert(schema.payments).values(row).onDuplicateKeyUpdate({ set: row }));
}

export function persistPass(p: EntryPassRecord): void {
  const row = passToRow(p);
  enqueue(`pass ${p.id}`, (d) => d.insert(schema.entryPasses).values(row).onDuplicateKeyUpdate({ set: row }));
}

export function persistNotification(n: ParticipantNotificationRecord): void {
  const row = notificationToRow(n);
  enqueue(`notification ${n.id}`, (d) =>
    d.insert(schema.participantNotifications).values(row).onDuplicateKeyUpdate({ set: row }),
  );
}

/** Removes a participant and everything hanging off them (admin "delete registration"). */
export function deleteParticipantCascade(participantId: string): void {
  enqueue(`delete participant ${participantId}`, async (d) => {
    await d.delete(schema.entryPasses).where(eq(schema.entryPasses.participantId, participantId));
    await d
      .delete(schema.participantNotifications)
      .where(eq(schema.participantNotifications.participantId, participantId));
    await d.delete(schema.participants).where(eq(schema.participants.id, participantId));
  });
}

/** Resolves once all queued writes have been attempted (used in tests / graceful shutdown). */
export function flushPortalWrites(): Promise<void> {
  return queue;
}
