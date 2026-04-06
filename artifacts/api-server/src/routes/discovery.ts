import { Router, type IRouter } from "express";
import { desc, gte, sql, count, sum } from "drizzle-orm";
import { db, broadcastsTable, usersTable, followsTable } from "@workspace/db";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/discovery/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

  const traders = await db
    .select({
      wallet_address: broadcastsTable.walletAddress,
      username: usersTable.username,
      broadcast_count: count(broadcastsTable.id),
      total_volume_sol: sql<number>`coalesce(sum(${broadcastsTable.amountSol}), 0)`,
    })
    .from(broadcastsTable)
    .leftJoin(usersTable, sql`${broadcastsTable.walletAddress} = ${usersTable.walletAddress}`)
    .groupBy(broadcastsTable.walletAddress, usersTable.username)
    .orderBy(desc(sql`sum(${broadcastsTable.amountSol})`))
    .limit(limit);

  const result = await Promise.all(traders.map(async (t) => {
    const [followersResult] = await db
      .select({ followers_count: count(followsTable.followerWallet) })
      .from(followsTable)
      .where(sql`${followsTable.followedWallet} = ${t.wallet_address}`);

    return {
      wallet_address: t.wallet_address,
      username: t.username ?? undefined,
      broadcast_count: Number(t.broadcast_count),
      total_volume_sol: Number(t.total_volume_sol),
      followers_count: Number(followersResult?.followers_count ?? 0),
    };
  }));

  res.json({ traders: result });
});

router.get("/discovery/activity-feed", async (_req, res): Promise<void> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const hourlyStats = await db
    .select({
      hour: sql<string>`date_trunc('hour', ${broadcastsTable.createdAt})::text`,
      trade_count: count(broadcastsTable.id),
      buy_count: sql<number>`count(*) filter (where ${broadcastsTable.action} = 'buy')`,
      sell_count: sql<number>`count(*) filter (where ${broadcastsTable.action} = 'sell')`,
      volume_sol: sql<number>`coalesce(sum(${broadcastsTable.amountSol}), 0)`,
    })
    .from(broadcastsTable)
    .where(gte(broadcastsTable.createdAt, twentyFourHoursAgo))
    .groupBy(sql`date_trunc('hour', ${broadcastsTable.createdAt})`)
    .orderBy(sql`date_trunc('hour', ${broadcastsTable.createdAt})`);

  const [platformSummary] = await db
    .select({
      total_broadcasts: count(broadcastsTable.id),
      total_volume_sol: sql<number>`coalesce(sum(${broadcastsTable.amountSol}), 0)`,
      active_traders_24h: sql<number>`count(distinct ${broadcastsTable.walletAddress}) filter (where ${broadcastsTable.createdAt} >= ${twentyFourHoursAgo})`,
    })
    .from(broadcastsTable);

  const [totalUsers] = await db.select({ total: count(usersTable.walletAddress) }).from(usersTable);

  res.json({
    hourly_stats: hourlyStats.map((h) => ({
      hour: h.hour,
      trade_count: Number(h.trade_count),
      buy_count: Number(h.buy_count),
      sell_count: Number(h.sell_count),
      volume_sol: Number(h.volume_sol),
    })),
    platform_summary: {
      total_users: Number(totalUsers?.total ?? 0),
      total_broadcasts: Number(platformSummary?.total_broadcasts ?? 0),
      total_volume_sol: Number(platformSummary?.total_volume_sol ?? 0),
      active_traders_24h: Number(platformSummary?.active_traders_24h ?? 0),
    },
  });
});

export default router;
