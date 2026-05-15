-- AlterTable
ALTER TABLE "users" ADD COLUMN     "subscriptionCancelAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "subscriptionPriceId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;
