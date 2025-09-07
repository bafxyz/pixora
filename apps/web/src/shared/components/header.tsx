'use client'

import { Button } from '@repo/ui/button'
import { Camera, Home, LogOut, Settings, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/shared/providers/auth-provider'
import { LanguageSwitcher } from './language-switcher'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
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
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex-shrink-0"
          >
            Pixora
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-2 xl:space-x-4 flex-1 justify-center max-w-2xl mx-8">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border border-primary/20 shadow-sm'
                        : 'text-slate-700 hover:text-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right side - Compact */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher - Hidden on small screens */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {loading ? (
              <div className="text-sm text-slate-500">...</div>
            ) : user ? (
              <div className="flex items-center space-x-2">
                {/* User info - Show name and email */}
                <div className="hidden md:flex flex-col items-end min-w-0">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-32 lg:max-w-none">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </span>
                </div>

                {/* Logout button - Responsive */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
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
          <nav className="lg:hidden py-3 border-t border-white/20">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
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

              {/* Language switcher in mobile menu */}
              <div className="sm:hidden w-full pt-2 border-t border-white/20">
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
