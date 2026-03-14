import type { Metadata } from 'next'
import { Inter, Poppins, Urbanist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:       'AI Games — Math & Memory Challenges',
  description: 'AI-powered math puzzles and memory challenges. No signup required. 15 games per hour.',
  keywords:    ['math games', 'memory game', 'brain training', 'ai games'],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover' as const, // enables safe-area-inset-* on notched devices
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning className={`${inter.variable} ${poppins.variable} ${urbanist.variable} ${geistMono.variable}`}>
      <body className="antialiased overflow-x-hidden">
        <Navbar />
        <div data-root-content className="flex flex-col min-h-0">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}
