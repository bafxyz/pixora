# Order Management System

## Overview
Полная система управления заказами с поддержкой онлайн оплаты через Robokassa и оплаты наличными.

## Database Schema

### Table: `orders`
```sql
- id (uuid, PK)
- client_id (uuid, FK -> clients)
- photographer_id (uuid, FK -> photographers)
- session_id (uuid, FK -> photo_sessions)
- guest_email (string, required)
- guest_name (string, optional)
- guest_phone (string, optional)
- status (enum: pending, processing, completed, cancelled)
- payment_method (enum: cash, robokassa)
- payment_status (enum: pending, paid, failed, refunded)
- total_amount (decimal 10,2)
- discount (decimal 10,2, default 0)
- final_amount (decimal 10,2)
- robokassa_invoice_id (string, optional)
- robokassa_payment_link (string, optional)
- notes (text, optional)
- processed_at (timestamp, optional)
- completed_at (timestamp, optional)
- created_at (timestamp)
- updated_at (timestamp)
```

### Table: `order_items`
```sql
- id (uuid, PK)
- order_id (uuid, FK -> orders)
- photo_id (uuid, FK -> photos)
- price (decimal 10,2)
- created_at (timestamp)
```

## Pricing Configuration
```javascript
const pricePerPhoto = 5.00 // Цена за 1 фото
const bulkDiscountThreshold = 20 // Порог для скидки
const bulkDiscountPercent = 15 // Процент скидки (15%)
```

**Пример расчета:**
- 10 фото = $50.00 (без скидки)
- 20 фото = $85.00 ($100 - 15% = $85)
- 30 фото = $127.50 ($150 - 15% = $127.50)

## Checkout Flow

### 1. Guest добавляет фото в корзину
- Клик на кнопку "Add to Cart" в галерее
- Фото сохраняются в `localStorage`
- Counter обновляется в реальном времени

### 2. Переход в корзину (`/session/[id]/cart`)
- Отображение всех выбранных фото
- Расчет цены с учетом скидок
- Кнопка "Proceed to Checkout"

### 3. Checkout Page
**Guest Information:**
- Email (обязательно)
- Name (опционально)
- Phone (опционально)

**Payment Method Selection:**
- **Online Payment (Robokassa):**
  - Редирект на Robokassa payment page
  - Поддержка карт, электронных кошельков
  - Мгновенное подтверждение

- **Cash Payment:**
  - Заказ создается со статусом "pending"
  - Уведомление фотографу и админу
  - Оплата при получении

### 4. Order Placement
```javascript
POST /api/orders
{
  "sessionId": "uuid",
  "guestEmail": "guest@example.com",
  "guestName": "John Doe",
  "guestPhone": "+1234567890",
  "photoIds": ["photo-uuid-1", "photo-uuid-2"],
  "paymentMethod": "robokassa" | "cash"
}
```

**Response for Robokassa:**
```json
{
  "success": true,
  "order": {
    "id": "order-uuid",
    "finalAmount": 85.00,
    "paymentMethod": "robokassa",
    "paymentLink": "https://auth.robokassa.ru/..."
  }
}
```

**Response for Cash:**
```json
{
  "success": true,
  "order": {
    "id": "order-uuid",
    "finalAmount": 85.00,
    "paymentMethod": "cash"
  }
}
```

## Robokassa Integration

### Configuration (`.env.local`)
```bash
ROBOKASSA_LOGIN=your_merchant_login
ROBOKASSA_PASSWORD_1=password_for_generating_signature
ROBOKASSA_PASSWORD_2=password_for_validating_callback
ROBOKASSA_TEST_MODE=true # false for production
```

### Payment URL Generation
```javascript
const signature = MD5(`${login}:${outSum}:${invId}:${password1}`)
const paymentUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?
  MerchantLogin=${login}
  &OutSum=${amount}
  &InvId=${orderId}
  &Description=${description}
  &SignatureValue=${signature}
  &Email=${guestEmail}
  &IsTest=${testMode ? 1 : 0}`
```

### Callback Handling
**Endpoint:** `POST /api/orders/robokassa-callback`

**Parameters:**
- `OutSum` - сумма заказа
- `InvId` - ID заказа (order.id)
- `SignatureValue` - MD5 подпись

**Validation:**
```javascript
const expectedSignature = MD5(`${outSum}:${invId}:${password2}`)
if (signatureValue.toUpperCase() !== expectedSignature.toUpperCase()) {
  return 400 // Invalid signature
}
```

**Success Response:**
```
OK{InvId}
```

**Order Update:**
- `payment_status` → `paid`
- `status` → `pending` (waiting for processing)
- Trigger notifications

## Order Status Management

### Status Flow
```
1. pending → Новый заказ, ждет оплаты/подтверждения
2. processing → Фотограф начал обработку
3. completed → Заказ выполнен
4. cancelled → Заказ отменен
```

### Payment Status Flow
```
1. pending → Ожидает оплаты
2. paid → Оплачен
3. failed → Ошибка оплаты
4. refunded → Возврат средств
```

## Notifications System ✅

### Database Schema
**Table:** `notifications`
```sql
- id (uuid, PK)
- type (enum: new_order, order_status_changed, payment_received)
- recipient_email (string)
- order_id (uuid, FK -> orders)
- title (string)
- message (string)
- is_read (boolean, default false)
- created_at (timestamp)
- read_at (timestamp, optional)
```

### Notification Service
**Location:** `/src/lib/services/notification.service.ts`

**Methods:**
- `notifyNewOrder(orderId)` - уведомление о новом заказе
- `notifyPaymentReceived(orderId)` - уведомление об оплате
- `markAsRead(notificationId)` - пометить прочитанным
- `getUnread(email)` - получить непрочитанные
- `getAll(email, limit)` - получить все уведомления

### Automatic Triggers
1. **New Order Created** → `notifyNewOrder()`
   - Triggered in: `POST /api/orders` after order creation
   - Recipient: photographer assigned to session
   - Content: "New Order: X photos from [session]"

2. **Payment Received** → `notifyPaymentReceived()`
   - Triggered in: `POST /api/orders/robokassa-callback` after payment confirmation
   - Recipient: photographer assigned to session
   - Content: "Payment of $X received for order [id]"

### API Endpoints
```
GET /api/notifications
GET /api/notifications?unread=true
POST /api/notifications/[id]/read
```

### Future Channels
- Email notifications (Phase 2)
- In-app notifications UI (Phase 2)
- Telegram/SMS (Phase 3)

## API Endpoints

### Orders

#### Create Order
```
POST /api/orders
Auth: None (public)
Body: { sessionId, guestEmail, guestName?, guestPhone?, photoIds[], paymentMethod }
Response: { success, order: { id, finalAmount, paymentMethod, paymentLink? } }
```

#### List Orders
```
GET /api/orders/list
Auth: photographer, admin
Query: ?status=pending&paymentStatus=paid (optional filters)
Response: { orders: Order[] }

Notes:
- Photographers see only their orders (where photographerId = user.id)
- Admins see ALL orders from all studios
```

#### Update Order Status
```
PATCH /api/orders/[id]/status
Auth: photographer (own orders only), admin (all orders)
Body: { status: "processing" | "completed" | "cancelled" }
Response: { order: Order }

Status Flow:
- pending → processing → completed
- pending/processing → cancelled
```

#### Robokassa Callback
```
POST /api/orders/robokassa-callback
Auth: Robokassa signature verification
Body: FormData { OutSum, InvId, SignatureValue }
Response: OK{InvId}
```

### Notifications

#### Get Notifications
```
GET /api/notifications
GET /api/notifications?unread=true
Auth: photographer, admin
Response: { notifications: Notification[] }
```

#### Mark as Read
```
POST /api/notifications/[id]/read
Auth: photographer, admin
Response: { notification: Notification }
```

### Monitoring & Stats

#### Get Monitoring Data
```
GET /api/admin/monitoring
Auth: admin
Response: {
  health: { status, activeConnections },
  stats: { totalOrders, totalRevenue, pendingOrders, ... },
  logs: LogEntry[]
}
```

#### Get Platform Stats
```
GET /api/admin/stats
Auth: admin
Response: {
  stats: {
    totalClients, totalPhotographers, totalPhotos,
    totalOrders, totalRevenue, totalGuests
  }
}
```

## Security

### Payment Security
- ✅ Robokassa signature verification
- ✅ HTTPS only for payment redirects
- ✅ No sensitive data stored in frontend
- ✅ Order IDs are UUIDs (non-guessable)

### Access Control
- Guests can only create orders
- Photographers can view orders for their sessions
- Admins can view all orders
- Order updates require authentication

## Testing

### Test Robokassa Payment
1. Set `ROBOKASSA_TEST_MODE=true`
2. Use test credentials from Robokassa
3. Test payment URL will include `IsTest=1`
4. Use test cards provided by Robokassa

### Test Cash Payment
1. Create order with `paymentMethod: "cash"`
2. Verify order created with `payment_status: "pending"`
3. Check notifications sent (when implemented)

## Order Management Dashboard ✅

### Access Points

#### Admin Dashboard (`/admin`)
**New Card: "Orders Management"**
- Icon: ShoppingCart (blue-cyan gradient)
- Description: "View and manage orders, update statuses and track payments"
- Button: "Manage Orders"
- Route: `/admin/orders`

### Orders Page (`/admin/orders`)

#### Access Control
- **Admin Role:** See ALL orders from all photographers/studios
- **Photographer Role:** See ONLY their own orders

#### Features
1. **Filters**
   - Status: All / Pending / Processing / Completed / Cancelled
   - Payment: All / Pending / Paid / Failed
   - Real-time count display

2. **Order Cards Display**
   - Session name & scheduled date
   - Order ID (first 8 chars)
   - Creation timestamp
   - Status badges (color-coded)
   - Payment status badges (color-coded)
   - Guest information (name, email, phone)
   - Payment method (CASH / ROBOKASSA)
   - Photo count
   - Price breakdown (subtotal, discount, total)

3. **Status Management Actions**
   - **Pending:** "Start Processing" button
   - **Processing:** "Mark as Completed" button
   - **Pending/Processing:** "Cancel Order" button
   - Actions update order status via API

4. **Internationalization**
   - Full Russian translations (ru)
   - English default (en)

### Real-time Updates
- Orders list refreshes on filter change
- Status updates reflect immediately
- No page reload needed

## Future Enhancements

### Phase 2 (Priority)
- [x] ✅ Notification system (database-backed)
- [x] ✅ Order management dashboard
- [x] ✅ Real-time order stats in monitoring
- [ ] In-app notifications UI (bell icon with badge)
- [ ] Email notifications integration
- [ ] Order history для guests (по email)
- [ ] Download links для оплаченных фото
- [ ] Automatic watermark removal после оплаты

### Phase 3
- [ ] Invoice generation (PDF)
- [ ] Refund processing через Robokassa
- [ ] Batch order updates
- [ ] Order analytics & charts
- [ ] Subscription plans
- [ ] Gift cards/promo codes
- [ ] Push notifications (PWA)

## Integration Points

### With Existing System
- ✅ Uses existing `PhotoSession` для контекста
- ✅ Uses existing `Photo` для items
- ✅ Uses existing `Client` для отчетности
- ✅ Uses existing `Photographer` для notifications
- ✅ Integrated with cart system (localStorage)

### Database Relations
```
Order → PhotoSession → Photographer
Order → PhotoSession → Client
Order → OrderItems → Photos
Notification → Order (via order_id)
```

## Migration Notes

### Applied Changes
1. ✅ Added `orders` table with all required fields
2. ✅ Added `order_items` junction table
3. ✅ Added `notifications` table
4. ✅ Added enums: `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `NotificationType`
5. ✅ Added relations to existing tables
6. ✅ Created NotificationService for automatic notifications
7. ✅ Created Orders Management UI (`/admin/orders`)
8. ✅ Updated Admin Dashboard with Orders card
9. ✅ Updated Monitoring & Stats pages with real order data
10. ✅ No breaking changes to existing schema

### Required Configuration
1. Set up Robokassa account
2. Add environment variables
3. Configure callback URLs in Robokassa dashboard:
   - Result URL: `https://your-domain.com/api/orders/robokassa-callback`
   - Success URL: `https://your-domain.com/payment/success`
   - Fail URL: `https://your-domain.com/payment/fail`