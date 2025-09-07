'use client'

import { Trans } from '@lingui/macro'
import { Camera, CheckCircle, Users } from 'lucide-react'
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
            <Trans>Welcome to Photography Gallery</Trans>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            <Trans>
              Discover and showcase stunning photography. Connect with
              photographers, explore galleries, and share your visual stories.
            </Trans>
          </p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-medium transition-colors"
            >
              <Trans>Get Started</Trans>
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 px-8 font-medium transition-colors"
            >
              <Trans>Browse Gallery</Trans>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              <Trans>Showcase Your Work</Trans>
            </h3>
            <p className="text-muted-foreground">
              <Trans>
                Upload and display your photography portfolio with professional
                presentation.
              </Trans>
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              <Trans>Connect with Others</Trans>
            </h3>
            <p className="text-muted-foreground">
              <Trans>
                Network with fellow photographers and art enthusiasts in our
                community.
              </Trans>
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              <Trans>Professional Tools</Trans>
            </h3>
            <p className="text-muted-foreground">
              <Trans>
                Access advanced features for managing your photography business
                and portfolio.
              </Trans>
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            <Trans>Ready to Start Your Journey?</Trans>
          </h2>
          <p className="text-muted-foreground mb-6">
            <Trans>
              Join thousands of photographers already using our platform to
              showcase their work.
            </Trans>
          </p>
          <Link
            href="/login?tab=register"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-medium transition-colors"
          >
            <Trans>Create Your Account</Trans>
          </Link>
        </div>
      </div>
    </div>
  )
}
