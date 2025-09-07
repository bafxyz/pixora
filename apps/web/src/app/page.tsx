'use client'

import Link from 'next/link'
import { LanguageSwitcher } from '@/shared/components/language-switcher'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <LanguageSwitcher />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Welcome to Photography Gallery
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover and showcase stunning photography. Connect with
            photographers, explore galleries, and share your visual stories.
          </p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-medium transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 px-8 font-medium transition-colors"
            >
              Browse Gallery
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Camera icon"
              >
                <title>Camera icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Showcase Your Work</h3>
            <p className="text-muted-foreground">
              Upload and display your photography portfolio with professional
              presentation.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Users icon"
              >
                <title>Users icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect with Others</h3>
            <p className="text-muted-foreground">
              Network with fellow photographers and art enthusiasts in our
              community.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Checkmark icon"
              >
                <title>Checkmark icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Professional Tools</h3>
            <p className="text-muted-foreground">
              Access advanced features for managing your photography business
              and portfolio.
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of photographers already using our platform to
            showcase their work.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-medium transition-colors"
          >
            Create Your Account
          </Link>
        </div>
      </div>
    </div>
  )
}
