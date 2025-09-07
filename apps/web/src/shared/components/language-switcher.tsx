'use client'

import { useLingui } from '@lingui/react'
import { Globe } from 'lucide-react'
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
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg shadow-sm">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {locales[currentLocale]}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {Object.entries(locales).map(([code, name]) => (
          <button
            key={code}
            type="button"
            onClick={() => handleLocaleChange(code as LocaleCode)}
            aria-label={`Switch to ${name} language`}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
              currentLocale === code
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border'
            }`}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
