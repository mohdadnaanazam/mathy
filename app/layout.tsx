import type { Metadata, Viewport } from 'next'
import { Inter, Poppins, Urbanist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'


const SITE_URL = 'https://matthy.netlify.app'

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Mathy — Free Math & Memory Brain Training Games',
    template: '%s | Mathy',
  },
  description:
    'Play free AI-generated math puzzles, memory grid challenges, and true/false equations. New games every hour. No signup required. Train your brain daily.',
  keywords: [
    'math games', 'free math games', 'brain training games', 'online math practice',
    'memory games', 'mental math', 'math puzzles', 'brain games online',
    'math challenge', 'true false math', 'memory grid game', 'daily brain training',
  ],
  authors: [{ name: 'Mathy' }],
  creator: 'Mathy',
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Mathy',
    title: 'Mathy — Free Math & Memory Brain Training Games',
    description:
      'AI-generated math puzzles, memory challenges, and true/false equations. New games every hour. No signup. Train your brain daily.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mathy — Free Math & Memory Brain Training Games',
    description:
      'AI-generated math puzzles and memory challenges. New games every hour. Train your brain daily.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0c0c0f',
}

// JSON-LD structured data for the site
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Mathy',
  url: SITE_URL,
  description: 'Free AI-generated math puzzles, memory grid challenges, and brain training games. New games every hour.',
  applicationCategory: 'GameApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  genre: ['Educational', 'Puzzle', 'Brain Training'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning className={`${inter.variable} ${poppins.variable} ${urbanist.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased overflow-x-hidden">
        <div className="hidden" aria-hidden="true">
          <Navbar />
        </div>
        <div data-root-content className="flex flex-col min-h-0">
          {children}
        </div>
      </body>
    </html>
  )
}
