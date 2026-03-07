/*
  Warnings:

  - You are about to drop the `workschedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `workschedule` DROP FOREIGN KEY `WorkSchedule_unidadeId_fkey`;

-- DropForeignKey
ALTER TABLE `workschedule` DROP FOREIGN KEY `WorkSchedule_usuarioId_fkey`;

-- AlterTable
ALTER TABLE `agendamento` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `cliente` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `servico` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `unidade` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `usuarioCriadorId` INTEGER NULL;

-- DropTable
DROP TABLE `workschedule`;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_usuarioCriadorId_fkey` FOREIGN KEY (`usuarioCriadorId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
