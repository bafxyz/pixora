-- Мульти-тенантная миграция для Pixora
-- Добавление таблицы clients и обновление существующих таблиц

-- 1. Создаем таблицу clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    branding JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Добавляем client_id в таблицу photographers
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- 3. Добавляем client_id в таблицу guests
ALTER TABLE guests
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- 4. Добавляем client_id в таблицу photos
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- 5. Добавляем client_id в таблицу orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- 6. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_photographers_client_id ON photographers(client_id);
CREATE INDEX IF NOT EXISTS idx_guests_client_id ON guests(client_id);
CREATE INDEX IF NOT EXISTS idx_photos_client_id ON photos(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);

-- 7. Обновляем существующие записи (привязываем к первому клиенту)
-- Создаем тестового клиента
INSERT INTO clients (id, name, email, phone) VALUES
('client-default', 'Default Photo Studio', 'admin@default.com', '+1234567890')
ON CONFLICT (id) DO NOTHING;

-- Привязываем существующих фотографов к клиенту
UPDATE photographers SET client_id = 'client-default' WHERE client_id IS NULL;

-- Привязываем гостей к клиентам через фотографов
UPDATE guests SET client_id = (
    SELECT client_id FROM photographers WHERE id = guests.photographer_id
) WHERE client_id IS NULL;

-- Привязываем фото к клиентам через гостей
UPDATE photos SET client_id = (
    SELECT client_id FROM guests WHERE id = photos.guest_id
) WHERE client_id IS NULL AND guest_id IS NOT NULL;

-- Привязываем фото к клиентам через фотографов (для фото без гостей)
UPDATE photos SET client_id = (
    SELECT client_id FROM photographers WHERE id = photos.photographer_id
) WHERE client_id IS NULL;

-- Привязываем заказы к клиентам через гостей
UPDATE orders SET client_id = (
    SELECT client_id FROM guests WHERE id = orders.guest_id
) WHERE client_id IS NULL;

-- 8. Делаем client_id обязательным полем
ALTER TABLE photographers ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE guests ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE photos ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN client_id SET NOT NULL;

-- 9. Создаем RLS политики для безопасности
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Политика для clients: только владелец может видеть своего клиента
CREATE POLICY "Users can view own client" ON clients
    FOR SELECT USING (auth.uid()::text = id::text);

-- Политика для photographers: только пользователи своего клиента
CREATE POLICY "Users can view photographers from own client" ON photographers
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients WHERE auth.uid()::text = id::text
        )
    );

-- Аналогичные политики для остальных таблиц
CREATE POLICY "Users can view guests from own client" ON guests
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients WHERE auth.uid()::text = id::text
        )
    );

CREATE POLICY "Users can view photos from own client" ON photos
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients WHERE auth.uid()::text = id::text
        )
    );

CREATE POLICY "Users can view orders from own client" ON orders
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients WHERE auth.uid()::text = id::text
        )
    );

-- 10. Создаем функцию для получения client_id пользователя
CREATE OR REPLACE FUNCTION get_current_client_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM clients
        WHERE auth.uid()::text = id::text
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Добавляем триггеры для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();