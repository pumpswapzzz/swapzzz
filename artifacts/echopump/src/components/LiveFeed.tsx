'use client';

import { useEffect, useState } from 'react';
import { env } from '../lib/env';

interface TradeEvent {
  mint: string;
  name?: string;
  symbol?: string;
  image?: string;
  txType: 'buy' | 'sell' | 'create';
  solAmount?: number;
  tokenAmount?: number;
  marketCapSol?: number;
  signature: string;
  traderPublicKey?: string;
  initialBuy?: number;
}

export default function LiveFeed() {
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [status, setStatus] = useState('Connecting to PumpPortal...');

  useEffect(() => {
    const wsUrl = env.NEXT_PUBLIC_PUMP_PORTAL_API_KEY
      ? `wss://pumpportal.fun/api/data?api-key=${env.NEXT_PUBLIC_PUMP_PORTAL_API_KEY}`
      : 'wss://pumpportal.fun/api/data';

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setStatus('✅ Connected - Listening for real buy/sell trades');
      ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
      ws.send(JSON.stringify({ method: 'subscribeTokenTrade', keys: [] }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Raw PumpPortal data:', data);

        let trade: TradeEvent | null = null;

        if (data.txType === 'buy' || data.txType === 'sell') {
          trade = {
            mint: data.mint,
            name: data.name,
            symbol: data.symbol,
            image: data.image,
            txType: data.txType,
            solAmount: data.solAmount,
            tokenAmount: data.tokenAmount,
            marketCapSol: data.marketCapSol,
            signature: data.signature,
            traderPublicKey: data.traderPublicKey,
          };
        } else if (data.txType === 'create' || data.method === 'createEventNotification') {
          trade = {
            mint: data.mint,
            name: data.name,
            symbol: data.symbol,
            image: data.image || data.uri,
            txType: 'create',
            solAmount: data.initialBuy,
            signature: data.signature,
          };
        }

        if (trade) {
          setTrades((prev) => [trade!, ...prev].slice(0, 40));
        }
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    };

    ws.onerror = () => setStatus('❌ WebSocket error');
    ws.onclose = () => setStatus('Disconnected');

    return () => ws.close();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <div className="text-green-400 font-medium">{status}</div>

      {trades.map((trade, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 hover:border-purple-600 transition">
          <div className="flex gap-4">
            <img
              src={trade.image || `https://via.placeholder.com/48?text=${trade.symbol || '?'}`}
              alt={trade.name}
              className="w-12 h-12 rounded-full"
              onError={(e) => {(e.target as HTMLImageElement).src = 'https://via.placeholder.com/48/4F46E5/FFFFFF?text=?';}}
            />
            <div className="flex-1">
              <div className="font-bold text-lg truncate">{trade.name || trade.mint.slice(0, 10) + '...'}</div>
              <div className="text-xs text-gray-500 font-mono break-all">{trade.mint}</div>
              <div className={`mt-2 font-medium ${trade.txType === 'buy' ? 'text-green-500' : trade.txType === 'sell' ? 'text-red-500' : 'text-purple-400'}`}>
                {trade.txType.toUpperCase()}
                {trade.solAmount && ` • ${Number(trade.solAmount).toFixed(4)} SOL`}
              </div>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(trade.mint)}
              className="self-start bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-xl text-sm font-medium"
            >
              Copy CA
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
