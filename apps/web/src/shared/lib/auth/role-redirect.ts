import type { UserRole } from './role-guard'

/**
 * Возвращает путь для перенаправления в зависимости от роли пользователя
 * @param role Роль пользователя
 * @returns Путь для перенаправления
 */
export function getRoleRedirectPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'studio-admin':
      return '/studio-admin'
    case 'photographer':
      return '/photographer'
    case 'guest':
      return '/session'
    default:
      return '/photographer'
  }
}

/**
 * Проверяет, может ли пользователь с данной ролью получить доступ к указанному пути
 * @param userRole Роль пользователя
 * @param path Путь для проверки
 * @returns true, если доступ разрешен
 */
export function canAccessPath(userRole: UserRole, path: string): boolean {
  // Админ имеет доступ ко всем путям
  if (userRole === 'admin') {
    return true
  }

  // Публичные пути доступны всем
  const publicPaths = ['/', '/login', '/session', '/payment']

  if (publicPaths.some((publicPath) => path.startsWith(publicPath))) {
    return true
  }

  // Проверка доступа к специфичным путям по ролям
  switch (userRole) {
    case 'studio-admin':
      return (
        path.startsWith('/studio-admin') || path.startsWith('/photographer')
      )
    case 'photographer':
      return path.startsWith('/photographer')
    case 'guest':
      return path.startsWith('/session')
    default:
      return path.startsWith('/photographer')
  }
}

/**
 * Возвращает название роли для отображения пользователю
 * @param role Роль пользователя
 * @returns Локализованное название роли
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Администратор платформы'
    case 'studio-admin':
      return 'Администратор студии'
    case 'photographer':
      return 'Фотограф'
    case 'guest':
      return 'Гость'
    default:
      return 'Пользователь'
  }
}
