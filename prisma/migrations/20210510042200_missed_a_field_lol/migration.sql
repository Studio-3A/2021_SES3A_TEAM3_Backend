/*
  Warnings:

  - Added the required column `photos` to the `Venue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Venue` ADD COLUMN     `photos` TEXT NOT NULL;
