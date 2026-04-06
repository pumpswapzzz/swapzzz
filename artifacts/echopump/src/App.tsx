import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo } from "react";
import NotFound from "@/pages/not-found";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Feed } from "@/pages/Feed";
import { Trending } from "@/pages/Trending";
import { Leaderboard } from "@/pages/Leaderboard";
import { Profile } from "@/pages/Profile";
import { Token } from "@/pages/Token";
import { usePumpPortalWS } from "@/hooks/usePumpPortalWS";

import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary">
      <Navbar connectionStatus={"connected"} />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Feed} />
          <Route path="/trending" component={Trending} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/u/:wallet" component={Profile} />
          <Route path="/token/:mint" component={Token} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function AppContent() {
  const { connectionStatus } = usePumpPortalWS();
  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary/30 selection:text-primary">
      <Navbar connectionStatus={connectionStatus} />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Feed} />
          <Route path="/trending" component={Trending} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/u/:wallet" component={Profile} />
          <Route path="/token/:mint" component={Token} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const endpoint = "https://api.mainnet-beta.solana.com";
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AppContent />
              </WouterRouter>
              <Toaster theme="dark" position="bottom-right" />
            </TooltipProvider>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
