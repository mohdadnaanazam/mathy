import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title:       'AI Games — Math & Memory Challenges',
  description: 'AI-powered math puzzles and memory challenges. No signup required. 15 games per hour.',
  keywords:    ['math games', 'memory game', 'brain training', 'ai games'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body style={{ background: '#050505', color: '#fff', margin: 0 }}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
