import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePumpPortalWS, LiveTrade } from "@/hooks/usePumpPortalWS";
import { TradeCard } from "@/components/TradeCard";
import { Sidebar } from "@/components/Sidebar";
import { CopyTradeDialog } from "@/components/CopyTradeDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useListBroadcasts, useCreateBroadcast } from "@workspace/api-client-react";
import { BroadcastCard } from "@/components/BroadcastCard";
import { BroadcastAfterDialog } from "@/components/BroadcastAfterDialog";
import { Activity } from "lucide-react";

export function Feed() {
  const { connected, publicKey } = useWallet();
  const { liveTrades, newTokens } = usePumpPortalWS();
  const [selectedTrade, setSelectedTrade] = useState<LiveTrade | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [broadcastTrade, setBroadcastTrade] = useState<{ trade: LiveTrade, amount: number, signature: string } | null>(null);
  
  const { data: followingData, isLoading: followingLoading } = useListBroadcasts(
    { following: true, viewer_wallet: publicKey?.toString() },
    { query: { enabled: !!publicKey } }
  );

  const handleCopyTrade = (trade: LiveTrade) => {
    if (!connected) {
      toast.error("Connect wallet first to copy trades");
      return;
    }
    setSelectedTrade(trade);
    setDialogOpen(true);
  };

  const handleTradeSuccess = (signature: string, trade: LiveTrade, amount: number) => {
    setBroadcastTrade({ trade, amount, signature });
  };

  return (
    <div className="container max-w-screen-2xl px-4 md:px-8 py-6">
      <div className="flex gap-8">
        <div className="flex-1 max-w-3xl space-y-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold font-mono tracking-tighter uppercase flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Live Feed
              </h1>
              <TabsList className="grid w-[200px] grid-cols-2 bg-muted/50">
                <TabsTrigger value="all" className="font-bold text-xs uppercase tracking-wider" data-testid="tab-all">All</TabsTrigger>
                <TabsTrigger value="following" className="font-bold text-xs uppercase tracking-wider" disabled={!connected} data-testid="tab-following">Following</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="space-y-4 mt-0 outline-none">
              {liveTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
                  <span className="h-3 w-3 rounded-full bg-primary animate-pulse mb-4"></span>
                  <p className="font-mono text-sm">Listening to Pump.fun...</p>
                </div>
              ) : (
                liveTrades.map((trade, i) => (
                  <TradeCard 
                    key={`${trade.mint}-${trade.timestamp}-${i}`} 
                    trade={trade} 
                    onCopyTrade={handleCopyTrade} 
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="following" className="space-y-4 mt-0 outline-none">
              {!connected ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                  Connect wallet to see following feed
                </div>
              ) : followingLoading ? (
                <div className="text-center py-10">Loading...</div>
              ) : followingData?.broadcasts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                  You aren't following anyone yet, or they haven't broadcasted anything.
                </div>
              ) : (
                followingData?.broadcasts.map((broadcast) => (
                  <BroadcastCard key={broadcast.id} broadcast={broadcast} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <Sidebar newTokens={newTokens} />
      </div>

      <CopyTradeDialog 
        trade={selectedTrade} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={handleTradeSuccess}
      />
      
      {broadcastTrade && (
        <BroadcastAfterDialog 
          trade={broadcastTrade.trade}
          amount={broadcastTrade.amount}
          signature={broadcastTrade.signature}
          open={!!broadcastTrade}
          onOpenChange={(open) => !open && setBroadcastTrade(null)}
        />
      )}
    </div>
  );
}
