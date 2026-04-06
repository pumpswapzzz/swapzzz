'use client';

import { useEffect, useState, useRef } from 'react';
import { env } from '@/lib/env';

interface Trade {
  mint: string;
  token?: { name?: string; symbol?: string; image?: string };
  txType: 'buy' | 'sell' | 'create';
  solAmount?: number;
  tokenAmount?: number;
  price?: number;
  signature: string;
  traderPublicKey?: string;
  timestamp?: number;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function LiveFeed() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [status, setStatus] = useState('Connecting to PumpPortal...');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = env.NEXT_PUBLIC_PUMP_PORTAL_API_KEY
      ? `wss://pumpportal.fun/api/data?api-key=${env.NEXT_PUBLIC_PUMP_PORTAL_API_KEY}`
      : 'wss://pumpportal.fun/api/data';

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('✅ Connected to PumpPortal - Listening for trades');
      ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
      ws.send(JSON.stringify({ method: 'subscribeTokenTrade', keys: [] }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket data received:', data);

        let trade: Trade | null = null;

        if (data.txType === 'buy' || data.txType === 'sell') {
          trade = {
            mint: data.mint,
            token: data.token,
            txType: data.txType,
            solAmount: Number(data.solAmount ?? data.sol_amount ?? data.amount ?? 0),
            tokenAmount: Number(data.tokenAmount ?? data.token_amount ?? 0),
            price: Number(data.price ?? data.price_sol ?? data.pricePerToken ?? 0),
            signature: data.signature,
            traderPublicKey: data.traderPublicKey || data.user,
            timestamp: Date.now(),
          };
        } else if (data.txType === 'create' || data.type === 'create') {
          trade = {
            mint: data.mint,
            token: { name: data.name || 'New Token', image: data.image, symbol: data.symbol },
            txType: 'create',
            solAmount: Number(data.initialBuy ?? 0),
            tokenAmount: undefined,
            price: undefined,
            signature: data.signature,
            traderPublicKey: data.traderPublicKey || data.creator,
            timestamp: Date.now(),
          };
        }

        if (trade) {
          setTrades((prev) => [trade, ...prev].slice(0, 30));
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = () => setStatus('❌ WebSocket error');
    ws.onclose = () => setStatus('Disconnected from PumpPortal');

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="text-green-400 text-sm font-medium">{status}</div>

      {trades.length === 0 && (
        <div className="text-gray-400 text-center py-8">Waiting for first trades...</div>
      )}

      {trades.map((trade, index) => {
        const imageSrc =
          trade.token?.image ||
          `https://via.placeholder.com/48/4F46E5/FFFFFF?text=${encodeURIComponent(trade.token?.symbol || '?')}`;
        const displayName = trade.token?.name || `${trade.mint.slice(0, 8)}...`;
        const displaySymbol = trade.token?.symbol || 'TOKEN';
        const isBuy = trade.txType === 'buy';

        return (
          <div
            key={`${trade.signature || trade.mint}-${index}`}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-purple-500 transition-all"
          >
            <div className="flex gap-4">
              <img
                src={imageSrc}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = 'https://via.placeholder.com/48/4F46E5/FFFFFF?text=?';
                }}
              />

              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{displayName}</div>
                <div className="text-xs text-gray-500 font-mono truncate">{trade.mint}</div>

                <div
                  className={`mt-1 text-sm font-medium flex items-center gap-2 ${
                    trade.txType === 'buy'
                      ? 'text-green-500'
                      : trade.txType === 'sell'
                      ? 'text-red-500'
                      : 'text-purple-400'
                  }`}
                >
                  {trade.txType.toUpperCase()}
                  {trade.solAmount ? `• ${trade.solAmount.toFixed(4)} SOL` : null}
                </div>
              </div>

              <button
                onClick={() => navigator.clipboard.writeText(trade.mint)}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm whitespace-nowrap"
              >
                Copy CA
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
