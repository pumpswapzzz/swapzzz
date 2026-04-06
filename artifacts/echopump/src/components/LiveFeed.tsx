import React, { useEffect, useState } from 'react';
import { usePumpPortalWS, LiveTrade } from '@/hooks/usePumpPortalWS';
import { CopyTradeDialog } from './CopyTradeDialog';

export default function LiveFeed() {
  const { liveTrades, connectionStatus } = usePumpPortalWS();
  const [trades, setTrades] = useState<LiveTrade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<LiveTrade | null>(null);

  useEffect(() => {
    setTrades(liveTrades);
  }, [liveTrades]);

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Live Trades</h2>
        <div className={`text-sm px-2 py-1 rounded ${
          connectionStatus === 'connected' ? 'bg-green-600 text-white' :
          connectionStatus === 'connecting' ? 'bg-yellow-600 text-white' :
          'bg-red-600 text-white'
        }`}>
          {connectionStatus}
        </div>
      </div>
      <div className="space-y-3">
        {trades.map((trade, index) => (
          <div key={`${trade.signature}-${index}`} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800 transition-colors">
            <div className="flex items-start gap-3">
              <img
                src={trade.imageUri || '/placeholder-token.png'}
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
                    trade.txType === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {trade.txType.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-zinc-300">
                    {formatAmount(trade.solAmount)} SOL • {formatAmount(trade.tokenAmount)} tokens
                  </div>
                  <div className="text-zinc-500 truncate ml-2">
                    {trade.traderPublicKey.slice(0, 4)}...{trade.traderPublicKey.slice(-4)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">
                    {trade.is_migrated ? 'PumpSwap' : 'Bonding Curve'}
                  </span>
                  <button 
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded transition-colors"
                    onClick={() => setSelectedTrade(trade)}
                  >
                    Copy Trade
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {trades.length === 0 && (
          <div className="text-center text-zinc-500 py-8">
            {connectionStatus === 'connecting' ? 'Connecting to live trades...' : 'No trades yet'}
          </div>
        )}
      </div>
      <CopyTradeDialog 
        trade={selectedTrade} 
        open={!!selectedTrade} 
        onOpenChange={(open) => !open && setSelectedTrade(null)} 
        onSuccess={(txSignature, trade, amount) => {
          console.log('Trade copied successfully:', txSignature);
          setSelectedTrade(null);
        }} 
      />
    </div>
  );
}