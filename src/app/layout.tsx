// src/app/layout.tsx
import type { Metadata } from 'next'
import Navbar from '@/components/navbar'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://nearmint.site'),
  title: {
    default: 'Near Mint',
    template: '%s | Near Mint',
  },
  description: 'Track comic book runs, not just issues.',
  openGraph: {
    type: 'website',
    siteName: 'Near Mint',
    title: 'Near Mint',
    description: 'Track comic book runs, not just issues.',
    url: 'https://nearmint.site',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Near Mint',
    description: 'Track comic book runs, not just issues.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="main-content">
          {children}
        </main>
        <footer className="site-footer">
            Comic data courtesy of{" "}
           <a href="https://comicvine.gamespot.com" target="_blank" rel="noopener noreferrer">
            Comic Vine
           </a>
            . Cover art and characters are the property of their respective publishers.
              Near Mint is not affiliated with or endorsed by Comic Vine or any publisher.
        </footer>
      </body>
    </html>
  )
}
