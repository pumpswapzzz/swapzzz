import { useState, useEffect, useRef } from 'react';

export interface LiveTrade {
  mint: string;
  traderPublicKey: string;
  txType: 'buy' | 'sell';
  solAmount: number;
  tokenAmount: number;
  timestamp: number;
  name: string;
  symbol: string;
  uri: string;
  is_migrated: boolean;
}

export interface NewToken {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  initialBuy: number;
  marketCapSol: number;
  creator: string;
  timestamp: number;
}

export function usePumpPortalWS() {
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);
  const [newTokens, setNewTokens] = useState<NewToken[]>([]);
  const [migratedMints, setMigratedMints] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      setConnectionStatus('connecting');
      const ws = new WebSocket('wss://pumpportal.fun/api/data');
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
        ws.send(JSON.stringify({ method: 'subscribeTokenTrade', keys: ['all'] }));
        ws.send(JSON.stringify({ method: 'subscribeMigration' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.txType === 'buy' || data.txType === 'sell') {
            setLiveTrades((prev) => {
              const newTrade: LiveTrade = {
                mint: data.mint,
                traderPublicKey: data.traderPublicKey,
                txType: data.txType,
                solAmount: data.solAmount,
                tokenAmount: data.tokenAmount,
                timestamp: data.timestamp || Date.now(),
                name: data.name || '',
                symbol: data.symbol || '',
                uri: data.uri || '',
                is_migrated: migratedMints.has(data.mint),
              };
              const updated = [newTrade, ...prev];
              return updated.slice(0, 200);
            });
          } else if (data.mint && data.name && data.symbol && !data.txType) {
            // New token launch
            setNewTokens((prev) => {
              const newToken: NewToken = {
                mint: data.mint,
                name: data.name,
                symbol: data.symbol,
                uri: data.uri,
                initialBuy: data.initialBuy || 0,
                marketCapSol: data.marketCapSol || 0,
                creator: data.creator || '',
                timestamp: data.timestamp || Date.now(),
              };
              const updated = [newToken, ...prev];
              return updated.slice(0, 100);
            });
          } else if (data.signature && data.mint) {
            // Migration
            setMigratedMints((prev) => {
              const newSet = new Set(prev);
              newSet.add(data.mint);
              return newSet;
            });
            // Update existing trades migration status
            setLiveTrades((prev) =>
              prev.map((t) => (t.mint === data.mint ? { ...t, is_migrated: true } : t))
            );
          }
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { liveTrades, newTokens, migratedMints, connectionStatus };
}
