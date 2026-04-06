import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const likesTable = pgTable("likes", {
  broadcastId: text("broadcast_id").notNull(),
  walletAddress: text("wallet_address").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.broadcastId, t.walletAddress] })
]);

export type Like = typeof likesTable.$inferSelect;
