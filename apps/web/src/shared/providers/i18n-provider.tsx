'use client'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { useEffect, useState } from 'react'
import { getDefaultLocale, initI18n, type LocaleCode } from '../lib/i18n'

interface Props {
  children: React.ReactNode
  locale?: LocaleCode
}

export function LinguiProvider({ children, locale }: Props) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const activeLocale = locale || getDefaultLocale()

    initI18n(activeLocale).then(() => {
      setIsLoading(false)
    })
  }, [locale])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
