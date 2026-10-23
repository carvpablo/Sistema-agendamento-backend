/*
  Warnings:

  - You are about to drop the column `price` on the `Appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "price",
ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
