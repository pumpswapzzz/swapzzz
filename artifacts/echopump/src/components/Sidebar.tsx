import { useGetTrendingBroadcasts, useGetBroadcastStats } from "@workspace/api-client-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { NewToken } from "@/hooks/usePumpPortalWS";

export function Sidebar({ newTokens }: { newTokens: NewToken[] }) {
  const { connected, publicKey } = useWallet();
  const { data: stats, isLoading: statsLoading } = useGetBroadcastStats();
  const { data: trending, isLoading: trendingLoading } = useGetTrendingBroadcasts({ limit: 5 });

  return (
    <div className="hidden lg:block w-80 space-y-6">
      {connected && publicKey && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold font-mono">0.00 SOL</span>
              <Link href={`/u/${publicKey.toString()}`} className="text-sm text-primary hover:underline" data-testid="link-portfolio">
                View Profile & History
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Platform Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">24h Volume</span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {stats.total_volume_sol.toFixed(2)} SOL
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Traders</span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {stats.active_traders_24h}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Broadcasts</span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {stats.total_broadcasts}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Failed to load stats</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            Trending Broadcasts
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20">Hot</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendingLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : trending?.broadcasts?.length ? (
            <div className="space-y-4">
              {trending.broadcasts.slice(0, 4).map((b) => (
                <Link key={b.id} href={`/token/${b.mint}`} className="flex items-center gap-3 hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors" data-testid={`link-trending-${b.id}`}>
                  {b.token_image_uri ? (
                    <img src={b.token_image_uri} alt={b.token_symbol} className="h-8 w-8 rounded-full object-cover bg-muted" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {b.token_symbol?.substring(0, 2) || '?'}
                    </div>
                  )}
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold truncate">{b.token_symbol || 'Unknown'}</span>
                      <span className={`text-xs font-mono font-bold ${b.action === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                        {b.action.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{b.amount_sol?.toFixed(3)} SOL</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">No trending broadcasts</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            New Launches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
            {newTokens.slice(0, 10).map((t, i) => (
              <Link key={`${t.mint}-${i}`} href={`/token/${t.mint}`} className="block group" data-testid={`link-new-${t.mint}`}>
                <div className="text-sm font-medium group-hover:text-primary transition-colors flex justify-between">
                  <span className="truncate pr-2">{t.symbol}</span>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    MC: {t.marketCapSol.toFixed(1)}◎
                  </span>
                </div>
                <div className="text-xs text-muted-foreground font-mono truncate">{t.mint.substring(0, 8)}...</div>
              </Link>
            ))}
            {newTokens.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">Waiting for launches...</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
