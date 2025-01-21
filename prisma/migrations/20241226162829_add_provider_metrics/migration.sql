-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "current_wrvus" REAL;
ALTER TABLE "Provider" ADD COLUMN "monthly_target" REAL;
ALTER TABLE "Provider" ADD COLUMN "previous_wrvus" REAL;
ALTER TABLE "Provider" ADD COLUMN "tier2_cf" REAL;
ALTER TABLE "Provider" ADD COLUMN "tier2_threshold" REAL;
ALTER TABLE "Provider" ADD COLUMN "ytd_wrvus" REAL;
