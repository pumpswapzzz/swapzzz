import { useParams } from "wouter";
import { usePumpPortalWS } from "@/hooks/usePumpPortalWS";
import { useListBroadcasts } from "@workspace/api-client-react";
import { BroadcastCard } from "@/components/BroadcastCard";
import { TokenBadge } from "@/components/TokenBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, LineChart } from "lucide-react";

export function Token() {
  const { mint } = useParams();
  const { newTokens, migratedMints } = usePumpPortalWS();
  const { data: broadcastsData, isLoading } = useListBroadcasts({ mint });

  const tokenFromWS = newTokens.find((t) => t.mint === mint);
  const isMigrated = migratedMints.has(mint || "");

  // Try to extract token details from broadcasts if not in WS
  const firstBroadcast = broadcastsData?.broadcasts[0];
  
  const tokenName = tokenFromWS?.name || firstBroadcast?.token_name || "Unknown Token";
  const tokenSymbol = tokenFromWS?.symbol || firstBroadcast?.token_symbol || "UNKNOWN";
  const tokenUri = tokenFromWS?.uri || firstBroadcast?.token_image_uri;

  if (!mint) return <div>Invalid token mint</div>;

  return (
    <div className="container max-w-screen-xl px-4 md:px-8 py-8 space-y-8">
      <Card className="bg-card border-border">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="shrink-0">
              {tokenUri ? (
                <img src={tokenUri} alt={tokenSymbol} className="h-24 w-24 rounded-2xl object-cover bg-muted border border-border" />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-muted border border-border flex items-center justify-center text-2xl font-bold">
                  {tokenSymbol.substring(0, 2)}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight">${tokenSymbol}</h1>
                <TokenBadge isMigrated={isMigrated || (firstBroadcast?.is_migrated ?? false)} />
              </div>
              <p className="text-lg text-muted-foreground mb-4">{tokenName}</p>
              
              <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground bg-muted/50 p-2 rounded w-fit">
                <Coins className="h-4 w-4" />
                <span>Mint: <span className="text-foreground">{mint}</span></span>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px] bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm mb-2">
                <LineChart className="h-4 w-4" /> Market Info
              </div>
              {tokenFromWS ? (
                <div>
                  <p className="text-xs text-muted-foreground">Est. Market Cap</p>
                  <p className="text-xl font-mono font-bold">{tokenFromWS.marketCapSol.toFixed(2)} SOL</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No live data available yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-mono uppercase tracking-tighter">Recent Broadcasts</h2>
        {isLoading ? (
          <div className="text-center py-10">Loading trades...</div>
        ) : broadcastsData?.broadcasts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
            No broadcasts for this token yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {broadcastsData?.broadcasts.map((broadcast) => (
              <BroadcastCard key={broadcast.id} broadcast={broadcast} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
