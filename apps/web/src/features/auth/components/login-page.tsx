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
    setError('') // Очищаем ошибки при переключении вкладок
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
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Левая сторона - Информация о продукте */}
        <div className="text-center lg:text-left space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <Camera className="w-10 h-10 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">Pixora</h1>
            </div>
            <p className="text-xl text-gray-600">
              Платформа для цифровизации фото-услуг
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <Camera className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Быстрая загрузка
                </h3>
                <p className="text-gray-600">
                  Мгновенная синхронизация фото с мобильного устройства
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Users className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  Удобство для гостей
                </h3>
                <p className="text-gray-600">
                  Беспарольный доступ к персональным галереям
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Star className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Брендинг</h3>
                <p className="text-gray-600">
                  Полная кастомизация под ваш стиль
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Правая сторона - Формы */}
        <div className="space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Вход в систему</CardTitle>
                  <CardDescription>
                    Войдите в свой аккаунт фотографа
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="photographer@studio.com"
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
                      <Label htmlFor="password">Пароль</Label>
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
                      {isLoading ? 'Вход...' : 'Войти'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Регистрация фотографа</CardTitle>
                  <CardDescription>
                    Создайте аккаунт для вашей фотостудии
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Имя</Label>
                        <Input
                          id="firstName"
                          placeholder="Иван"
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
                        <Label htmlFor="lastName">Фамилия</Label>
                        <Input
                          id="lastName"
                          placeholder="Петров"
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
                      <Label htmlFor="studioName">Название студии</Label>
                      <Input
                        id="studioName"
                        placeholder="Студия Петрова"
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
                      <Label htmlFor="regEmail">Email</Label>
                      <Input
                        id="regEmail"
                        type="email"
                        placeholder="photographer@studio.com"
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
                      <Label htmlFor="regPassword">Пароль</Label>
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
                      {isLoading ? 'Создание...' : 'Создать аккаунт'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Доступ для гостей */}
          <Card className="border-dashed border-gray-300">
            <CardHeader>
              <CardTitle className="text-center">Гостевой доступ</CardTitle>
              <CardDescription className="text-center">
                Введите ваш ID для просмотра фотографий
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGuestAccess} className="space-y-4">
                <Input
                  placeholder="Введите ID гостя (например: GUEST123)"
                  value={guestId}
                  onChange={(e) => setGuestId(e.target.value)}
                  required
                />
                <Button type="submit" variant="outline" className="w-full">
                  Посмотреть фотографии
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
