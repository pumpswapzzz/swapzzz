import type { Metadata } from 'next'
import './globals.css'
import { WalletContextProvider } from './wallet-provider'
import { PumpPortalProvider } from '@/context/PumpPortalContext'

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
          </WalletContextProvider>
        </PumpPortalProvider>
      </body>
    </html>
  )
}