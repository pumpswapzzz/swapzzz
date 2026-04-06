import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const followsTable = pgTable("follows", {
  followerWallet: text("follower_wallet").notNull(),
  followedWallet: text("followed_wallet").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.followerWallet, t.followedWallet] })
]);

export type Follow = typeof followsTable.$inferSelect;
