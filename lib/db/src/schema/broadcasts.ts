import { pgTable, text, timestamp, integer, boolean, doublePrecision, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const broadcastsTable = pgTable("broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address").notNull(),
  mint: text("mint").notNull(),
  tokenName: text("token_name"),
  tokenSymbol: text("token_symbol"),
  tokenImageUri: text("token_image_uri"),
  action: text("action").notNull(), // 'buy' | 'sell'
  amountSol: doublePrecision("amount_sol"),
  tokenAmount: doublePrecision("token_amount"),
  price: doublePrecision("price"),
  message: text("message"),
  txSignature: text("tx_signature"),
  isMigrated: boolean("is_migrated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  likesCount: integer("likes_count").notNull().default(0),
});

export const insertBroadcastSchema = createInsertSchema(broadcastsTable).omit({ id: true, createdAt: true, likesCount: true });
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;
export type Broadcast = typeof broadcastsTable.$inferSelect;
