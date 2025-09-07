const config = {
  locales: ['en', 'ru'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: 'src/shared/locales/{locale}/messages',
      include: ['src'],
      exclude: ['**/node_modules/**'],
    },
  ],
  format: 'po',
  compileNamespace: 'cjs',
}

export default config
