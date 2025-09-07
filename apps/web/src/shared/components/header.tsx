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
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
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
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
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
              <div className="text-sm text-gray-500">Loading...</div>
            ) : user ? (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user.email} • {user.role}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'super-admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'admin'
                          ? 'bg-green-100 text-green-800'
                          : user.role === 'photographer'
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'guest'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-gray-100 text-gray-800'
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
          <nav className="md:hidden py-2 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
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
