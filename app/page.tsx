'use client';

import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-4">ECHOPUMP</h1>
        <p className="text-emerald-400 mb-8">Solana • Pump.fun Social Trading</p>
        
        <div className="bg-zinc-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-xl mb-6">Wallet Connect + Live Feed coming soon...</p>
          <p className="text-gray-400">The app is now deployed and building successfully.</p>
        </div>
      </div>
    </div>
  );
}