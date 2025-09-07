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
import React, { useState } from 'react'
import { LanguageSwitcher } from '@/shared/components/language-switcher'
import { env } from '@/shared/config/env'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  studioName?: string
}

interface LoginPageProps {
  onLogin: (user: User) => void
  onGuestAccess: (guestId: string) => void
}

export function LoginPage({ onLogin, onGuestAccess }: LoginPageProps) {
  const { _ } = useLingui()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [guestId, setGuestId] = useState('')
  const [activeTab, setActiveTab] = useState('login')

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError('') // <Trans>Clear errors when switching tabs</Trans>
  }

  // Форма входа
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  // Форма регистрации
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
      const response = await fetch(
        `${env.supabase.url}/functions/v1/make-server-2e5a4e91/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.supabase.anonKey}`,
          },
          body: JSON.stringify(loginForm),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка входа')
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
      const response = await fetch(
        `${env.supabase.url}/functions/v1/make-server-2e5a4e91/register-photographer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.supabase.anonKey}`,
          },
          body: JSON.stringify(registerForm),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        // Если пользователь уже существует, предлагаем войти
        if (result.errorType === 'user_exists') {
          setError(`${result.error} Переключитесь на вкладку "Вход".`)
          setLoginForm({
            email: registerForm.email,
            password: registerForm.password,
          })
          setActiveTab('login')
          return
        }
        throw new Error(result.error || 'Ошибка регистрации')
      }

      // После у��пешной регистрации автоматически входим
      // Делаем автоматический вход
      const loginResponse = await fetch(
        `${env.supabase.url}/functions/v1/make-server-2e5a4e91/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.supabase.anonKey}`,
          },
          body: JSON.stringify({
            email: registerForm.email,
            password: registerForm.password,
          }),
        }
      )

      const loginResult = await loginResponse.json()

      if (!loginResponse.ok) {
        throw new Error(loginResult.error || 'Ошибка входа после регистрации')
      }

      onLogin(loginResult.user)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Language Switcher - Mobile optimized */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
        {/* Левая сторона - Информация о продукте */}
        <div className="text-center lg:text-left space-y-6 lg:space-y-8 px-4 lg:px-0">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <Camera className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600" />
              <h1 className="text-2xl lg:text-4xl font-bold text-gray-900">
                Pixora
              </h1>
            </div>
            <p className="text-lg lg:text-xl text-gray-600">
              <Trans>Platform for digitizing photo services</Trans>
            </p>
          </div>

          <div className="grid gap-4 lg:gap-6">
            <div className="flex items-start gap-3 lg:gap-4">
              <Camera className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm lg:text-base">
                  <Trans>Fast upload</Trans>
                </h3>
                <p className="text-gray-600 text-sm lg:text-base">
                  <Trans>Instant photo sync from mobile device</Trans>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 lg:gap-4">
              <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm lg:text-base">
                  <Trans>Guest convenience</Trans>
                </h3>
                <p className="text-gray-600 text-sm lg:text-base">
                  <Trans>Passwordless access to personal galleries</Trans>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 lg:gap-4">
              <Star className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm lg:text-base">
                  <Trans>Branding</Trans>
                </h3>
                <p className="text-gray-600 text-sm lg:text-base">
                  <Trans>Complete customization for your style</Trans>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Правая сторона - Формы */}
        <div className="space-y-4 lg:space-y-6 w-full max-w-md lg:max-w-none">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-10 lg:h-11">
              <TabsTrigger value="login" className="text-xs lg:text-sm">
                <Trans>Login</Trans>
              </TabsTrigger>
              <TabsTrigger value="register" className="text-xs lg:text-sm">
                <Trans>Registration</Trans>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Sign in</Trans>
                  </CardTitle>
                  <CardDescription>
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
                      <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                        {error}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? _(t`Signing in...`) : _(t`Sign in`)}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Trans>Photographer registration</Trans>
                  </CardTitle>
                  <CardDescription>
                    <Trans>Create an account for your photo studio</Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                      <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                        {error}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? _(t`Creating...`) : _(t`Create account`)}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Доступ для гостей */}
          <Card className="border-dashed border-gray-300">
            <CardHeader>
              <CardTitle className="text-center">
                <Trans>Guest access</Trans>
              </CardTitle>
              <CardDescription className="text-center">
                <Trans>Enter your guest ID to view photos</Trans>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGuestAccess} className="space-y-4">
                <Input
                  placeholder={_(t`Enter guest ID (e.g., GUEST123)`)}
                  value={guestId}
                  onChange={(e) => setGuestId(e.target.value)}
                  required
                />
                <Button type="submit" variant="outline" className="w-full">
                  <Trans>View photos</Trans>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
