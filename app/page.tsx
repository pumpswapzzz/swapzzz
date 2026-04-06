'use client';

import React from 'react';
import WalletConnect from '@/components/WalletConnect';
import LiveFeed from '@/components/LiveFeed';
import PortfolioSidebar from '@/components/PortfolioSidebar';

export default function EchoPumpHome() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4 flex items-center justify-between bg-black sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold tracking-tighter">ECHOPUMP</div>
          <div className="text-sm text-emerald-400 font-mono">PUMP.FUN SOCIAL</div>
        </div>
        <WalletConnect />
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Main Live Feed Area */}
        <div className="flex-1 overflow-auto p-4">
          <LiveFeed />
        </div>

        {/* Right Sidebar */}
        <div className="w-96 border-l border-gray-800 overflow-auto p-4 bg-zinc-950">
          <PortfolioSidebar />
        </div>
      </div>
    </div>
  );
}