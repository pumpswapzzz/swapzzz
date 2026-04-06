'use client';

import { useGetTrendingBroadcasts } from "@workspace/api-client-react";
import { usePumpPortalWS } from "@/hooks/usePumpPortalWS";
import { BroadcastCard } from "@/components/BroadcastCard";
import { Link } from "wouter";
import { Flame, Rocket, ArrowRightLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TokenBadge } from "@/components/TokenBadge";

export function Trending() {
  const { newTokens, migratedMints } = usePumpPortalWS();
  const { data: trending, isLoading: trendingLoading } = useGetTrendingBroadcasts({ limit: 20 });

  return (
    <div className="container max-w-screen-xl px-4 md:px-8 py-8 space-y-12">
      <section>
        <h2 className="text-2xl font-bold font-mono uppercase tracking-tighter flex items-center gap-2 mb-6">
          <Flame className="h-6 w-6 text-orange-500" />
          Hot Broadcasts
        </h2>
        {trendingLoading ? (
          <div className="text-center py-10">Loading trending...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trending?.broadcasts?.slice(0, 6).map((broadcast) => (
              <BroadcastCard key={broadcast.id} broadcast={broadcast} />
            ))}
            {(!trending?.broadcasts || trending.broadcasts.length === 0) && (
              <div className="col-span-full text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                No trending broadcasts yet.
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-bold font-mono uppercase tracking-tighter flex items-center gap-2 mb-6">
            <Rocket className="h-6 w-6 text-primary" />
            New Launches
          </h2>
          <div className="space-y-4">
            {newTokens.slice(0, 10).map((token, i) => (
              <Link 
                key={`${token.mint}-${i}`} 
                href={`/token/${token.mint}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
              >
                {token.imageUri ? (
                  <img src={token.imageUri} alt={token.symbol} className="h-10 w-10 rounded-full object-cover bg-muted" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {token.symbol?.substring(0, 2) || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <span className="font-bold truncate">{token.name} (${token.symbol})</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDistanceToNow(token.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">
                    MC: {token.marketCapSol.toFixed(1)} SOL
                  </div>
                </div>
              </Link>
            ))}
            {newTokens.length === 0 && (
              <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                Waiting for new launches...
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold font-mono uppercase tracking-tighter flex items-center gap-2 mb-6">
            <ArrowRightLeft className="h-6 w-6 text-purple-500" />
            Graduated (PumpSwap)
          </h2>
          <div className="space-y-4">
            {Array.from(migratedMints).slice(0, 10).map((mint, i) => (
              <Link 
                key={`${mint}-${i}`} 
                href={`/token/${mint}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-purple-500/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {mint.substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold truncate font-mono">{mint.substring(0, 8)}...</span>
                    <TokenBadge isMigrated={true} />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {mint}
                  </div>
                </div>
              </Link>
            ))}
            {migratedMints.size === 0 && (
              <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                Waiting for migrations...
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
