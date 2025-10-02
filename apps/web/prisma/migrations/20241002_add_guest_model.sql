-- CreateTable
CREATE TABLE "guests" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "studio_id" UUID NOT NULL,
    "photographer_id" UUID,
    "session_id" UUID,
    "qr_code" TEXT,
    "preferences" JSONB,
    "metadata" JSONB,
    "last_access_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE UNIQUE INDEX "guests_email_key" ON "guests"("email");

-- CreateTable
CREATE UNIQUE INDEX "guests_qr_code_key" ON "guests"("qr_code");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "photographers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "photo_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddColumn to orders table
ALTER TABLE "orders" ADD COLUMN "guest_id" UUID;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rename robokassa columns to tinkoff
ALTER TABLE "orders" RENAME COLUMN "robokassa_invoice_id" TO "tinkoff_payment_id";
ALTER TABLE "orders" RENAME COLUMN "robokassa_payment_link" TO "tinkoff_payment_link";

-- Add new tinkoff receipt column
ALTER TABLE "orders" ADD COLUMN "tinkoff_receipt" TEXT;

-- Update enum values for payment method
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'tinkoff');
ALTER TABLE "orders" ALTER COLUMN "payment_method" TYPE "PaymentMethod" USING 'tinkoff'::"PaymentMethod";
DROP TYPE "PaymentMethod_old";