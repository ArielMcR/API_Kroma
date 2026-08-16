-- CreateTable
CREATE TABLE `OperationLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operation` VARCHAR(191) NOT NULL,
    `userId` INTEGER NULL,
    `duration` INTEGER NOT NULL,
    `success` BOOLEAN NOT NULL,
    `errorMessage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OperationLog_operation_createdAt_idx`(`operation`, `createdAt`),
    INDEX `OperationLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
