import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, followsTable, usersTable } from "@workspace/db";
import {
  ToggleFollowBody,
  GetFollowersParams,
  GetFollowingParams,
  CheckFollowQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/follows", async (req, res): Promise<void> => {
  const parsed = ToggleFollowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { follower_wallet, followed_wallet } = parsed.data;

  const existing = await db
    .select()
    .from(followsTable)
    .where(and(
      eq(followsTable.followerWallet, follower_wallet),
      eq(followsTable.followedWallet, followed_wallet)
    ))
    .limit(1);

  let following: boolean;

  if (existing.length > 0) {
    await db.delete(followsTable).where(
      and(
        eq(followsTable.followerWallet, follower_wallet),
        eq(followsTable.followedWallet, followed_wallet)
      )
    );
    following = false;
  } else {
    await db.insert(usersTable).values({ walletAddress: follower_wallet }).onConflictDoNothing();
    await db.insert(usersTable).values({ walletAddress: followed_wallet }).onConflictDoNothing();
    await db.insert(followsTable).values({ followerWallet: follower_wallet, followedWallet: followed_wallet });
    following = true;
  }

  res.json({ following });
});

router.get("/follows/:wallet/followers", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.wallet) ? req.params.wallet[0] : req.params.wallet;
  const parsed = GetFollowersParams.safeParse({ wallet: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const followers = await db
    .select({
      wallet_address: usersTable.walletAddress,
      username: usersTable.username,
      bio: usersTable.bio,
      created_at: usersTable.createdAt,
    })
    .from(followsTable)
    .leftJoin(usersTable, eq(followsTable.followerWallet, usersTable.walletAddress))
    .where(eq(followsTable.followedWallet, parsed.data.wallet));

  res.json({
    followers: followers.map((f) => ({
      wallet_address: f.wallet_address ?? '',
      username: f.username ?? undefined,
      bio: f.bio ?? undefined,
      created_at: f.created_at?.toISOString() ?? new Date().toISOString(),
    })),
  });
});

router.get("/follows/:wallet/following", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.wallet) ? req.params.wallet[0] : req.params.wallet;
  const parsed = GetFollowingParams.safeParse({ wallet: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const following = await db
    .select({
      wallet_address: usersTable.walletAddress,
      username: usersTable.username,
      bio: usersTable.bio,
      created_at: usersTable.createdAt,
    })
    .from(followsTable)
    .leftJoin(usersTable, eq(followsTable.followedWallet, usersTable.walletAddress))
    .where(eq(followsTable.followerWallet, parsed.data.wallet));

  res.json({
    following: following.map((f) => ({
      wallet_address: f.wallet_address ?? '',
      username: f.username ?? undefined,
      bio: f.bio ?? undefined,
      created_at: f.created_at?.toISOString() ?? new Date().toISOString(),
    })),
  });
});

router.get("/follows/check", async (req, res): Promise<void> => {
  const parsed = CheckFollowQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { follower_wallet, followed_wallet } = parsed.data;

  const existing = await db
    .select()
    .from(followsTable)
    .where(and(
      eq(followsTable.followerWallet, follower_wallet),
      eq(followsTable.followedWallet, followed_wallet)
    ))
    .limit(1);

  res.json({ following: existing.length > 0 });
});

export default router;
