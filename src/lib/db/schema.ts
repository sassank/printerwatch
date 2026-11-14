import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

export const snapshots = sqliteTable(
  'snapshots',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    printerId: text('printerId').notNull(),
    status: text('status').notNull(),
    tonerLevel: integer('tonerLevel').notNull(),
    pagesTotal: integer('pagesTotal').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index('snapshots_printerId_createdAt_idx').on(table.printerId, table.createdAt),
  ]
);

export const events = sqliteTable(
  'events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    printerId: text('printerId').notNull(),
    type: text('type').notNull(),
    message: text('message').notNull(),
    severity: text('severity').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index('events_printerId_createdAt_idx').on(table.printerId, table.createdAt),
  ]
);

export type Snapshot = typeof snapshots.$inferSelect;
export type NewSnapshot = typeof snapshots.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export const snapshotSchema = z.object({
  id: z.number().int().optional(),
  printerId: z.string().min(1),
  status: z.enum(['online', 'warning', 'error', 'offline']),
  tonerLevel: z.number().int().min(0).max(100),
  pagesTotal: z.number().int().nonnegative(),
  createdAt: z.date().optional(),
});

export const eventSchema = z.object({
  id: z.number().int().optional(),
  printerId: z.string().min(1),
  type: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(['info', 'warning', 'error']),
  createdAt: z.date().optional(),
});
