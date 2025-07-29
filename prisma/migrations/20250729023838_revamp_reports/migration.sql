/*
  Warnings:

  - You are about to drop the `life_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `short_reports` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('SHORT', 'LIFE');

-- DropForeignKey
ALTER TABLE "life_reports" DROP CONSTRAINT "life_reports_user_id_fkey";

-- DropForeignKey
ALTER TABLE "short_reports" DROP CONSTRAINT "short_reports_user_id_fkey";

-- DropTable
DROP TABLE "life_reports";

-- DropTable
DROP TABLE "short_reports";

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "creditAmount" DOUBLE PRECISION NOT NULL,
    "debitAmount" DOUBLE PRECISION NOT NULL,
    "categoryBreakdown" JSONB NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3) NOT NULL,
    "type" "ReportType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
