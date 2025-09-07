'use client'

import { i18n } from '@lingui/core'

export const locales = {
  en: 'English',
  ru: 'Русский',
} as const

export type LocaleCode = keyof typeof locales

// Initialize i18n instance
export async function initI18n(locale: LocaleCode) {
  const catalog = await import(`../locales/${locale}/messages.json`)
  i18n.load(locale, catalog.messages)
  i18n.activate(locale)
}

// Function to dynamically load locale
export async function loadLocale(locale: LocaleCode) {
  const catalog = await import(`../locales/${locale}/messages.json`)
  i18n.load(locale, catalog.messages)
  i18n.activate(locale)
}

// Get default locale from browser or fallback to 'en'
export function getDefaultLocale(): LocaleCode {
  if (typeof window === 'undefined') return 'en'

  const stored = localStorage.getItem('locale')
  if (stored && stored in locales) return stored as LocaleCode

  const browserLang = navigator.language?.split('-')[0]
  if (browserLang && browserLang in locales) return browserLang as LocaleCode

  return 'en'
}

// Save locale to localStorage
export function saveLocale(locale: LocaleCode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale)
  }
}
