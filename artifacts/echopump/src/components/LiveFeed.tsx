'use client';

import React, { useEffect, useState } from 'react';

export default function LiveFeed() {
  const [trades, setTrades] = useState<any[]>([]);
  const [status, setStatus] = useState('Connecting to Pump.fun...');

  useEffect(() => {
    const ws = new WebSocket('wss://pumpportal.fun/api/data');

    ws.onopen = () => {
      setStatus('✅ Listening to Pump.fun...');
      ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
      ws.send(JSON.stringify({ method: 'subscribeTokenTrade' }));
      ws.send(JSON.stringify({ method: 'subscribeMigration' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.txType || data.type) {
          setTrades(prev => [data, ...prev.slice(0, 19)]);
        }
      } catch (e) {}
    };

    ws.onerror = () => setStatus('❌ WebSocket error');
    ws.onclose = () => setStatus('Disconnected');

    return () => ws.close();
  }, []);

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="text-emerald-400 text-sm mb-3 flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        {status}
      </div>
      <div className="space-y-3">
        {trades.map((trade, i) => (
          <div key={i} className="bg-zinc-900 border border-gray-700 rounded-xl p-3 text-sm">
            {/* Simple trade display - agent can expand later */}
            <div className="flex justify-between">
              <span className="font-mono text-emerald-400">{trade.txType || 'TRADE'}</span>
              <span className="text-gray-400 text-xs">{trade.mint?.slice(0,8)}...</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}