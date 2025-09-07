'use client'

import { Button } from '@repo/ui/button'
import { Camera, Home, LogOut, Settings, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/shared/lib/supabase/client'

interface UserInfo {
  email: string
  role: string
  name?: string
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          setUser({
            email: authUser.email || '',
            role: authUser.user_metadata?.role || 'user',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
          })
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Subscribe to auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'user',
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split('@')[0],
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setUser(null)
        router.push('/login')
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Don't show header on login page
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  // Role-based navigation items
  const getNavigationItems = () => {
    if (!user) return []

    const baseItems = [{ href: '/dashboard', label: 'Dashboard', icon: Home }]

    switch (user.role) {
      case 'super-admin':
        return [
          ...baseItems,
          { href: '/super-admin', label: 'Super Admin', icon: Shield },
          { href: '/admin', label: 'Admin', icon: Settings },
          { href: '/photographer', label: 'Photographer', icon: Camera },
        ]
      case 'admin':
        return [
          ...baseItems,
          { href: '/admin', label: 'Admin Panel', icon: Settings },
          { href: '/photographer', label: 'Photographer', icon: Camera },
        ]
      case 'photographer':
        return [
          ...baseItems,
          { href: '/photographer', label: 'Photographer Panel', icon: Camera },
        ]
      case 'guest':
        return [{ href: '/gallery', label: 'Gallery', icon: Camera }]
      default:
        return baseItems
    }
  }

  const navItems = getNavigationItems()

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            >
              Pixora
            </Link>

            {user && (
              <nav className="hidden md:flex items-center space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border border-primary/20 shadow-sm'
                          : 'text-slate-700 hover:text-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            )}
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : user ? (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {user.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {user.email} • {user.role}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div
                    className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                      user.role === 'super-admin'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : user.role === 'admin'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                          : user.role === 'photographer'
                            ? 'bg-gradient-to-r from-primary to-indigo-600 text-white'
                            : user.role === 'guest'
                              ? 'bg-gradient-to-r from-secondary to-pink-600 text-white'
                              : 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
                    }`}
                  >
                    {user.role.toUpperCase()}
                  </div>

                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && (
          <nav className="md:hidden py-3 border-t border-white/20">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border border-primary/20'
                        : 'text-slate-700 hover:text-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
