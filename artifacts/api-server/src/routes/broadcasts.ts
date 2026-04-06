import { Router, type IRouter } from "express";
import { and, desc, eq, gte, sql, count, sum } from "drizzle-orm";
import { db, broadcastsTable, usersTable, likesTable, followsTable } from "@workspace/db";
import {
  ListBroadcastsQueryParams,
  CreateBroadcastBody,
  GetBroadcastParams,
  GetBroadcastStatsResponse,
  GetTrendingBroadcastsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/broadcasts/stats", async (req, res): Promise<void> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [statsResult] = await db
    .select({
      total_broadcasts: count(broadcastsTable.id),
      total_buys: sql<number>`count(*) filter (where ${broadcastsTable.action} = 'buy')`,
      total_sells: sql<number>`count(*) filter (where ${broadcastsTable.action} = 'sell')`,
      total_volume_sol: sql<number>`coalesce(sum(${broadcastsTable.amountSol}), 0)`,
    })
    .from(broadcastsTable);

  const [activeResult] = await db
    .select({ active_traders_24h: sql<number>`count(distinct ${broadcastsTable.walletAddress})` })
    .from(broadcastsTable)
    .where(gte(broadcastsTable.createdAt, twentyFourHoursAgo));

  const stats = {
    total_broadcasts: Number(statsResult.total_broadcasts),
    total_buys: Number(statsResult.total_buys),
    total_sells: Number(statsResult.total_sells),
    active_traders_24h: Number(activeResult.active_traders_24h),
    total_volume_sol: Number(statsResult.total_volume_sol),
  };

  res.json(GetBroadcastStatsResponse.parse(stats));
});

router.get("/broadcasts/trending", async (req, res): Promise<void> => {
  const parsed = GetTrendingBroadcastsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const broadcasts = await db
    .select({
      id: broadcastsTable.id,
      wallet_address: broadcastsTable.walletAddress,
      mint: broadcastsTable.mint,
      token_name: broadcastsTable.tokenName,
      token_symbol: broadcastsTable.tokenSymbol,
      token_image_uri: broadcastsTable.tokenImageUri,
      action: broadcastsTable.action,
      amount_sol: broadcastsTable.amountSol,
      token_amount: broadcastsTable.tokenAmount,
      price: broadcastsTable.price,
      message: broadcastsTable.message,
      tx_signature: broadcastsTable.txSignature,
      is_migrated: broadcastsTable.isMigrated,
      created_at: broadcastsTable.createdAt,
      likes_count: broadcastsTable.likesCount,
      username: usersTable.username,
    })
    .from(broadcastsTable)
    .leftJoin(usersTable, eq(broadcastsTable.walletAddress, usersTable.walletAddress))
    .where(gte(broadcastsTable.createdAt, oneDayAgo))
    .orderBy(desc(broadcastsTable.likesCount), desc(broadcastsTable.createdAt))
    .limit(limit);

  res.json({ broadcasts: broadcasts.map(serializeBroadcast) });
});

router.get("/broadcasts", async (req, res): Promise<void> => {
  const parsed = ListBroadcastsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 50, offset = 0, wallet, mint, following, viewer_wallet } = parsed.data;

  let query = db
    .select({
      id: broadcastsTable.id,
      wallet_address: broadcastsTable.walletAddress,
      mint: broadcastsTable.mint,
      token_name: broadcastsTable.tokenName,
      token_symbol: broadcastsTable.tokenSymbol,
      token_image_uri: broadcastsTable.tokenImageUri,
      action: broadcastsTable.action,
      amount_sol: broadcastsTable.amountSol,
      token_amount: broadcastsTable.tokenAmount,
      price: broadcastsTable.price,
      message: broadcastsTable.message,
      tx_signature: broadcastsTable.txSignature,
      is_migrated: broadcastsTable.isMigrated,
      created_at: broadcastsTable.createdAt,
      likes_count: broadcastsTable.likesCount,
      username: usersTable.username,
    })
    .from(broadcastsTable)
    .leftJoin(usersTable, eq(broadcastsTable.walletAddress, usersTable.walletAddress));

  const conditions = [];

  if (wallet) {
    conditions.push(eq(broadcastsTable.walletAddress, wallet));
  }
  if (mint) {
    conditions.push(eq(broadcastsTable.mint, mint));
  }
  if (following && viewer_wallet) {
    const followedWallets = await db
      .select({ wallet: followsTable.followedWallet })
      .from(followsTable)
      .where(eq(followsTable.followerWallet, viewer_wallet));
    const walletList = followedWallets.map((f) => f.wallet);
    if (walletList.length === 0) {
      res.json({ broadcasts: [], total: 0 });
      return;
    }
    conditions.push(sql`${broadcastsTable.walletAddress} = ANY(${walletList})`);
  }

  const filteredQuery = conditions.length > 0
    ? query.where(and(...conditions))
    : query;

  const [totalResult] = await db
    .select({ total: count(broadcastsTable.id) })
    .from(broadcastsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const broadcasts = await filteredQuery
    .orderBy(desc(broadcastsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    broadcasts: broadcasts.map(serializeBroadcast),
    total: Number(totalResult?.total ?? 0),
  });
});

router.post("/broadcasts", async (req, res): Promise<void> => {
  const parsed = CreateBroadcastBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { wallet_address, mint, token_name, token_symbol, token_image_uri, action, amount_sol, token_amount, price, message, tx_signature, is_migrated } = parsed.data;

  await db.insert(usersTable).values({ walletAddress: wallet_address }).onConflictDoNothing();

  const [broadcast] = await db.insert(broadcastsTable).values({
    walletAddress: wallet_address,
    mint,
    tokenName: token_name,
    tokenSymbol: token_symbol,
    tokenImageUri: token_image_uri,
    action,
    amountSol: amount_sol,
    tokenAmount: token_amount,
    price,
    message,
    txSignature: tx_signature,
    isMigrated: is_migrated,
  }).returning();

  const user = await db.select().from(usersTable).where(eq(usersTable.walletAddress, wallet_address)).limit(1);

  res.status(201).json(serializeBroadcast({ ...broadcast, username: user[0]?.username ?? null }));
});

router.get("/broadcasts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetBroadcastParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [broadcast] = await db
    .select({
      id: broadcastsTable.id,
      wallet_address: broadcastsTable.walletAddress,
      mint: broadcastsTable.mint,
      token_name: broadcastsTable.tokenName,
      token_symbol: broadcastsTable.tokenSymbol,
      token_image_uri: broadcastsTable.tokenImageUri,
      action: broadcastsTable.action,
      amount_sol: broadcastsTable.amountSol,
      token_amount: broadcastsTable.tokenAmount,
      price: broadcastsTable.price,
      message: broadcastsTable.message,
      tx_signature: broadcastsTable.txSignature,
      is_migrated: broadcastsTable.isMigrated,
      created_at: broadcastsTable.createdAt,
      likes_count: broadcastsTable.likesCount,
      username: usersTable.username,
    })
    .from(broadcastsTable)
    .leftJoin(usersTable, eq(broadcastsTable.walletAddress, usersTable.walletAddress))
    .where(eq(broadcastsTable.id, parsed.data.id));

  if (!broadcast) {
    res.status(404).json({ error: "Broadcast not found" });
    return;
  }

  res.json(serializeBroadcast(broadcast));
});

function serializeBroadcast(b: {
  id: string;
  wallet_address: string;
  mint: string;
  token_name: string | null;
  token_symbol: string | null;
  token_image_uri: string | null;
  action: string;
  amount_sol: number | null;
  token_amount: number | null;
  price: number | null;
  message: string | null;
  tx_signature: string | null;
  is_migrated: boolean;
  created_at: Date;
  likes_count: number;
  username: string | null;
}) {
  return {
    id: b.id,
    wallet_address: b.wallet_address,
    mint: b.mint,
    token_name: b.token_name ?? undefined,
    token_symbol: b.token_symbol ?? undefined,
    token_image_uri: b.token_image_uri ?? undefined,
    action: b.action,
    amount_sol: b.amount_sol ?? undefined,
    token_amount: b.token_amount ?? undefined,
    price: b.price ?? undefined,
    message: b.message ?? undefined,
    tx_signature: b.tx_signature ?? undefined,
    is_migrated: b.is_migrated,
    created_at: b.created_at.toISOString(),
    likes_count: b.likes_count,
    username: b.username ?? undefined,
  };
}

export default router;
