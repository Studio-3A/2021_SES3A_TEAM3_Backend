/*
  Warnings:

  - Added the required column `bookingTypeId` to the `BookingEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `BookingEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationId` to the `Hotel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `BookingEntry` ADD COLUMN     `bookingTypeId` INTEGER NOT NULL,
    ADD COLUMN     `description` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `Hotel` ADD COLUMN     `destinationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN     `firstName` VARCHAR(191) NOT NULL,
    ADD COLUMN     `lastName` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `BookingType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingEntryId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
UNIQUE INDEX `BookingType_bookingEntryId_unique`(`bookingEntryId`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BookingType` ADD FOREIGN KEY (`bookingEntryId`) REFERENCES `BookingEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hotel` ADD FOREIGN KEY (`destinationId`) REFERENCES `Destination`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
