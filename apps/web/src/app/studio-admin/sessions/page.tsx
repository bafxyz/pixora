import { PageLayout } from '@/shared/components/page-layout'

export default async function StudioAdminSessionsPage() {
  return (
    <PageLayout
      title="Управление фотосессиями"
      description="Создание, планирование и отслеживание фотосессий"
    >
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">
          Здесь будет календарь фотосессий и инструменты управления
        </p>
      </div>
    </PageLayout>
  )
}
