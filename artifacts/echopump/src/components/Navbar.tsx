import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Link, useLocation } from "wouter";
import { Activity, TrendingUp, Trophy, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavbarProps {
  connectionStatus: string;
  supabaseStatus: string;
  wsError?: string | null;
}

export function Navbar({ connectionStatus, supabaseStatus, wsError }: NavbarProps) {
  const [location] = useLocation();
  const { connected } = useWallet();

  const links = [
    { href: "/", label: "Feed", icon: Activity },
    { href: "/trending", label: "Trending", icon: TrendingUp },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  const wsColor =
    connectionStatus === "connected"
      ? "bg-green-500"
      : connectionStatus === "connecting"
      ? "bg-yellow-500 animate-pulse"
      : connectionStatus === "error"
      ? "bg-red-500"
      : "bg-gray-600";

  const wsLabel =
    connectionStatus === "connected"
      ? "PumpPortal WS: Connected ✓"
      : connectionStatus === "connecting"
      ? "PumpPortal WS: Connecting..."
      : connectionStatus === "error"
      ? `PumpPortal WS: Error – ${wsError || 'unknown'}`
      : "PumpPortal WS: Disconnected";

  const sbColor =
    supabaseStatus === "connected"
      ? "bg-blue-400"
      : supabaseStatus === "connecting"
      ? "bg-blue-400/40 animate-pulse"
      : "bg-red-500";

  const sbLabel =
    supabaseStatus === "connected"
      ? "Supabase Realtime: Connected ✓"
      : supabaseStatus === "connecting"
      ? "Supabase Realtime: Connecting..."
      : "Supabase Realtime: Disconnected";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-mono text-xl font-bold tracking-tighter text-primary">
              ECHO<span className="text-foreground">PUMP</span>
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-foreground/80 ${
                  location === link.href ? "text-foreground" : "text-foreground/60"
                }`}
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                <div className="flex items-center gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-mono text-xl font-bold tracking-tighter text-primary">
                ECHO<span className="text-foreground">PUMP</span>
              </span>
            </Link>
            <div className="my-4 flex flex-col space-y-3 pb-4 pl-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-foreground/80 ${
                    location === link.href ? "text-foreground" : "text-foreground/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </div>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-end space-x-3">
          <div className="hidden sm:flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-default" data-testid="ws-status">
                  <div className={`h-2 w-2 rounded-full ${wsColor}`} />
                  <span className="text-xs text-muted-foreground font-mono hidden lg:block">
                    {connectionStatus === 'connected' ? 'WS ✓' : connectionStatus === 'error' ? 'WS ✗' : 'WS...'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs font-mono">{wsLabel}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-default" data-testid="sb-status">
                  <div className={`h-2 w-2 rounded-full ${sbColor}`} />
                  <span className="text-xs text-muted-foreground font-mono hidden lg:block">
                    {supabaseStatus === 'connected' ? 'SB ✓' : 'SB...'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs font-mono">{sbLabel}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !h-9 !px-4 !py-2 !rounded-md !text-sm !font-medium" />
        </div>
      </div>
    </nav>
  );
}
