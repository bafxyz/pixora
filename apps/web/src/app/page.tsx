'use client'

import { Trans } from '@lingui/react/macro'
import { Camera, CheckCircle, Users } from 'lucide-react'
import Link from 'next/link'

import { LanguageSwitcher } from '@/shared/components/language-switcher'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <LanguageSwitcher />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
            <Trans>Welcome to Photography Gallery</Trans>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            <Trans>
              Discover and showcase stunning photography. Connect with
              photographers, explore galleries, and share your visual stories.
            </Trans>
          </p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-indigo-600 text-white hover:from-primary/90 hover:to-indigo-600/90 h-12 px-8 font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Trans>Get Started</Trans>
            </Link>
            <Link
              href="/session"
              className="inline-flex items-center justify-center rounded-lg border-2 border-primary/20 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-accent/10 hover:to-secondary/10 hover:border-primary/40 h-12 px-8 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Trans>Browse Gallery</Trans>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">
              <Trans>Showcase Your Work</Trans>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              <Trans>
                Upload and display your photography portfolio with professional
                presentation.
              </Trans>
            </p>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-br from-secondary to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">
              <Trans>Connect with Others</Trans>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              <Trans>
                Network with fellow photographers and art enthusiasts in our
                community.
              </Trans>
            </p>
          </div>

          <div className="text-center p-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-br from-accent to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">
              <Trans>Professional Tools</Trans>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              <Trans>
                Access advanced features for managing your photography business
                and portfolio.
              </Trans>
            </p>
          </div>
        </div>

        <div className="text-center bg-white/50 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-xl">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            <Trans>Ready to Start Your Journey?</Trans>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg max-w-xl mx-auto">
            <Trans>
              Join thousands of photographers already using our platform to
              showcase their work.
            </Trans>
          </p>
          <Link
            href="/login?tab=register"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary via-secondary to-accent text-white hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 h-14 px-10 font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 text-lg"
          >
            <Trans>Create Your Account</Trans>
          </Link>
        </div>
      </div>
    </div>
  )
}
