import { Router, type IRouter } from "express";
import { and, eq, sql, count } from "drizzle-orm";
import { db, likesTable, broadcastsTable } from "@workspace/db";
import {
  LikeBroadcastParams,
  LikeBroadcastBody,
  GetLikesParams,
  GetLikesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/likes/:broadcastId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.broadcastId) ? req.params.broadcastId[0] : req.params.broadcastId;
  const paramsParsed = LikeBroadcastParams.safeParse({ broadcastId: rawId });
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }

  const bodyParsed = LikeBroadcastBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const { broadcastId } = paramsParsed.data;
  const { wallet_address } = bodyParsed.data;

  const existing = await db
    .select()
    .from(likesTable)
    .where(and(eq(likesTable.broadcastId, broadcastId), eq(likesTable.walletAddress, wallet_address)))
    .limit(1);

  let liked: boolean;

  if (existing.length > 0) {
    await db.delete(likesTable).where(
      and(eq(likesTable.broadcastId, broadcastId), eq(likesTable.walletAddress, wallet_address))
    );
    await db.update(broadcastsTable)
      .set({ likesCount: sql`${broadcastsTable.likesCount} - 1` })
      .where(eq(broadcastsTable.id, broadcastId));
    liked = false;
  } else {
    await db.insert(likesTable).values({ broadcastId, walletAddress: wallet_address });
    await db.update(broadcastsTable)
      .set({ likesCount: sql`${broadcastsTable.likesCount} + 1` })
      .where(eq(broadcastsTable.id, broadcastId));
    liked = true;
  }

  const [countResult] = await db
    .select({ likes_count: count(likesTable.broadcastId) })
    .from(likesTable)
    .where(eq(likesTable.broadcastId, broadcastId));

  res.json({ liked, likes_count: Number(countResult?.likes_count ?? 0) });
});

router.get("/likes/:broadcastId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.broadcastId) ? req.params.broadcastId[0] : req.params.broadcastId;
  const paramsParsed = GetLikesParams.safeParse({ broadcastId: rawId });
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }

  const queryParsed = GetLikesQueryParams.safeParse(req.query);
  const wallet_address = queryParsed.success ? queryParsed.data.wallet_address : undefined;

  const { broadcastId } = paramsParsed.data;

  const [countResult] = await db
    .select({ likes_count: count(likesTable.broadcastId) })
    .from(likesTable)
    .where(eq(likesTable.broadcastId, broadcastId));

  let liked = false;
  if (wallet_address) {
    const existing = await db
      .select()
      .from(likesTable)
      .where(and(eq(likesTable.broadcastId, broadcastId), eq(likesTable.walletAddress, wallet_address)))
      .limit(1);
    liked = existing.length > 0;
  }

  res.json({ liked, likes_count: Number(countResult?.likes_count ?? 0) });
});

export default router;
