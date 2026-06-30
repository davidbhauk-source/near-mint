'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const { user, profile, loading } = useUser()
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

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
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
        <Link href="/search" className={`nav-link ${pathname.startsWith('/search') ? 'active' : ''}`}>Search</Link>
        <Link href="/profile" className={`nav-link ${pathname.startsWith('/profile') ? 'active' : ''}`}>Profile</Link>
      </nav>
{user && (
  <Link href="/suggest" className={`nav-link ${pathname.startsWith('/suggest') ? 'active' : ''}`}>
    Suggest
  </Link>
)}
      <div className="nav-right">
        <Link href="/search" className="btn-log">+ Log run</Link>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/profile" className="avatar">{initial}</Link>
            <button
              onClick={handleSignOut}
              className="nav-link"
              style={{ border: "none", background: "none", cursor: "pointer" }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link href="/auth" className="nav-link">Sign in</Link>
        )}
      </div>
    </header>
  )
}