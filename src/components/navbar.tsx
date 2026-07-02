'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

export default function Navbar() {
  const { user, profile, loading } = useUser()
  const pathname = usePathname()

  if (loading) return (
    <header className="navbar">
      <Link href="/" className="wordmark">
        <span className="wordmark-dot" />
        Near Mint
      </Link>
    </header>
  )

  const initial = profile?.username?.[0]?.toUpperCase()
    ?? user?.email?.[0]?.toUpperCase()
    ?? "?"

  return (
    <header className="navbar">
      <Link href="/" className="wordmark">
        <span className="wordmark-dot" />
        Near Mint
      </Link>

      <nav className="nav-links">
        <Link href="/search" className={`nav-link ${pathname.startsWith('/search') ? 'active' : ''}`}>
          🔍 Search
        </Link>
        {user && (
          <Link href="/suggest" className={`nav-link ${pathname.startsWith('/suggest') ? 'active' : ''}`}>
            Suggest
          </Link>
        )}
      </nav>

      <div className="nav-right">
        <Link href="/search" className="btn-log">+ Log run</Link>
        {user ? (
          <Link href="/profile" className="avatar">{initial}</Link>
        ) : (
          <Link href="/auth" className="nav-link">Sign in</Link>
        )}
      </div>
    </header>
  )
}