'use client';

import React from 'react';
import { usePumpPortalWS } from '@/hooks/usePumpPortalWS';

export function TrendingSection() {
  const { newTokens } = usePumpPortalWS();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Trending Tokens</h2>
      <div className="space-y-3">
        {newTokens.slice(0, 10).map((token, index) => (
          <div key={token.mint} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800 transition-colors">
            <div className="flex items-start gap-3">
              <img
                src={token.imageUri || '/placeholder-token.png'}
                alt={token.name}
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-token.png';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-white truncate">{token.name}</span>
                  <span className="text-sm text-zinc-400">({token.symbol})</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-zinc-300">
                    Initial Buy: {token.initialBuy.toFixed(4)} SOL
                  </div>
                  <div className="text-zinc-500">
                    MC: {token.marketCapSol?.toFixed(2)} SOL
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {newTokens.length === 0 && (
          <div className="text-center text-zinc-500 py-8">
            No new tokens yet
          </div>
        )}
      </div>
    </div>
  );
}