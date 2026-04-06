import { Badge } from "@/components/ui/badge";

export function TokenBadge({ isMigrated }: { isMigrated: boolean }) {
  if (isMigrated) {
    return (
      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0">
        PumpSwap
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0">
      Bonding Curve
    </Badge>
  );
}
