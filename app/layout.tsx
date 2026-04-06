import type { Metadata } from 'next'
import './globals.css'
import { WalletContextProvider } from './wallet-provider'
import { PumpPortalProvider } from '@/context/PumpPortalContext'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'EchoPump',
  description: 'Solana Pump.Fun trading platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <PumpPortalProvider>
          <WalletContextProvider>
            {children}
            {process.env.NODE_ENV === 'development' && (
              <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-black px-3 py-2 text-xs text-emerald-400 shadow-xl shadow-emerald-500/20">
                API Key loaded: {env.NEXT_PUBLIC_PUMP_PORTAL_API_KEY ? '✅ YES' : '❌ NO'}
              </div>
            )}
          </WalletContextProvider>
        </PumpPortalProvider>
      </body>
    </html>
  )
}