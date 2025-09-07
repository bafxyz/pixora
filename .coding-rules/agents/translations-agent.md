---
description: Guidelines for managing translations and internationalization with Lingui
globs: "**/*.po, **/*.tsx, **/*.ts, **/lingui.config.ts"
---

## Overview

This agent specializes in managing internationalization (i18n) using [Lingui.dev](https://lingui.dev/). It handles translation extraction, management of message catalogs, and ensures proper i18n implementation across the codebase.

## Project i18n Setup

### Current Configuration
- **Framework**: Lingui.dev v5.4.1
- **Locales**: English (en) - source, Russian (ru)
- **Catalogs**: `src/shared/locales/{locale}/messages.po`
- **Compilation**: Compiled to JSON files (`.json`) for Next.js compatibility
- **Integration**: Next.js 15 with SWC plugin

### File Structure
```
src/
├── shared/
│   ├── lib/
│   │   └── i18n.ts                    # Locale management utilities
│   ├── providers/
│   │   └── i18n-provider.tsx          # React i18n context provider
│   ├── components/
│   │   └── language-switcher.tsx      # UI for switching languages
│   └── locales/
│       ├── en/
│       │   ├── messages.po            # English translation catalog
│       │   └── messages.json          # Compiled English translations
│       └── ru/
│           ├── messages.po            # Russian translation catalog
│           └── messages.json          # Compiled Russian translations
├── features/
│   └── [feature]/
│       └── components/                # Components with translations
└── app/
    └── layout.tsx                     # Root layout with LinguiProvider
```

## Workflow Commands

### Essential Commands
```bash
# Extract translatable strings from code
pnpm extract

# Compile translations for production
pnpm compile

# Development workflow
pnpm extract && pnpm compile && pnpm dev
```

### Translation Workflow
1. **Add translations** to components using Lingui macros
2. **Extract** strings with `pnpm extract`
3. **Translate** in `.po` files (add `msgstr` values)
4. **Compile** with `pnpm compile`
5. **Test** language switching in browser

## Translation Patterns

### 1. Static Text Translation
```tsx
import { Trans } from '@lingui/macro'

// Use Trans for static text
<h1><Trans>Login</Trans></h1>
<p><Trans>Welcome to our platform</Trans></p>
<button><Trans>Create Account</Trans></button>
```

### 2. Dynamic Text Translation
```tsx
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

function MyComponent() {
  const { _ } = useLingui()
  
  // Use t macro for dynamic text
  const buttonText = isLoading ? _(t`Loading...`) : _(t`Submit`)
  const errorMessage = _(t`Invalid email address`)
  
  return (
    <div>
      <button>{buttonText}</button>
      {error && <p>{errorMessage}</p>}
    </div>
  )
}
```

### 3. Attribute Translation
```tsx
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

function FormComponent() {
  const { _ } = useLingui()
  
  return (
    <input 
      placeholder={_(t`Enter your email`)}
      aria-label={_(t`Email address field`)}
    />
  )
}
```

### 4. Pluralization
```tsx
import { plural } from '@lingui/macro'
import { useLingui } from '@lingui/react'

function ItemCounter({ count }: { count: number }) {
  const { _ } = useLingui()
  
  return (
    <span>
      {_(plural(count, {
        one: "# item",
        other: "# items"
      }))}
    </span>
  )
}
```

### 5. Variables in Translations
```tsx
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

function WelcomeMessage({ userName }: { userName: string }) {
  const { _ } = useLingui()
  
  return (
    <p>{_(t`Welcome back, ${userName}!`)}</p>
  )
}
```

## Message Catalog Management

### PO File Structure
```po
# Comment explaining context
#: src/features/auth/components/login-page.tsx:42
msgid "Login"
msgstr "Вход"  # Russian translation

# With variables
#: src/features/auth/components/welcome.tsx:15
msgid "Welcome back, {userName}!"
msgstr "Добро пожаловать, {userName}!"

# Pluralization
#: src/features/gallery/components/photo-count.tsx:23
msgid "{count, plural, one {# photo} other {# photos}}"
msgstr "{count, plural, one {# фотография} few {# фотографии} other {# фотографий}}"
```

### Translation Guidelines
1. **Keep context in mind** - Same English word may need different translations
2. **Use descriptive msgids** - Prefer full sentences over single words
3. **Handle pluralization** - Russian has complex plural forms (one/few/many/other)
4. **Test in UI** - Always verify translations appear correctly in context
5. **Maintain consistency** - Use consistent terminology across the app

## Best Practices

### 1. Component Organization
- Group related translations in feature folders
- Keep translation keys descriptive and contextual
- Use Trans for text content, t macro for attributes/dynamic content

### 2. Extraction Strategy
```tsx
// Good: Descriptive context
<Trans>Login to your photographer account</Trans>

// Avoid: Ambiguous single words
<Trans>Login</Trans> // Could be noun or verb
```

### 3. Error Handling
```tsx
// Always provide fallback text
const errorMessage = error?.message || _(t`An unexpected error occurred`)
```

### 4. Performance
- Compile translations before production builds
- Use dynamic imports for locale switching
- Avoid inline translation objects

### 5. Testing Translations
```tsx
// Test component with different locales
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'

// Switch locale in tests
i18n.activate('ru')
```

## Locale Management

### Adding New Locales
1. **Update config**: Add locale to `lingui.config.ts`
```ts
locales: ['en', 'ru', 'es'], // Add Spanish
```

2. **Create catalog**: `mkdir src/shared/locales/es`

3. **Extract and translate**: `pnpm extract` then translate

4. **Update types**: Add to `LocaleCode` type in `i18n.ts`

### Language Detection Priority
1. User's stored preference (localStorage)
2. Browser language preference
3. Fallback to English

## Integration Points

### Layout Integration
```tsx
// Root layout with i18n provider
import { LinguiProvider } from '@/shared/providers/i18n-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LinguiProvider>
          {children}
        </LinguiProvider>
      </body>
    </html>
  )
}
```

### Component Integration
```tsx
// Any component can use translations
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

export function MyComponent() {
  const { _ } = useLingui()
  
  return (
    <div>
      <h1><Trans>Page Title</Trans></h1>
      <p>{_(t`Dynamic message`)}</p>
    </div>
  )
}
```

## Common Issues & Solutions

### 1. Missing Translations
**Problem**: Text not translating
**Solution**: 
- Run `pnpm extract` to update catalogs
- Check `.po` files have `msgstr` values
- Run `pnpm compile` to generate JS files

### 2. Build Errors
**Problem**: Next.js build fails with Lingui
**Solution**: 
- Ensure SWC plugin is configured in `next.config.ts`
- Compile catalogs before build: `pnpm compile && pnpm build`

### 3. TypeScript Errors
**Problem**: TS errors with macro imports
**Solution**: 
- Install `@lingui/macro` as dependency
- Configure SWC plugin properly

### 4. Runtime Errors
**Problem**: Translations not loading
**Solution**: 
- Check compiled message files exist (`.json` files in locale directories)
- Verify locale loading imports from `.json` files
- Ensure catalogs are compiled with `pnpm compile`
- Check that import accesses `catalog.messages` for JSON format

## Maintenance Tasks

### Regular Tasks
- **Weekly**: Review untranslated strings (`pnpm extract`)
- **Before releases**: Ensure all translations are complete
- **After major features**: Extract and translate new strings

### Monitoring
- Check translation coverage in PO files
- Validate translations in different locales
- Monitor console for missing translation warnings

### Quality Assurance
- Test language switching functionality
- Verify UI layouts with different text lengths
- Check cultural appropriateness of translations
- Validate pluralization rules for each locale

## Resources

- [Lingui Documentation](https://lingui.dev/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Russian Pluralization Rules](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/language_plural_rules.html#ru)
- [Translation Context Best Practices](https://lingui.dev/guides/message-extraction#providing-context)