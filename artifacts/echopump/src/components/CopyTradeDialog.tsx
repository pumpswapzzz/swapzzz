import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { VersionedTransaction, Connection } from "@solana/web3.js";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiveTrade } from "@/hooks/usePumpPortalWS";

interface CopyTradeDialogProps {
  trade: LiveTrade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (txSignature: string, trade: LiveTrade, amount: number) => void;
}

export function CopyTradeDialog({ trade, open, onOpenChange, onSuccess }: CopyTradeDialogProps) {
  const { publicKey, signTransaction } = useWallet();
  const [amount, setAmount] = useState<string>(trade?.solAmount.toString() || "0.1");
  const [isLoading, setIsLoading] = useState(false);

  // Update amount when trade changes
  if (trade && open && amount === "0.1" && trade.solAmount.toString() !== amount) {
    setAmount(trade.solAmount.toFixed(4));
  }

  const handleCopyTrade = async () => {
    if (!trade || !publicKey || !signTransaction) {
      toast.error("Wallet not connected");
      return;
    }

    const solAmount = parseFloat(amount);
    if (isNaN(solAmount) || solAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("https://pumpportal.fun/api/trade-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.toString(),
          action: trade.txType,
          mint: trade.mint,
          amount: solAmount,
          denominatedInSol: "true",
          slippage: 10,
          priorityFee: 0.005,
          pool: "auto"
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.arrayBuffer();
      const tx = VersionedTransaction.deserialize(new Uint8Array(data));
      
      const signedTx = await signTransaction(tx);
      
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">Trade executed! 🎉</span>
          <a 
            href={`https://solscan.io/tx/${signature}`} 
            target="_blank" 
            rel="noreferrer"
            className="text-xs underline text-primary"
          >
            View on Solscan →
          </a>
        </div>
      );
      
      onSuccess(signature, trade, solAmount);
      onOpenChange(false);
    } catch (error) {
      console.error("Trade failed:", error);
      toast.error("Transaction failed – try higher priority fee");
    } finally {
      setIsLoading(false);
    }
  };

  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl uppercase tracking-wider text-primary">
            Copy {trade.txType}
          </DialogTitle>
          <DialogDescription>
            You are copying a {trade.txType} of ${trade.symbol}. 
            Adjust the SOL amount if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right font-mono">
              SOL Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3 font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCopyTrade} disabled={isLoading} className="font-bold tracking-wider uppercase" data-testid="btn-confirm-copy">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Execute Trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
