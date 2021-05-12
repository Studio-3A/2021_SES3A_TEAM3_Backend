/*
  Warnings:

  - Added the required column `googlePlaceID` to the `Venue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalUserRatings` to the `Venue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Venue` ADD COLUMN     `googlePlaceID` VARCHAR(191) NOT NULL,
    ADD COLUMN     `totalUserRatings` INTEGER NOT NULL;
