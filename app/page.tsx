'use client';

import React from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { LiveFeed } from '@/components/LiveFeed';
import { PortfolioSidebar } from '@/components/PortfolioSidebar';
import { TrendingSection } from '@/components/TrendingSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Top Navigation */}
      <header className="border-b border-gray-800 bg-black/80 backdrop-blur-md z-50 sticky top-0">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold tracking-tighter">ECHOPUMP</div>
            <div className="text-xs text-emerald-400 font-mono">SOLANA • PUMP.FUN</div>
          </div>
          <WalletConnect />
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)] max-w-screen-2xl mx-auto">
        {/* Main Live Feed */}
        <div className="flex-1 overflow-auto border-r border-gray-800">
          <LiveFeed />
        </div>

        {/* Right Sidebar */}
        <div className="w-96 border-l border-gray-800 overflow-auto bg-black">
          <PortfolioSidebar />
          <TrendingSection />
        </div>
      </div>
    </div>
  );
}