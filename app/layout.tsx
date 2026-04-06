import type { Metadata } from 'next'
import './globals.css'
import { WalletContextProvider } from './wallet-provider'

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
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  )
}