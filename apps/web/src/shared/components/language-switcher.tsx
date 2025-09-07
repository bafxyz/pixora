'use client'

import { useLingui } from '@lingui/react'
import { Button } from '@repo/ui/button'
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
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4" />
      {Object.entries(locales).map(([code, name]) => (
        <Button
          key={code}
          variant={currentLocale === code ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleLocaleChange(code as LocaleCode)}
          className="text-xs"
        >
          {name}
        </Button>
      ))}
    </div>
  )
}
