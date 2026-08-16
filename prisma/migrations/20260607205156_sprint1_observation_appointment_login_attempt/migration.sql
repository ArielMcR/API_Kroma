-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `cancelledLate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `chargeAmount` DOUBLE NULL,
    ADD COLUMN `chargeRegistered` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `durationMinutes` INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE `Observation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `type` ENUM('CANCELAMENTO', 'PREFERENCIA', 'OUTRO') NOT NULL DEFAULT 'OUTRO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginAttempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `identifier` VARCHAR(191) NOT NULL,
    `success` BOOLEAN NOT NULL,
    `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoginAttempt_identifier_attemptedAt_idx`(`identifier`, `attemptedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Observation` ADD CONSTRAINT `Observation_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
