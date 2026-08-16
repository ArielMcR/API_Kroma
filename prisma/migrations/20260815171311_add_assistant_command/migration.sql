-- CreateTable
CREATE TABLE `AssistantCommand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `rawText` TEXT NOT NULL,
    `interpretedIntent` VARCHAR(191) NULL,
    `toolExecuted` ENUM('QUERY_SCHEDULE', 'CREATE_APPOINTMENT', 'REGISTER_CLIENT', 'GENERATE_REPORT') NULL,
    `parameters` JSON NULL,
    `result` TEXT NULL,
    `status` ENUM('SUCCESS', 'INTERPRETATION_ERROR', 'EXECUTION_ERROR', 'UNSUPPORTED_INTENT') NOT NULL,
    `errorMessage` TEXT NULL,
    `durationMs` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AssistantCommand_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `AssistantCommand_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AssistantCommand` ADD CONSTRAINT `AssistantCommand_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
