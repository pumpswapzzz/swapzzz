import React, { useEffect, useState } from 'react';

interface Trade {
  signature: string;
  mint: string;
  sol_amount: number;
  token_amount: number;
  is_buy: boolean;
  user: string;
  timestamp: number;
  tx_index: number;
  username: string;
  profile_image: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  metadata_uri: string;
  twitter: string;
  telegram: string;
  bonding_curve: string;
  associated_bonding_curve: string;
  creator: string;
  created_timestamp: number;
  raydium_pool: string;
  complete: boolean;
  website: string;
  show_name: boolean;
  king_of_hill_timestamp: number;
  last_trade_timestamp: number;
  nsfw: boolean;
  market_cap: number;
  reply_count: number;
  last_reply: number;
  is_currently_live: boolean;
  unique_wallet_count: number;
  usd_market_cap: number;
}

export default function LiveFeed() {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const ws = new WebSocket('wss://pumpportal.fun/api/data');

    ws.onopen = () => {
      console.log('Connected to PumpPortal WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'trade') {
          setTrades(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 trades
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(2);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Live Trades</h2>
      <div className="space-y-3">
        {trades.map((trade, index) => (
          <div key={`${trade.signature}-${index}`} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800 transition-colors">
            <div className="flex items-start gap-3">
              <img
                src={trade.image_uri || '/placeholder-token.png'}
                alt={trade.name}
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-token.png';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-white truncate">{trade.name}</span>
                  <span className="text-sm text-zinc-400">({trade.symbol})</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    trade.is_buy ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {trade.is_buy ? 'BUY' : 'SELL'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-zinc-300">
                    {formatAmount(trade.sol_amount)} SOL • {formatAmount(trade.token_amount)} tokens
                  </div>
                  <div className="text-zinc-500 truncate ml-2">
                    {trade.user.slice(0, 4)}...{trade.user.slice(-4)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">
                    {trade.complete ? 'PumpSwap' : 'Bonding Curve'}
                  </span>
                  <button className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded transition-colors">
                    Copy Trade
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {trades.length === 0 && (
          <div className="text-center text-zinc-500 py-8">
            Connecting to live trades...
          </div>
        )}
      </div>
    </div>
  );
}