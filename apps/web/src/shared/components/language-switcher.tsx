'use client'

import { useLingui } from '@lingui/react'
import { type LocaleCode, loadLocale, locales, saveLocale } from '../lib/i18n'

export function LanguageSwitcher() {
  const { i18n } = useLingui()
  const currentLocale = i18n.locale as LocaleCode

  const handleLocaleChange = async (newLocale: LocaleCode) => {
    if (newLocale !== currentLocale) {
      await loadLocale(newLocale)
      saveLocale(newLocale)
      // Force a re-render by reloading the page
      window.location.reload()
    }
  }

  return (
    <div className="flex items-center gap-1">
      {Object.entries(locales).map(([code, name]) => (
        <button
          key={code}
          type="button"
          onClick={() => handleLocaleChange(code as LocaleCode)}
          aria-label={`Switch to ${name} language`}
          className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 ${
            currentLocale === code
              ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-800 hover:bg-white/50 border border-transparent hover:border-white/30'
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
