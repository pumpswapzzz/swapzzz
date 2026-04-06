import { Router, type IRouter } from "express";
import { eq, sql, count } from "drizzle-orm";
import { db, usersTable, broadcastsTable, followsTable, likesTable } from "@workspace/db";
import {
  GetUserProfileParams,
  UpsertUserProfileParams,
  UpsertUserProfileBody,
  GetUserStatsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:wallet", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.wallet) ? req.params.wallet[0] : req.params.wallet;
  const parsed = GetUserProfileParams.safeParse({ wallet: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.walletAddress, parsed.data.wallet));

  if (!user) {
    const walletAddr = parsed.data.wallet;
    const [newUser] = await db
      .insert(usersTable)
      .values({ walletAddress: walletAddr })
      .onConflictDoNothing()
      .returning();

    res.json({
      wallet_address: walletAddr,
      username: undefined,
      bio: undefined,
      created_at: (newUser?.createdAt ?? new Date()).toISOString(),
    });
    return;
  }

  res.json({
    wallet_address: user.walletAddress,
    username: user.username ?? undefined,
    bio: user.bio ?? undefined,
    created_at: user.createdAt.toISOString(),
  });
});

router.put("/users/:wallet", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.wallet) ? req.params.wallet[0] : req.params.wallet;
  const paramsParsed = UpsertUserProfileParams.safeParse({ wallet: raw });
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }

  const bodyParsed = UpsertUserProfileBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const { wallet } = paramsParsed.data;
  const { username, bio } = bodyParsed.data;

  const [user] = await db
    .insert(usersTable)
    .values({ walletAddress: wallet, username, bio })
    .onConflictDoUpdate({
      target: usersTable.walletAddress,
      set: { username, bio },
    })
    .returning();

  res.json({
    wallet_address: user.walletAddress,
    username: user.username ?? undefined,
    bio: user.bio ?? undefined,
    created_at: user.createdAt.toISOString(),
  });
});

router.get("/users/:wallet/stats", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.wallet) ? req.params.wallet[0] : req.params.wallet;
  const parsed = GetUserStatsParams.safeParse({ wallet: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { wallet } = parsed.data;

  const [broadcastStats] = await db
    .select({
      broadcast_count: count(broadcastsTable.id),
      total_volume_sol: sql<number>`coalesce(sum(${broadcastsTable.amountSol}), 0)`,
      total_buys: sql<number>`count(*) filter (where ${broadcastsTable.action} = 'buy')`,
      total_sells: sql<number>`count(*) filter (where ${broadcastsTable.action} = 'sell')`,
    })
    .from(broadcastsTable)
    .where(eq(broadcastsTable.walletAddress, wallet));

  const [followersResult] = await db
    .select({ followers_count: count(followsTable.followerWallet) })
    .from(followsTable)
    .where(eq(followsTable.followedWallet, wallet));

  const [followingResult] = await db
    .select({ following_count: count(followsTable.followedWallet) })
    .from(followsTable)
    .where(eq(followsTable.followerWallet, wallet));

  res.json({
    wallet_address: wallet,
    broadcast_count: Number(broadcastStats?.broadcast_count ?? 0),
    total_volume_sol: Number(broadcastStats?.total_volume_sol ?? 0),
    total_buys: Number(broadcastStats?.total_buys ?? 0),
    total_sells: Number(broadcastStats?.total_sells ?? 0),
    followers_count: Number(followersResult?.followers_count ?? 0),
    following_count: Number(followingResult?.following_count ?? 0),
  });
});

export default router;
