-- Fix migration for Pixora - handles existing OrderStatus type
-- This script will drop the existing type and recreate everything

-- Drop existing type first
DROP TYPE IF EXISTS "OrderStatus" CASCADE;

-- Now create everything fresh
-- Create custom types
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'processing', 'completed', 'cancelled');

-- Create clients table (multi-tenant root)
CREATE TABLE "clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "phone" VARCHAR(50),
    "address" TEXT,
    "branding" JSONB,
    "settings" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- Create photographers table
CREATE TABLE "photographers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "name" VARCHAR(255),
    "client_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branding" JSONB,

    CONSTRAINT "photographers_pkey" PRIMARY KEY ("id")
);

-- Create guests table
CREATE TABLE "guests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "photographer_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- Create photos table
CREATE TABLE "photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "photographer_id" UUID NOT NULL,
    "guest_id" UUID,
    "client_id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" INTEGER,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- Create orders table
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guest_id" UUID NOT NULL,
    "photographer_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "photo_ids" TEXT[] NOT NULL,
    "total_amount" DECIMAL(10,2),
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX "clients_email_idx" ON "clients"("email");
CREATE INDEX "photographers_email_idx" ON "photographers"("email");
CREATE INDEX "photographers_client_id_idx" ON "photographers"("client_id");
CREATE INDEX "guests_photographer_id_idx" ON "guests"("photographer_id");
CREATE INDEX "guests_client_id_idx" ON "guests"("client_id");
CREATE INDEX "photos_photographer_id_idx" ON "photos"("photographer_id");
CREATE INDEX "photos_guest_id_idx" ON "photos"("guest_id");
CREATE INDEX "photos_client_id_idx" ON "photos"("client_id");
CREATE INDEX "orders_guest_id_idx" ON "orders"("guest_id");
CREATE INDEX "orders_photographer_id_idx" ON "orders"("photographer_id");
CREATE INDEX "orders_client_id_idx" ON "orders"("client_id");
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- Add foreign key constraints
ALTER TABLE "photographers" ADD CONSTRAINT "photographers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guests" ADD CONSTRAINT "guests_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "photographers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "guests" ADD CONSTRAINT "guests_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "photographers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "photographers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "photographers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenant data isolation
-- Clients can only see their own data
CREATE POLICY "clients_policy" ON "clients" FOR ALL USING (auth.uid()::text = id::text);

-- Photographers can only see data from their client
CREATE POLICY "photographers_policy" ON "photographers" FOR ALL USING (
    client_id IN (
        SELECT client_id FROM photographers WHERE id::text = auth.uid()::text
    )
);

-- Guests policy - photographers can see guests from their client
CREATE POLICY "guests_policy" ON "guests" FOR ALL USING (
    client_id IN (
        SELECT client_id FROM photographers WHERE id::text = auth.uid()::text
    )
);

-- Photos policy - photographers can see photos from their client
CREATE POLICY "photos_policy" ON "photos" FOR ALL USING (
    client_id IN (
        SELECT client_id FROM photographers WHERE id::text = auth.uid()::text
    )
);

-- Orders policy - photographers can see orders from their client
CREATE POLICY "orders_policy" ON "orders" FOR ALL USING (
    client_id IN (
        SELECT client_id FROM photographers WHERE id::text = auth.uid()::text
    )
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON "clients" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photographers_updated_at BEFORE UPDATE ON "photographers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON "guests" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON "photos" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON "orders" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();