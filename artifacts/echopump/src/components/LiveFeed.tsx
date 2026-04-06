'use client';

import { useEffect, useState } from 'react';

interface Trade {
  mint: string;
  name?: string;
  symbol?: string;
  image?: string;
  uri?: string;
  txType: 'buy' | 'sell' | 'create';
  solAmount?: number;
  tokenAmount?: number;
  initialBuy?: number;
  signature: string;
  timestamp: number;
}

export default function LiveFeed() {
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [status, setStatus] = useState('Connecting to PumpPortal...');

  useEffect(() => {
    const pumpApiKey = process.env.NEXT_PUBLIC_PUMP_PORTAL_API_KEY || '';
    const wsUrl = pumpApiKey
      ? `wss://pumpportal.fun/api/data?api-key=${pumpApiKey}`
      : 'wss://pumpportal.fun/api/data';

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setStatus('✅ Connected - Listening for real buy/sell trades');
      console.log('✅ PumpPortal WebSocket connected');
      ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
      ws.send(JSON.stringify({ method: 'subscribeTokenTrade', keys: [] })); // all trades
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('PumpPortal message:', data);

        let trade: Trade | null = null;

        if (data.txType === 'buy' || data.txType === 'sell') {
          trade = {
            mint: data.mint,
            name: data.name,
            symbol: data.symbol,
            image: data.image || data.uri || data.metadata?.uri,
            txType: data.txType,
            solAmount: data.solAmount,
            tokenAmount: data.tokenAmount,
            signature: data.signature,
            timestamp: Date.now(),
          };
        } else if (data.txType === 'create' || data.method === 'createEventNotification') {
          trade = {
            mint: data.mint,
            name: data.name || 'New Token',
            symbol: data.symbol,
            image: data.image || data.uri || data.metadata?.uri,
            txType: 'create',
            initialBuy: data.initialBuy,
            signature: data.signature,
            timestamp: Date.now(),
          };
        }

        if (trade) {
          setLiveTrades((prev) => [trade!, ...prev].slice(0, 50));
        }
      } catch (e) {
        console.error('Failed to parse PumpPortal message', e);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
      setStatus('❌ WebSocket error');
    };
    ws.onclose = () => {
      console.log('WebSocket closed');
      setStatus('Disconnected from PumpPortal');
    };

    return () => ws.close();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Live Feed</h2>
        <div className="text-xs text-green-400 font-medium">{status}</div>
      </div>

      <div className="space-y-3">
        {liveTrades.length === 0 ? (
          <div className="text-gray-400 text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800">
            Waiting for first trades...
          </div>
        ) : (
          liveTrades.map((trade, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 hover:border-purple-500 rounded-2xl p-4 flex gap-4 transition-all"
            >
              <img
                src={
                  trade.image ||
                  `https://via.placeholder.com/48/4F46E5/FFFFFF?text=${encodeURIComponent(
                    trade.symbol || '?'
                  )}`
                }
                alt={trade.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/48/4F46E5/FFFFFF?text=?';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">
                  {trade.name || (trade.mint?.slice(0, 10) ?? '---') + '...'}
                </div>
                <div className="text-xs text-gray-500 font-mono truncate">{trade.mint}</div>
                <div
                  className={`mt-2 text-sm font-medium flex items-center gap-2 ${
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
                onClick={() => {
                  navigator.clipboard.writeText(trade.mint);
                }}
                className="self-start bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition"
              >
                Copy CA
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}