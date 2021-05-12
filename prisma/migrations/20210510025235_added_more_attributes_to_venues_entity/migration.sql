/*
  Warnings:

  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `Venue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Venue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `formattedAddress` to the `Venue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `Venue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceLevel` to the `Venue` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE `User` ADD COLUMN     `firstName` VARCHAR(191) NOT NULL,
    ADD COLUMN     `lastName` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Venue` ADD COLUMN     `latitude` DOUBLE NOT NULL,
    ADD COLUMN     `longitude` DOUBLE NOT NULL,
    ADD COLUMN     `formattedAddress` VARCHAR(191) NOT NULL,
    ADD COLUMN     `rating` DOUBLE NOT NULL,
    ADD COLUMN     `priceLevel` INTEGER NOT NULL;
