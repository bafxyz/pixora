# Роль: Guest (Гость/Клиент)

## Описание роли
Guest - это роль конечного клиента в системе Pixora. Гости получают доступ к своим фотографиям с мероприятий, могут просматривать, выбирать и заказывать фото. Доступ предоставляется через QR код или прямую ссылку без необходимости регистрации.

## Права доступа

### Основные возможности
- ✅ Просмотр своих фотографий
- ✅ Добавление фото в корзину
- ✅ Оформление заказа
- ✅ Скачивание превью с водяным знаком
- ✅ Скачивание оплаченных фото в высоком качестве
- ❌ Доступ к фото других гостей
- ❌ Изменение цен
- ❌ Удаление фотографий

### Доступные страницы
- `/session/[id]` - Личная галерея фотосессии
- `/gallery/[guestId]` - Персональная галерея (legacy)
- `/checkout` - Страница оформления заказа
- `/order/[id]` - Просмотр заказа

### API Endpoints

#### Доступные endpoints
- `GET /api/session/[id]` - Получение данных сессии и фото
- `GET /api/gallery/[guestId]` - Получение фото гостя
- `POST /api/cart/add` - Добавление в корзину
- `POST /api/orders/create` - Создание заказа
- `GET /api/orders/[id]` - Просмотр своего заказа

#### Защищенные endpoints
- Все `/api/admin/*` - ❌ Запрещено
- Все `/api/studio-admin/*` - ❌ Запрещено
- `/api/photos/save` - ❌ Запрещено

## Пользовательский путь (User Journey)

### 1. Получение доступа
```mermaid
Способы доступа:
├── QR код на мероприятии
│   └── Сканирование → Переход в галерею
├── Ссылка по email/SMS
│   └── Клик → Открытие галереи
└── Прямой URL
    └── Ввод в браузере → Галерея
```

### 2. Первый визит
```typescript
interface FirstVisitExperience {
  // Приветственный экран
  welcome: {
    studioLogo: string
    welcomeMessage: string
    eventName: string
    photosCount: number
  }

  // Статус фотосессии
  status:
    | 'processing'    // Фото загружаются
    | 'ready'        // Фото доступны
    | 'expired'      // Срок хранения истек

  // Инструкция
  tutorial: {
    showOnFirstVisit: boolean
    steps: ['browse', 'select', 'order', 'download']
  }
}
```

### 3. Просмотр галереи

#### Интерфейс галереи
```
┌─────────────────────────────────────┐
│     [Studio Logo]  Event Name       │
├─────────────────────────────────────┤
│  Filters: [All] [Portraits] [Group] │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │Photo│ │Photo│ │Photo│ │Photo│  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │Photo│ │Photo│ │Photo│ │Photo│  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
├─────────────────────────────────────┤
│    [Cart (3)]  [Checkout →]         │
└─────────────────────────────────────┘
```

#### Функции галереи
- **Сетка фотографий** - адаптивная под размер экрана
- **Лайтбокс** - полноэкранный просмотр
- **Фильтры** - по типу фото, дате, фотографу
- **Поиск** - по номеру фото
- **Сортировка** - по дате, популярности

### 4. Выбор и заказ фотографий

#### Процесс выбора
```typescript
interface PhotoSelection {
  // Действия с фото
  actions: {
    preview: () => void      // Просмотр в полном размере
    addToCart: () => void    // Добавить в корзину
    favorite: () => void     // Добавить в избранное
    share: () => void        // Поделиться (с watermark)
  }

  // Информация о фото
  details: {
    id: string
    resolution: string
    fileSize: string
    price: number
    package?: PackageOption
  }
}
```

#### Корзина покупок
```typescript
interface ShoppingCart {
  items: CartItem[]

  packages: {
    single: { price: number, format: 'digital' }
    bundle5: { price: number, discount: '20%' }
    bundle10: { price: number, discount: '30%' }
    allPhotos: { price: number, discount: '50%' }
  }

  totals: {
    subtotal: number
    discount: number
    total: number
  }

  actions: {
    updateQuantity: (itemId: string, qty: number) => void
    removeItem: (itemId: string) => void
    applyPromo: (code: string) => void
    checkout: () => void
  }
}
```

### 5. Оформление заказа

#### Форма заказа
```typescript
interface CheckoutForm {
  // Контактные данные
  contact: {
    name: string        // Обязательное
    email: string       // Обязательное
    phone?: string      // Опциональное
  }

  // Способ получения
  delivery:
    | 'digital'         // Email ссылка
    | 'usb'            // Физический носитель
    | 'print'          // Печать

  // Оплата
  payment:
    | 'card'           // Банковская карта
    | 'cash'           // Наличные в студии
    | 'transfer'       // Банковский перевод

  // Дополнительно
  extras: {
    rushProcessing: boolean  // Срочная обработка
    rawFiles: boolean        // RAW файлы
    extendedStorage: boolean // Продление хранения
  }
}
```

## Функциональные возможности

### 1. Галерея фотографий

#### Режимы просмотра
- **Сетка** - компактный просмотр всех фото
- **Слайдшоу** - автоматическая смена фото
- **Сравнение** - выбор из похожих кадров

#### Качество изображений
```typescript
interface ImageQuality {
  thumbnail: {
    size: '300x300',
    watermark: true,
    free: true
  },
  preview: {
    size: '1200x800',
    watermark: true,
    free: true
  },
  full: {
    size: 'original',
    watermark: false,
    requiresPurchase: true
  }
}
```

### 2. Социальные функции

#### Sharing (Поделиться)
- Кнопки социальных сетей
- Генерация ссылки для друзей
- QR код галереи для передачи другим

#### Отзывы и рейтинги
- Оценка работы фотографа
- Отзыв о мероприятии
- Рекомендации друзьям

### 3. Уведомления

#### Email уведомления
- Фотографии готовы к просмотру
- Напоминание о неоформленном заказе
- Скоро истечет срок хранения
- Заказ готов к скачиванию

#### SMS уведомления (опционально)
- Короткая ссылка на галерею
- Код для быстрого доступа

## Мобильная версия

### Оптимизация для смартфонов
```typescript
interface MobileOptimization {
  // Адаптивный дизайн
  responsive: {
    breakpoints: ['320px', '768px', '1024px']
    touchGestures: ['swipe', 'pinch', 'doubletap']
  }

  // Производительность
  performance: {
    lazyLoading: true
    infiniteScroll: true
    cachedThumbnails: true
  }

  // PWA функции
  pwa: {
    offlineMode: 'limited'
    addToHomeScreen: true
    pushNotifications: true
  }
}
```

### Жесты управления
- **Swipe** - листание фото
- **Pinch** - масштабирование
- **Double tap** - быстрое добавление в корзину
- **Long press** - контекстное меню

## Ограничения и правила

### Временные ограничения
- **Срок хранения фото**: 14 дней (настраивается)
- **Время на оплату заказа**: 48 часов
- **Доступ к оплаченным фото**: бессрочный

### Ограничения доступа
```typescript
// Проверка доступа к фото
function canAccessPhoto(guest: Guest, photo: Photo): boolean {
  return (
    // Фото принадлежит гостю
    photo.guestId === guest.id ||
    // Фото из сессии гостя
    photo.sessionId === guest.sessionId ||
    // Фото куплено гостем
    guest.purchasedPhotos.includes(photo.id)
  )
}
```

### Правила использования
- ✅ Личное использование фото
- ✅ Публикация в соцсетях с указанием студии
- ⚠️ Коммерческое использование по согласованию
- ❌ Перепродажа фотографий
- ❌ Удаление водяных знаков без покупки

## Процесс оплаты

### Способы оплаты
1. **Онлайн оплата картой**
   - Интеграция с платежным шлюзом
   - Безопасная обработка данных
   - Мгновенный доступ после оплаты

2. **Оплата в студии**
   - Резервирование заказа
   - Оплата при визите
   - Получение на месте

3. **Банковский перевод**
   - Для корпоративных клиентов
   - Выставление счета
   - Доступ после подтверждения

### После оплаты
```typescript
interface PostPurchaseExperience {
  // Немедленный доступ
  immediate: {
    downloadLinks: string[]
    emailConfirmation: boolean
    removeWatermarks: boolean
  }

  // Дополнительные опции
  extras: {
    cloudStorage: '90 days'
    printOptions: boolean
    shareWithFamily: boolean
  }

  // Поддержка
  support: {
    downloadIssues: '24/7 chat'
    qualityComplaints: 'email'
    refundPolicy: '7 days'
  }
}
```

## FAQ для гостей

### Частые вопросы

**Q: Как долго хранятся фотографии?**
A: Фотографии доступны для просмотра и заказа в течение 14 дней. После покупки - бессрочно.

**Q: Можно ли скачать фото бесплатно?**
A: Превью с водяным знаком доступны бесплатно. Полные версии - после оплаты.

**Q: Как поделиться галереей с семьей?**
A: Используйте кнопку "Поделиться" для генерации ссылки или QR кода.

**Q: Что делать, если не могу найти свои фото?**
A: Проверьте правильность ссылки или обратитесь в поддержку студии.

**Q: Можно ли заказать печать фотографий?**
A: Да, выберите опцию "Печать" при оформлении заказа.

## Метрики и аналитика

### Отслеживаемые действия
```typescript
interface GuestAnalytics {
  // Вовлеченность
  engagement: {
    viewsCount: number
    viewDuration: number
    photosViewed: number
    returningVisits: number
  }

  // Конверсия
  conversion: {
    cartAdditions: number
    checkoutStarts: number
    completedOrders: number
    averageOrderValue: number
  }

  // Поведение
  behavior: {
    deviceType: 'mobile' | 'desktop'
    referralSource: string
    shareActions: number
    downloadAttempts: number
  }
}
```

## Поддержка клиентов

### Каналы поддержки
- **Live Chat** - на странице галереи
- **Email** - support@studio.com
- **Phone** - горячая линия студии
- **FAQ** - раздел помощи

### Типичные проблемы
| Проблема | Решение |
|----------|---------|
| Фото не загружаются | Проверить интернет-соединение |
| Не приходит email | Проверить папку спам |
| Ошибка оплаты | Связаться с банком |
| Плохое качество превью | Это защита от копирования |

## Правовые аспекты

### Согласие на обработку
- Информирование о фотосъемке
- Согласие на публикацию
- Право на удаление по запросу

### Конфиденциальность
- Защита персональных данных
- Безопасная обработка платежей
- Отсутствие публичного доступа к галереям

---

**Важно**: Guest - это конечный пользователь системы, от удовлетворенности которого зависит успех всего бизнеса. Интерфейс должен быть максимально простым, понятным и приятным в использовании.