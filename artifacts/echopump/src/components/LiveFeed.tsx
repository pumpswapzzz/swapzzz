'use client';

import React, { useEffect, useState } from 'react';
import { publicEnv } from '@/lib/env';

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function LiveFeed() {
  const [trades, setTrades] = useState<any[]>([]);
  const [status, setStatus] = useState('Connecting to Pump.fun...');

  useEffect(() => {
    const wsUrl = publicEnv.NEXT_PUBLIC_PUMP_PORTAL_API_KEY
      ? `wss://pumpportal.fun/api/data?api-key=${publicEnv.NEXT_PUBLIC_PUMP_PORTAL_API_KEY}`
      : 'wss://pumpportal.fun/api/data';

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setStatus('✅ Listening to Pump.fun...');
      ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
      ws.send(JSON.stringify({ method: 'subscribe', channel: 'trades' }));
      ws.send(JSON.stringify({ method: 'subscribeMigration' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.txType === 'buy' || data.txType === 'sell' || data.type === 'trade') {
          setTrades((prev) => [{ ...data, receivedAt: Date.now() }, ...prev].slice(0, 20));
        }
      } catch (error) {
        console.error('LiveFeed parse error', error);
      }
    };

    ws.onerror = () => setStatus('❌ WebSocket error');
    ws.onclose = () => setStatus('Disconnected');

    return () => ws.close();
  }, []);

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="text-emerald-400 text-sm mb-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        {status}
      </div>

      <div className="space-y-4">
        {trades.length === 0 && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center text-sm text-zinc-500">
            Waiting for PumpPortal trades...
          </div>
        )}

        {trades.map((trade, index) => {
          const isBuy = trade.txType === 'buy';
          const mint = trade.mint || trade.tokenAddress || trade.market?.mint || '';
          const symbol = trade.symbol || trade.name || 'TOKEN';
          const name = trade.name || symbol;
          const amount = Number(trade.solAmount ?? trade.sol_amount ?? trade.amount ?? 0);
          const price = Number(trade.price ?? trade.price_sol ?? 0);
          const time = trade.timestamp ? Number(trade.timestamp) * 1000 : trade.receivedAt;

          return (
            <div key={`${mint}-${index}-${trade.signature ?? trade.receivedAt}`} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.08)] transition hover:border-violet-500/60 hover:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-base font-semibold text-white">
                    <span>{name}</span>
                    <span className="text-xs text-zinc-500">{symbol}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
                    <span className="rounded-full border border-zinc-700 px-2 py-1">CA: {mint.slice(0, 8)}...</span>
                    <span className="rounded-full border border-zinc-700 px-2 py-1">Amt: {amount.toFixed(2)} SOL</span>
                    <span className="rounded-full border border-zinc-700 px-2 py-1">Price: {price ? price.toFixed(4) : '-'}</span>
                    <span className="rounded-full border border-zinc-700 px-2 py-1">{formatTime(time)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isBuy ? 'bg-emerald-500/15 text-emerald-300' : 'bg-pink-500/15 text-pink-300'}`}>
                    {isBuy ? 'BUY' : 'SELL'}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-2xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
                  onClick={() => navigator.clipboard.writeText(mint)}
                >
                  Copy CA
                </button>
                <span className="text-xs text-zinc-500">{trade.traderPublicKey ? `${trade.traderPublicKey.slice(0, 4)}...${trade.traderPublicKey.slice(-4)}` : 'Anonymous'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
