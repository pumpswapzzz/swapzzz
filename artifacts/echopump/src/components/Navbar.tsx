import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Link, useLocation } from "wouter";
import { Activity, TrendingUp, Trophy, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar({ connectionStatus }: { connectionStatus: string }) {
  const [location] = useLocation();
  const { connected } = useWallet();

  const links = [
    { href: "/", label: "Feed", icon: Activity },
    { href: "/trending", label: "Trending", icon: TrendingUp },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

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
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Optional search or other controls */}
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              title={`WebSocket: ${connectionStatus}`}
              data-testid="ws-status"
            />
            <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !h-9 !px-4 !py-2 !rounded-md !text-sm !font-medium" />
          </div>
        </div>
      </div>
    </nav>
  );
}
