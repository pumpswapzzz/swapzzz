import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateBroadcast } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LiveTrade } from "@/hooks/usePumpPortalWS";

interface BroadcastAfterDialogProps {
  trade: LiveTrade;
  amount: number;
  signature: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BroadcastAfterDialog({ trade, amount, signature, open, onOpenChange }: BroadcastAfterDialogProps) {
  const { publicKey } = useWallet();
  const [message, setMessage] = useState("");
  const { mutate: createBroadcast, isPending } = useCreateBroadcast();

  const handleBroadcast = () => {
    if (!publicKey) return;

    createBroadcast({
      data: {
        wallet_address: publicKey.toString(),
        mint: trade.mint,
        token_name: trade.name,
        token_symbol: trade.symbol,
        token_image_uri: trade.uri,
        action: trade.txType,
        amount_sol: amount,
        token_amount: trade.tokenAmount,
        message: message,
        tx_signature: signature,
        is_migrated: trade.is_migrated,
      }
    }, {
      onSuccess: () => {
        toast.success("Broadcast posted successfully!");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Failed to post broadcast");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl uppercase tracking-wider text-primary">
            Trade Successful! 🎉
          </DialogTitle>
          <DialogDescription>
            Want to broadcast this trade to your followers?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Add an optional message (max 140 chars)..."
            maxLength={140}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none h-24"
            data-testid="input-broadcast-message"
          />
          <div className="text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded border border-border/50">
            {trade.txType.toUpperCase()} {amount} SOL of {trade.symbol}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            Skip
          </Button>
          <Button onClick={handleBroadcast} disabled={isPending} className="font-bold tracking-wider uppercase bg-primary text-primary-foreground hover:bg-primary/90" data-testid="btn-broadcast">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign & Broadcast
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
