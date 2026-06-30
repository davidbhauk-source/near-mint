// app/layout.tsx
import type { Metadata } from 'next'
import Navbar from '@/components/navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Near Mint',
  description: 'Track comic book runs, not just issues.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}

