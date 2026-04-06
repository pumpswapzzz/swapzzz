'use client';

import React, { useEffect, useState } from 'react';
import { env } from '@/lib/env';

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function LiveFeed() {
  const [trades, setTrades] = useState<any[]>([]);
  const [wsStatus, setWsStatus] = useState('Connecting...');

  useEffect(() => {
    const wsUrl = env.NEXT_PUBLIC_PUMP_PORTAL_API_KEY
      ? `wss://pumpportal.fun/api/data?api-key=${env.NEXT_PUBLIC_PUMP_PORTAL_API_KEY}`
      : 'wss://pumpportal.fun/api/data';

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsStatus('✅ Connected to PumpPortal');
      ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
      ws.send(JSON.stringify({ method: 'subscribeTokenTrade', keys: [] }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket data:', data);

        if (data.type === 'trade' || data.txType === 'buy' || data.txType === 'sell') {
          setTrades((prev) => [{ ...data, receivedAt: Date.now() }, ...prev].slice(0, 50));
        }
      } catch (e) {
        console.error('Parse error', e);
      }
    };

    ws.onerror = () => setWsStatus('❌ WebSocket error');
    ws.onclose = () => setWsStatus('Disconnected');

    return () => ws.close();
  }, []);

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="mb-4 flex items-center gap-2 text-sm text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        {wsStatus}
      </div>

      <div className="space-y-4">
        {trades.length === 0 && (
          <div className="rounded-3xl border border-gray-700 bg-zinc-950 p-8 text-center text-sm text-zinc-500">
            Waiting for PumpPortal buy/sell trades...
          </div>
        )}

        {trades.map((trade, index) => {
          const isBuy = trade.txType === 'buy';
          const mint = trade.mint || trade.token?.mint || trade.market?.mint || trade.tokenAddress || trade.address || '';
          const symbol = trade.symbol || trade.token?.symbol || trade.name || 'TOKEN';
          const name = trade.name || symbol;
          const image =
            trade.metadata?.image ||
            trade.token?.image ||
            trade.token?.logo ||
            trade.image ||
            trade.icon ||
            'https://via.placeholder.com/48?text=?';
          const amount = Number(trade.solAmount ?? trade.sol_amount ?? trade.amount ?? 0);
          const price = Number(trade.price ?? trade.price_sol ?? trade.pricePerToken ?? 0);
          const time = trade.timestamp ? Number(trade.timestamp) * 1000 : trade.receivedAt;

          return (
            <div
              key={`${mint}-${index}-${trade.signature ?? trade.receivedAt}`}
              className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.08)] transition hover:border-violet-500/60 hover:bg-zinc-900"
            >
              <div className="flex items-start gap-3">
                <img
                  src={image}
                  alt={name}
                  className="h-12 w-12 rounded-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = 'https://via.placeholder.com/48?text=?';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-white">
                    <span className="truncate">{name}</span>
                    <span className="text-xs text-zinc-500">{symbol}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
                    <span className="rounded-full border border-zinc-700 px-2 py-1">CA: {mint ? `${mint.slice(0, 8)}...` : 'unknown'}</span>
                    <span className="rounded-full border border-zinc-700 px-2 py-1">{formatTime(time)}</span>
                  </div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isBuy ? 'bg-emerald-500/15 text-emerald-300' : 'bg-pink-500/15 text-pink-300'}`}>
                  {isBuy ? 'BUY' : 'SELL'}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-zinc-900 p-3 text-sm text-zinc-300">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Amount</div>
                  <div className="mt-1 text-white">{amount.toFixed(2)} SOL</div>
                </div>
                <div className="rounded-2xl bg-zinc-900 p-3 text-sm text-zinc-300">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Price</div>
                  <div className="mt-1 text-white">{price ? price.toFixed(4) : '-'}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  className="rounded-2xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
                  onClick={() => navigator.clipboard.writeText(mint)}
                >
                  Copy Trade
                </button>
                <span className="text-xs text-zinc-500">
                  {trade.traderPublicKey ? `${trade.traderPublicKey.slice(0, 4)}...${trade.traderPublicKey.slice(-4)}` : 'Anonymous'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
