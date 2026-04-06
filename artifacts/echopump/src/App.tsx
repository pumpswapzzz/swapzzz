import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo, useEffect, useState } from "react";
import NotFound from "@/pages/not-found";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Feed } from "@/pages/Feed";
import { Trending } from "@/pages/Trending";
import { Leaderboard } from "@/pages/Leaderboard";
import { Profile } from "@/pages/Profile";
import { Token } from "@/pages/Token";
import { usePumpPortal } from "@/context/PumpPortalContext";
import { PumpPortalProvider } from "@/context/PumpPortalContext";
import { supabase } from "@/lib/supabase";

import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

function AppContent() {
  const { connectionStatus, wsError } = usePumpPortalWS();
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  useEffect(() => {
    console.log('[Supabase] Setting up realtime channels...');
    const channel = supabase.channel('echopump-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, (payload) => {
        console.log('[Supabase realtime] broadcasts change:', payload);
        queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, (payload) => {
        console.log('[Supabase realtime] likes change:', payload);
        queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, (payload) => {
        console.log('[Supabase realtime] follows change:', payload);
        queryClient.invalidateQueries({ queryKey: ['follows'] });
      })
      .subscribe((status, err) => {
        console.log('[Supabase realtime] channel status:', status, err || '');
        if (status === 'SUBSCRIBED') {
          setSupabaseStatus('connected');
          console.log('[Supabase] Realtime connected ✓');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setSupabaseStatus('disconnected');
          console.error('[Supabase] Realtime error:', status, err);
        } else {
          setSupabaseStatus('connecting');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary/30 selection:text-primary">
      <Navbar connectionStatus={connectionStatus} supabaseStatus={supabaseStatus} wsError={wsError} />
      {wsError && (
        <div className="bg-red-950/80 border-b border-red-500/30 px-4 py-2 text-xs text-red-400 font-mono text-center">
          ⚠ WebSocket: {wsError}
        </div>
      )}
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
