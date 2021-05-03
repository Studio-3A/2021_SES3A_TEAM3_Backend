-- CreateTable
CREATE TABLE `SearchTrip` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
UNIQUE INDEX `SearchTrip_userId_unique`(`userId`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SearchTripDestintation` (
    `searchTripId` INTEGER NOT NULL,
    `googlePlaceID` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `rating` DOUBLE NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `time` BIGINT NOT NULL,
UNIQUE INDEX `SearchTripDestintation.searchTripId_googlePlaceID_unique`(`searchTripId`, `googlePlaceID`),

    PRIMARY KEY (`searchTripId`,`googlePlaceID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SearchTripDestintationTag` (
    `searchTripId` INTEGER NOT NULL,
    `googlePlaceID` VARCHAR(191) NOT NULL,
    `destinationTagId` INTEGER NOT NULL,
UNIQUE INDEX `SearchTripDestintationTag.searchTripId_googlePlaceID_destination`(`searchTripId`, `googlePlaceID`, `destinationTagId`),

    PRIMARY KEY (`searchTripId`,`googlePlaceID`,`destinationTagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DestinationTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `googleTag` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SearchTrip` ADD FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SearchTripDestintation` ADD FOREIGN KEY (`searchTripId`) REFERENCES `SearchTrip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SearchTripDestintationTag` ADD FOREIGN KEY (`searchTripId`, `googlePlaceID`) REFERENCES `SearchTripDestintation`(`searchTripId`, `googlePlaceID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SearchTripDestintationTag` ADD FOREIGN KEY (`destinationTagId`) REFERENCES `DestinationTag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
