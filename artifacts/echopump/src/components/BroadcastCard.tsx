import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Heart, MessageSquare, Copy } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TokenBadge } from "./TokenBadge";
import { Broadcast } from "@workspace/api-client-react";
import { useLikeBroadcast } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetLikesQueryKey } from "@workspace/api-client-react";
import { CopyTradeDialog } from "./CopyTradeDialog";
import { LiveTrade } from "@/hooks/usePumpPortalWS";

export function BroadcastCard({ broadcast }: { broadcast: Broadcast }) {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();
  const isBuy = broadcast.action === "buy";
  
  const { mutate: likeBroadcast, isPending: isLiking } = useLikeBroadcast();
  
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  const handleLike = () => {
    if (!publicKey) return;
    likeBroadcast(
      { broadcastId: broadcast.id, data: { wallet_address: publicKey.toString() } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getGetLikesQueryKey(broadcast.id) });
          // Ideally we would optimistic update or use a separate hook for the like state,
          // but for simplicity we invalidate or let the parent handle real-time likes.
        }
      }
    );
  };

  const handleCopyTrade = () => {
    setCopyDialogOpen(true);
  };

  const pseudoTrade: LiveTrade = {
    mint: broadcast.mint,
    traderPublicKey: broadcast.wallet_address,
    txType: broadcast.action,
    solAmount: broadcast.amount_sol || 0,
    tokenAmount: broadcast.token_amount || 0,
    timestamp: new Date(broadcast.created_at).getTime(),
    name: broadcast.token_name || '',
    symbol: broadcast.token_symbol || '',
    uri: broadcast.token_image_uri || '',
    is_migrated: broadcast.is_migrated,
  };

  return (
    <>
      <Card className="bg-card border-border overflow-hidden hover:border-border/80 transition-colors animate-in slide-in-from-top-2 fade-in duration-300">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <Link href={`/token/${broadcast.mint}`} className="shrink-0" data-testid={`link-token-img-${broadcast.mint}`}>
              {broadcast.token_image_uri ? (
                <img src={broadcast.token_image_uri} alt={broadcast.token_symbol} className="h-12 w-12 rounded-lg object-cover bg-muted border border-border" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-muted border border-border flex items-center justify-center text-sm font-bold">
                  {broadcast.token_symbol?.substring(0, 2) || '?'}
                </div>
              )}
            </Link>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/u/${broadcast.wallet_address}`} className="text-sm font-medium hover:underline flex items-center gap-1" data-testid={`link-user-${broadcast.wallet_address}`}>
                    <span className="text-muted-foreground">@</span>
                    {broadcast.username || `${broadcast.wallet_address.substring(0, 4)}...${broadcast.wallet_address.substring(broadcast.wallet_address.length - 4)}`}
                  </Link>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(broadcast.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-black tracking-widest uppercase ${isBuy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {broadcast.action}
                </div>
              </div>
              
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <Link href={`/token/${broadcast.mint}`} className="font-bold text-lg hover:text-primary transition-colors truncate max-w-[200px]" data-testid={`link-token-${broadcast.mint}`}>
                  ${broadcast.token_symbol}
                </Link>
                <TokenBadge isMigrated={broadcast.is_migrated} />
              </div>
              
              {broadcast.message && (
                <p className="text-sm text-foreground/90 mb-3">
                  {broadcast.message}
                </p>
              )}
              
              <div className="font-mono text-sm mb-4 p-2 bg-muted/30 rounded border border-border/50 inline-block">
                <span className={isBuy ? 'text-green-400' : 'text-red-400'}>
                  {broadcast.amount_sol?.toFixed(4)} SOL
                </span>
                <span className="text-muted-foreground mx-2">for</span>
                <span className="text-foreground">
                  {((broadcast.token_amount || 0) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M tokens
                </span>
              </div>
              
              <div className="flex items-center gap-4 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10" 
                  onClick={handleLike}
                  disabled={isLiking}
                  data-testid={`btn-like-${broadcast.id}`}
                >
                  <Heart className={`h-4 w-4 mr-1.5 ${broadcast.likes_count > 0 ? 'fill-primary text-primary' : ''}`} />
                  <span className="text-xs font-medium">{broadcast.likes_count || 'Like'}</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 ml-auto bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={handleCopyTrade}
                  data-testid={`btn-copy-${broadcast.mint}`}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Copy Trade</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <CopyTradeDialog 
        trade={pseudoTrade} 
        open={copyDialogOpen} 
        onOpenChange={setCopyDialogOpen}
        onSuccess={() => {}} // Additional action if needed
      />
    </>
  );
}
