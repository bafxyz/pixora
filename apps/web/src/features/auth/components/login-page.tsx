import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Camera, Star, Users } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { LanguageSwitcher } from '@/shared/components/language-switcher'
import type { User } from '../types'

interface LoginPageProps {
  onLogin: (user: User) => void
  onGuestAccess: (guestId: string) => void
}

export function LoginPage({ onLogin, onGuestAccess }: LoginPageProps) {
  const { _ } = useLingui()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [guestId, setGuestId] = useState('')
  const [activeTab, setActiveTab] = useState('login')

  // Handle initial tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'register') {
      setActiveTab('register')
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError('') // Clear errors when switching tabs
  }

  // Login form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  // Registration form
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    studioName: '',
    firstName: '',
    lastName: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || _(t`Login failed`))
      }

      onLogin(result.user)
    } catch (err) {
      console.error('Login error:', err)
      setError(
        err instanceof Error ? err.message : 'An error occurred during login'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
          name:
            `${registerForm.firstName} ${registerForm.lastName}`.trim() ||
            registerForm.studioName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // If user already exists, suggest switching to login
        if (result.errorType === 'user_exists') {
          setError(_(t`User already exists. Please switch to the Login tab.`))
          setLoginForm({
            email: registerForm.email,
            password: registerForm.password,
          })
          setActiveTab('login')
          return
        }
        throw new Error(result.error || _(t`Registration failed`))
      }

      // After successful registration, show success message
      // Don't auto-login to avoid issues with email confirmation
      console.log('✅ Registration successful:', result)
      setError(
        _(
          t`Registration successful! Please check your email to confirm your account, then log in.`
        )
      )

      // Clear the registration form
      setRegisterForm({
        email: '',
        password: '',
        studioName: '',
        firstName: '',
        lastName: '',
      })

      // Switch to login tab
      setActiveTab('login')
      setLoginForm({
        email: registerForm.email,
        password: registerForm.password,
      })
    } catch (err) {
      console.error('Registration error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred during registration'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestAccess = (e: React.FormEvent) => {
    e.preventDefault()
    if (guestId.trim()) {
      onGuestAccess(guestId.trim())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Header with Language Switcher */}
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>

      <div className="flex items-center justify-center px-4 py-8 md:py-16">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Product information */}
          <div className="text-center lg:text-left space-y-6 lg:space-y-8 order-2 lg:order-1">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Camera className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Pixora
                </h1>
              </div>
              <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300">
                <Trans>Platform for digitizing photo services</Trans>
              </p>
            </div>

            <div className="grid gap-6 max-w-md mx-auto lg:max-w-none">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">
                    <Trans>Fast upload</Trans>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    <Trans>Instant photo sync from mobile device</Trans>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">
                    <Trans>Guest convenience</Trans>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    <Trans>Passwordless access to personal galleries</Trans>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">
                    <Trans>Branding</Trans>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    <Trans>Complete customization for your style</Trans>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Forms */}
          <div className="space-y-6 w-full max-w-md mx-auto lg:max-w-none order-1 lg:order-2">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-white/80 backdrop-blur-md border border-white/30 shadow-lg">
                <TabsTrigger
                  value="login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
                >
                  <Trans>Login</Trans>
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
                >
                  <Trans>Registration</Trans>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      <Trans>Sign in</Trans>
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      <Trans>Sign in to your photographer account</Trans>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          <Trans>Email</Trans>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={_(t`photographer@studio.com`)}
                          value={loginForm.email}
                          onChange={(e) =>
                            setLoginForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">
                          <Trans>Password</Trans>
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) =>
                            setLoginForm((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      {error && (
                        <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-md p-3">
                          {error}
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                        disabled={isLoading}
                      >
                        {isLoading ? _(t`Signing in...`) : _(t`Sign in`)}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      <Trans>Photographer registration</Trans>
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      <Trans>Create an account for your photo studio</Trans>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">
                            <Trans>First name</Trans>
                          </Label>
                          <Input
                            id="firstName"
                            placeholder={_(t`John`)}
                            value={registerForm.firstName}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">
                            <Trans>Last name</Trans>
                          </Label>
                          <Input
                            id="lastName"
                            placeholder={_(t`Doe`)}
                            value={registerForm.lastName}
                            onChange={(e) =>
                              setRegisterForm((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studioName">
                          <Trans>Studio name</Trans>
                        </Label>
                        <Input
                          id="studioName"
                          placeholder={_(t`Doe Studio`)}
                          value={registerForm.studioName}
                          onChange={(e) =>
                            setRegisterForm((prev) => ({
                              ...prev,
                              studioName: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regEmail">
                          <Trans>Email</Trans>
                        </Label>
                        <Input
                          id="regEmail"
                          type="email"
                          placeholder={_(t`photographer@studio.com`)}
                          value={registerForm.email}
                          onChange={(e) =>
                            setRegisterForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="regPassword">
                          <Trans>Password</Trans>
                        </Label>
                        <Input
                          id="regPassword"
                          type="password"
                          value={registerForm.password}
                          onChange={(e) =>
                            setRegisterForm((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      {error && (
                        <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-md p-3">
                          {error}
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-secondary to-pink-600 hover:from-secondary/90 hover:to-pink-600/90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                        disabled={isLoading}
                      >
                        {isLoading ? _(t`Creating...`) : _(t`Create account`)}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Guest access */}
            <Card className="border-2 border-dashed border-accent/30 bg-gradient-to-r from-accent/5 to-amber-50/50 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-lg font-bold text-slate-800 dark:text-slate-200">
                  <Trans>Guest access</Trans>
                </CardTitle>
                <CardDescription className="text-center text-slate-600 dark:text-slate-400">
                  <Trans>Enter your guest ID to view photos</Trans>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGuestAccess} className="space-y-4">
                  <Input
                    placeholder={_(t`Enter guest ID (e.g., GUEST123)`)}
                    value={guestId}
                    onChange={(e) => setGuestId(e.target.value)}
                    className="h-11 bg-white/70 border-white/20 shadow-sm"
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Trans>View photos</Trans>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
