'use client';

import { usePumpPortalWS } from '@/hooks/usePumpPortalWS';

export default function Trending() {
  const { newTokens } = usePumpPortalWS();

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <span className="text-orange-500">🔥</span>
        Live Feed
      </h2>

      <div className="space-y-3">
        {newTokens.length === 0 ? (
          <div className="text-gray-400 text-center py-12">
            Waiting for real buy/sell trades...
          </div>
        ) : (
          newTokens.slice(0, 30).map((token: any, index: number) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-800 hover:border-purple-500 rounded-2xl p-5 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-lg text-white">
                    {token.name || 'New Token'}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1 break-all">
                    {token.mint}
                  </div>
                </div>

                <button
                  onClick={() => navigator.clipboard.writeText(token.mint)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-medium"
                >
                  Copy CA
                </button>
              </div>

              <div className={`mt-4 text-sm font-semibold ${
                token.txType === 'buy' ? 'text-green-500' :
                token.txType === 'sell' ? 'text-red-500' : 'text-purple-400'
              }`}>
                {token.txType ? token.txType.toUpperCase() : 'CREATE'}
                {token.solAmount && ` • ${Number(token.solAmount).toFixed(4)} SOL`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
