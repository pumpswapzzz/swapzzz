'use client';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">ECHOPUMP</h1>
        <p className="text-emerald-400 text-xl mb-8">Solana Pump.fun Social Trading</p>
        
        <div className="bg-zinc-900 border border-gray-700 rounded-2xl p-12 max-w-md mx-auto">
          <p className="text-2xl mb-4">✅ App is now live</p>
          <p className="text-gray-400">Wallet connect and live feed will be added next.</p>
        </div>
      </div>
    </div>
  );
}