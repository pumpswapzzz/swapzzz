import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function WalletConnect() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="flex items-center gap-4">
      {connected && publicKey ? (
        <div className="text-sm text-gray-300">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </div>
      ) : null}
      <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-700 !text-white !rounded-lg !px-4 !py-2 !text-sm !font-medium" />
    </div>
  );
}