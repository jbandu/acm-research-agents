import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/SessionProvider'
import Navigation from '@/components/Navigation'
import ToastProvider from '@/components/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ACM Research Agents | Jayaprakash Bandu',
  description: 'Multi-LLM Research Agent Orchestration Platform for Cancer Research',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ToastProvider>
            <Navigation />
            <main className="min-h-screen">
              {children}
            </main>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
