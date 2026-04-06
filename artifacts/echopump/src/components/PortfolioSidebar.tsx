import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface TokenAccount {
  mint: string;
  amount: number;
  decimals: number;
  symbol?: string;
  name?: string;
  image?: string;
}

export default function PortfolioSidebar() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokens, setTokens] = useState<TokenAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey || !connection) return;

    const fetchPortfolio = async () => {
      setLoading(true);
      try {
        // Get SOL balance
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);

        // Get token accounts
        const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });

        const tokenData: TokenAccount[] = [];

        for (const account of tokenAccounts.value) {
          try {
            const accountInfo = await connection.getAccountInfo(account.account.owner);
            const mintInfo = await connection.getAccountInfo(account.account.data.slice(0, 32));
            // This is simplified - in a real app you'd fetch metadata from Metaplex
            const mint = new PublicKey(account.account.data.slice(0, 32));
            const amount = Number(account.account.data.slice(64, 72).readBigUInt64LE());

            tokenData.push({
              mint: mint.toBase58(),
              amount,
              decimals: 9, // Assume 9 decimals for simplicity
              symbol: 'UNKNOWN',
              name: 'Unknown Token',
            });
          } catch (error) {
            console.error('Error fetching token data:', error);
          }
        }

        setTokens(tokenData);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [connected, publicKey, connection]);

  if (!connected) {
    return (
      <div className="text-center text-zinc-500 py-8">
        Connect wallet to view portfolio
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Portfolio</h3>

      {/* SOL Balance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">◎</span>
            </div>
            <div>
              <div className="text-white font-medium">Solana</div>
              <div className="text-zinc-400 text-sm">SOL</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-medium">{solBalance.toFixed(4)}</div>
            <div className="text-zinc-400 text-sm">${(solBalance * 150).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Tokens */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Held Tokens</h4>
        {loading ? (
          <div className="text-center text-zinc-500 py-4">Loading...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center text-zinc-500 py-4">No tokens found</div>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div key={token.mint} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                      <span className="text-zinc-300 text-xs">?</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{token.name}</div>
                      <div className="text-zinc-400 text-xs">{token.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">{(token.amount / Math.pow(10, token.decimals)).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}