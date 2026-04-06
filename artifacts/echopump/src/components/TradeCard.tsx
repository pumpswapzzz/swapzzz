import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Copy, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TokenBadge } from "./TokenBadge";
import { LiveTrade } from "@/hooks/usePumpPortalWS";

function TokenImage({ imageUri, symbol }: { imageUri: string; symbol: string }) {
  if (!imageUri) {
    return (
      <div className="h-12 w-12 rounded-lg bg-muted border border-border flex items-center justify-center text-sm font-bold text-muted-foreground">
        {symbol?.substring(0, 2) || '?'}
      </div>
    );
  }
  return (
    <img
      src={imageUri}
      alt={symbol}
      className="h-12 w-12 rounded-lg object-cover bg-muted border border-border"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
        if (fallback) fallback.style.display = 'flex';
      }}
    />
  );
}

export function TradeCard({ trade, onCopyTrade }: { trade: LiveTrade; onCopyTrade: (trade: LiveTrade) => void }) {
  const isBuy = trade.txType === "buy";
  const shortWallet = `${trade.traderPublicKey.substring(0, 4)}...${trade.traderPublicKey.substring(trade.traderPublicKey.length - 4)}`;
  const timeAgo = formatDistanceToNow(trade.timestamp, { addSuffix: true });
  const tokenDisplay = trade.symbol ? `$${trade.symbol}` : trade.mint.substring(0, 8) + '...';
  const solFormatted = trade.solAmount.toFixed(4);
  const tokenFormatted = trade.tokenAmount >= 1_000_000
    ? `${(trade.tokenAmount / 1_000_000).toFixed(2)}M`
    : trade.tokenAmount >= 1_000
    ? `${(trade.tokenAmount / 1_000).toFixed(2)}K`
    : trade.tokenAmount.toFixed(2);

  return (
    <Card className="bg-card border-border overflow-hidden hover:border-border/80 transition-colors animate-in slide-in-from-top-2 fade-in duration-300">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <Link href={`/token/${trade.mint}`} className="shrink-0" data-testid={`link-token-img-${trade.mint}`}>
            <div className="relative">
              <TokenImage imageUri={trade.imageUri} symbol={trade.symbol} />
              <div
                style={{ display: 'none' }}
                className="h-12 w-12 rounded-lg bg-muted border border-border flex items-center justify-center text-sm font-bold text-muted-foreground absolute inset-0"
              >
                {trade.symbol?.substring(0, 2) || '?'}
              </div>
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/u/${trade.traderPublicKey}`}
                  className="text-sm font-medium hover:underline flex items-center gap-1"
                  data-testid={`link-user-${trade.traderPublicKey}`}
                >
                  <span className="text-muted-foreground">@</span>
                  <span className="font-mono">{shortWallet}</span>
                </Link>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground font-mono">{timeAgo}</span>
              </div>
              <div
                className={`px-2 py-0.5 rounded text-xs font-black tracking-widest uppercase ${
                  isBuy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {trade.txType}
              </div>
            </div>

            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <Link
                href={`/token/${trade.mint}`}
                className="font-bold text-lg hover:text-primary transition-colors truncate max-w-[200px]"
                data-testid={`link-token-${trade.mint}`}
              >
                {tokenDisplay}
              </Link>
              {trade.name && <span className="text-xs text-muted-foreground truncate">{trade.name}</span>}
              <TokenBadge isMigrated={trade.is_migrated} />
            </div>

            <div className="font-mono text-sm mb-3 p-2 bg-muted/30 rounded border border-border/50 inline-flex items-center gap-1">
              <span className={isBuy ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {solFormatted} SOL
              </span>
              <span className="text-muted-foreground mx-1">→</span>
              <span className="text-foreground">{tokenFormatted} tokens</span>
              {trade.marketCapSol != null && (
                <>
                  <span className="text-muted-foreground mx-1">·</span>
                  <span className="text-muted-foreground text-xs">MC: {trade.marketCapSol.toFixed(1)}◎</span>
                </>
              )}
            </div>

            {trade.mint && (
              <div className="flex items-center gap-1 mb-3">
                <span className="text-xs text-muted-foreground font-mono truncate">CA: {trade.mint.substring(0, 16)}...</span>
                <button
                  className="text-xs text-muted-foreground hover:text-primary ml-1"
                  onClick={() => navigator.clipboard.writeText(trade.mint)}
                  title="Copy contract address"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                data-testid="btn-like"
              >
                <Heart className="h-4 w-4 mr-1.5" />
                <span className="text-xs font-medium">Like</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 ml-auto bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => onCopyTrade(trade)}
                data-testid={`btn-copy-${trade.mint}`}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Copy Trade</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
