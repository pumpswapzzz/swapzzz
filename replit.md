# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains EchoPump — a social trading platform for the Pump.fun Solana ecosystem.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (Replit built-in)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## EchoPump App

A social trading platform for the full Pump.fun ecosystem on Solana.

### Features
- Live trade feed via PumpPortal WebSocket (wss://pumpportal.fun/api/data)
- Bonding Curve vs PumpSwap badge detection via migration events
- Wallet connect (Phantom, Solflare) via @solana/wallet-adapter-react
- Social broadcasts: post trades with messages to your followers
- Follow system: follow wallets, see their broadcasts in "Following" tab
- Copy-trade: one-click copy any visible trade via PumpPortal Local API
- Like system on broadcasts
- Trending tokens discovery page
- Leaderboard of top traders
- User profiles at /u/[wallet]
- Token detail pages at /token/[mint]
- Supabase realtime for live updates
- Non-custodial: all transactions signed client-side

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key  
- `VITE_SUPABASE_URL` — Same URL, VITE_ prefixed for frontend
- `VITE_SUPABASE_ANON_KEY` — Same key, VITE_ prefixed for frontend
- `NEXT_PUBLIC_PUMP_PORTAL_API_KEY` — PumpPortal API key (optional)

### Database Tables (PostgreSQL)
- `users` — wallet_address (PK), username, bio, created_at
- `follows` — follower_wallet, followed_wallet (composite PK)
- `broadcasts` — id (UUID), wallet_address, mint, token info, action, amounts, message, tx_signature, is_migrated, likes_count
- `likes` — broadcast_id, wallet_address (composite PK)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
