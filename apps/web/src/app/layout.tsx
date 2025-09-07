import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/shared/components/service-worker-register'
import { WebVitals } from '@/shared/components/web-vitals'
import { AuthProvider } from '@/shared/providers/auth-provider'
import { LinguiProvider } from '@/shared/providers/i18n-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Photography Gallery',
  description:
    'A modern photography gallery application with user authentication and image management',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LinguiProvider>
          <AuthProvider>
            {children}
            <ServiceWorkerRegister />
            <WebVitals />
          </AuthProvider>
        </LinguiProvider>
      </body>
    </html>
  )
}
