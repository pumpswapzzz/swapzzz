'use client';

import { useEffect, useState } from 'react';

export function PumpPortalProvider({ children }: { children: React.ReactNode }) {
  const [liveTrades, setLiveTrades] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting to PumpPortal...');

  useEffect(() => {
    const API_KEY = process.env.NEXT_PUBLIC_PUMP_PORTAL_API_KEY || '';
    const wsUrl = API_KEY
      ? `wss://pumpportal.fun/api/data?api-key=${API_KEY}`
      : 'wss://pumpportal.fun/api/data';

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionStatus('✅ Connected - Listening for real buy/sell trades');
      console.log('PumpPortal WebSocket connected');
      ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
      ws.send(JSON.stringify({ method: 'subscribeTokenTrade', keys: [] }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        let trade: any = null;

        if (data.txType === 'buy' || data.txType === 'sell') {
          trade = {
            mint: data.mint,
            name: data.name || data.token?.name,
            symbol: data.symbol || data.token?.symbol,
            image: data.image || data.metadata?.image || data.uri || data.token?.image,
            txType: data.txType,
            solAmount: data.solAmount,
            tokenAmount: data.tokenAmount,
            signature: data.signature,
            timestamp: Date.now(),
          };
        } else if (data.txType === 'create' || data.method?.includes('create')) {
          trade = {
            mint: data.mint,
            name: data.name || 'New Token',
            symbol: data.symbol,
            image: data.image || data.metadata?.image || data.uri,
            txType: 'create',
            initialBuy: data.initialBuy,
            signature: data.signature,
            timestamp: Date.now(),
          };
        }

        if (trade) {
          setLiveTrades((prev) => [trade, ...prev].slice(0, 60));
        }
      } catch (e) {
        console.error('Failed to parse PumpPortal message:', e);
      }
    };

    ws.onerror = () => setConnectionStatus('❌ WebSocket error - reconnecting...');
    ws.onclose = () => setConnectionStatus('Disconnected - reconnecting...');

    return () => ws.close();
  }, []);

  return (
    <>
      {children}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950 border-r border-zinc-800">
        <div className="sticky top-0 bg-zinc-950 pb-3 border-b border-zinc-800 z-10">
          <div className="text-green-400 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {connectionStatus}
          </div>
        </div>

        {liveTrades.length === 0 && (
          <div className="text-gray-400 text-center py-12">Waiting for first trades...</div>
        )}

        {liveTrades.map((trade, index) => (
          <div
            key={`${trade.signature}-${index}`}
            className="bg-zinc-900 border border-zinc-800 hover:border-purple-500 rounded-2xl p-4 flex gap-4 transition-all"
          >
            <img
              src={
                trade.image ||
                `https://via.placeholder.com/48/4F46E5/FFFFFF?text=${encodeURIComponent(trade.symbol?.[0] || '?')}`
              }
              alt={trade.name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48/4F46E5/FFFFFF?text=?';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{trade.name || (trade.mint?.slice(0, 12) ?? '---') + '...'}</div>
              <div className="text-xs text-gray-500 font-mono break-all mt-0.5">{trade.mint}</div>

              <div
                className={`mt-2 text-sm font-semibold flex items-center gap-2 ${
                  trade.txType === 'buy'
                    ? 'text-green-500'
                    : trade.txType === 'sell'
                    ? 'text-red-500'
                    : 'text-purple-400'
                }`}
              >
                {trade.txType.toUpperCase()}
                {trade.solAmount && ` • ${Number(trade.solAmount).toFixed(4)} SOL`}
              </div>
            </div>

            <button
              onClick={() => navigator.clipboard.writeText(trade.mint)}
              className="self-start px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-medium whitespace-nowrap transition"
            >
              Copy CA
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

// Stub exports for backward compatibility
export function usePumpPortal() {
  return { liveTrades: [], connectionStatus: 'Disconnected' };
}

export function resolveTokenImage(image: string | undefined, symbol: string = ''): string {
  if (image) return image;
  if (!symbol) return 'https://via.placeholder.com/48/4F46E5/FFFFFF?text=?';
  return `https://via.placeholder.com/48/4F46E5/FFFFFF?text=${encodeURIComponent(symbol[0])}`;
}

// Type exports for backward compatibility
export type LiveTrade = {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  txType: 'buy' | 'sell' | 'create';
  solAmount?: number;
  tokenAmount?: number;
  signature: string;
  timestamp: number;
};

export type NewToken = {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  creator: string;
  signature: string;
  timestamp: number;
};

