'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { publicEnv } from '@/lib/env';

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
  imageUri: string;
  is_migrated: boolean;
  marketCapSol?: number;
  signature?: string;
}

export interface NewToken {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  imageUri: string;
  initialBuy: number;
  marketCapSol: number;
  creator: string;
  timestamp: number;
}

interface PumpPortalState {
  liveTrades: LiveTrade[];
  newTokens: NewToken[];
  migratedMints: Set<string>;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  wsError: string | null;
}

const PumpPortalContext = createContext<PumpPortalState>({
  liveTrades: [],
  newTokens: [],
  migratedMints: new Set(),
  connectionStatus: 'disconnected',
  wsError: null,
});

const API_KEY = publicEnv.NEXT_PUBLIC_PUMP_PORTAL_API_KEY;

export function PumpPortalProvider({ children }: { children: ReactNode }) {
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);
  const [newTokens, setNewTokens] = useState<NewToken[]>([]);
  const [migratedMints, setMigratedMints] = useState<Set<string>>(new Set());
  const migratedMintsRef = useRef<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<PumpPortalState['connectionStatus']>('disconnected');
  const [wsError, setWsError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();
  const destroyedRef = useRef(false);

  useEffect(() => {
    destroyedRef.current = false;

    const connect = () => {
      if (destroyedRef.current) return;
      setConnectionStatus('connecting');
      setWsError(null);

      const wsUrl = API_KEY
        ? `wss://pumpportal.fun/api/data?api-key=${API_KEY}`
        : 'wss://pumpportal.fun/api/data';

      console.log('[PumpPortal WS] Connecting...', API_KEY ? '(with API key)' : '(no key)');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (destroyedRef.current) { ws.close(); return; }
        setConnectionStatus('connected');
        setWsError(null);
        console.log('[PumpPortal WS] Connected ✓');

        ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
        ws.send(JSON.stringify({ method: 'subscribe', channel: 'trades' }));
        ws.send(JSON.stringify({ method: 'subscribeMigration' }));
        if (API_KEY) {
          ws.send(JSON.stringify({ method: 'subscribeAccountTrade', keys: ['all'] }));
          console.log('[PumpPortal WS] subscribeAccountTrade active (API key)');
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket received]', data);

          if (data.txType === 'buy' || data.txType === 'sell') {
            const tradeBase: Omit<LiveTrade, 'imageUri'> = {
              mint: data.mint || data.tokenAddress || '',
              traderPublicKey: data.traderPublicKey || data.user || '',
              txType: data.txType,
              solAmount: Number(data.solAmount ?? data.sol_amount ?? data.amount ?? 0),
              tokenAmount: Number(data.tokenAmount ?? data.token_amount ?? 0),
              timestamp: data.timestamp ? Number(data.timestamp) * 1000 : Date.now(),
              name: data.name || data.symbol || '',
              symbol: data.symbol || data.name || data.mint?.substring(0, 6) || '',
              uri: data.uri || data.metadata?.uri || '',
              is_migrated: migratedMintsRef.current.has(data.mint),
              marketCapSol: data.marketCapSol != null ? Number(data.marketCapSol) : undefined,
              signature: data.signature,
            };

            setLiveTrades((prev) => [{ ...tradeBase, imageUri: '' }, ...prev].slice(0, 200));
          }

          if (data.txType === 'create' || (data.mint && data.name && data.symbol && !data.txType)) {
            const uri = data.uri || data.metadata?.uri || '';
            const tokenBase: NewToken = {
              mint: data.mint,
              name: data.name,
              symbol: data.symbol,
              uri,
              imageUri: '',
              initialBuy: Number(data.initialBuy ?? 0),
              marketCapSol: Number(data.marketCapSol ?? 0),
              creator: data.traderPublicKey || data.creator || '',
              timestamp: data.timestamp ? Number(data.timestamp) * 1000 : Date.now(),
            };

            setNewTokens((prev) => [tokenBase, ...prev].slice(0, 100));
          }

          if (data.signature && data.mint && !data.txType) {
            console.log('[PumpPortal WS] Migration:', data.mint);
            migratedMintsRef.current = new Set([...migratedMintsRef.current, data.mint]);
            setMigratedMints((prev) => new Set([...prev, data.mint]));
            setLiveTrades((prev) =>
              prev.map((t) => (t.mint === data.mint ? { ...t, is_migrated: true } : t))
            );
          }
        } catch (e) {
          console.error('[PumpPortal WS] Parse error:', e);
        }
      };

      ws.onclose = (evt) => {
        if (destroyedRef.current) return;
        setConnectionStatus('disconnected');
        console.warn('[PumpPortal WS] Closed – reconnecting in 3s... code:', evt.code);
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        console.error('[PumpPortal WS] Socket error');
        setConnectionStatus('error');
        setWsError('WebSocket error – retrying...');
        ws.close();
      };
    };

    connect();

    return () => {
      destroyedRef.current = true;
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  return (
    <PumpPortalContext.Provider value={{ liveTrades, newTokens, migratedMints, connectionStatus, wsError }}>
      {children}
    </PumpPortalContext.Provider>
  );
}

export function usePumpPortal() {
  return useContext(PumpPortalContext);
}

export async function resolveTokenImage(uri: string) {
  try {
    if (!uri) return '';
    const res = await fetch(uri);
    const json = await res.json();
    return json.image || json.image_uri || '';
  } catch (e) {
    return '';
  }
}

