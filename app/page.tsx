'use client';

import React from 'react';
import WalletConnect from '@/components/WalletConnect';
import LiveFeed from '@/components/LiveFeed';
import PortfolioSidebar from '@/components/PortfolioSidebar';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 bg-black z-50">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold tracking-tighter">ECHOPUMP</div>
          <div className="text-emerald-400 text-sm font-mono">SOLANA • PUMP.FUN</div>
        </div>
        <WalletConnect />
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Main Live Feed */}
        <div className="flex-1 overflow-auto">
          <LiveFeed />
        </div>

        {/* Right Sidebar */}
        <div className="w-96 border-l border-gray-800 overflow-auto bg-zinc-950">
          <PortfolioSidebar />
        </div>
      </div>
    </div>
  );
}