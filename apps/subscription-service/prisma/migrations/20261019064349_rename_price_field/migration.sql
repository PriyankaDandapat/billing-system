/*
  Warnings:

  - You are about to drop the column `priceMinor` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `priceMinor` on the `Subscription` table. All the data in the column will be lost.
  - Added the required column `price` to the `Plan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "priceMinor",
ADD COLUMN     "price" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "priceMinor",
ADD COLUMN     "price" INTEGER NOT NULL;
