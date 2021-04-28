/*
  Warnings:

  - The primary key for the `Booking` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bookingId` on the `Booking` table. All the data in the column will be lost.
  - The primary key for the `BookingEntry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `destinationId` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venueId` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bookingEntryId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomCapacity` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `internet` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refrigeration` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `televsision` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Bath` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Spa` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Balcony` to the `HotelRoom` table without a default value. This is not possible if the table is not empty.
  - Added the required column `activityId` to the `Venue` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Event` DROP FOREIGN KEY `Event_ibfk_1`;

-- AlterTable
ALTER TABLE `Activity` ADD COLUMN     `type` VARCHAR(191) NOT NULL,
    ADD COLUMN     `venueId` INTEGER NOT NULL,
    ADD COLUMN     `startTime` DATETIME(3) NOT NULL,
    ADD COLUMN     `endTime` DATETIME(3) NOT NULL,
    ADD COLUMN     `title` VARCHAR(191) NOT NULL,
    ADD COLUMN     `description` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `Booking` DROP PRIMARY KEY,
    DROP COLUMN `bookingId`,
    ADD COLUMN     `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN     `userId` VARCHAR(191) NOT NULL,
    ADD COLUMN     `bookingEntryId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `BookingEntry` DROP PRIMARY KEY,
    ADD COLUMN     `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `bookingId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `HotelRoom` ADD COLUMN     `roomCapacity` INTEGER NOT NULL,
    ADD COLUMN     `internet` BOOLEAN NOT NULL,
    ADD COLUMN     `refrigeration` BOOLEAN NOT NULL,
    ADD COLUMN     `televsision` BOOLEAN NOT NULL,
    ADD COLUMN     `Bath` BOOLEAN NOT NULL,
    ADD COLUMN     `Spa` BOOLEAN NOT NULL,
    ADD COLUMN     `Balcony` BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE `Venue` DROP COLUMN `destinationId`,
    ADD COLUMN     `activityId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `Event`;

-- AddForeignKey
ALTER TABLE `Booking` ADD FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingEntry` ADD FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venue` ADD FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
