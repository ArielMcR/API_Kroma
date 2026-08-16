-- Remocao do multi-tenancy: Company/Unit deixam de existir, o sistema passa a ser
-- instalacao unica (1 barbearia). Esta migration preserva os dados existentes:
-- apenas as colunas de escopo e as duas tabelas sao removidas.
--
-- ATENCAO A ORDEM: Settings precisa ser criado e populado ANTES de Company/Unit
-- serem dropadas, e o UPDATE de role precisa rodar ANTES do MODIFY do enum.

-- CreateTable
CREATE TABLE `Settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tradeName` VARCHAR(191) NOT NULL,
    `legalName` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migra os dados da primeira company (+ sua primeira unidade) para Settings.
INSERT INTO `Settings` (`tradeName`, `legalName`, `cnpj`, `address`, `phone`, `createdAt`, `updatedAt`)
SELECT c.`tradeName`, c.`legalName`, c.`cnpj`, u.`address`, u.`phone`, NOW(3), NOW(3)
FROM `Company` c
LEFT JOIN `Unit` u ON u.`companyId` = c.`id`
ORDER BY c.`id`, u.`id`
LIMIT 1;

-- Sem multiplas empresas nao existe mais o papel de "dono do sistema".
-- Precisa vir antes do MODIFY do enum abaixo.
UPDATE `User` SET `role` = 'ADMIN' WHERE `role` = 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE `appointment` DROP FOREIGN KEY `Appointment_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `appointment` DROP FOREIGN KEY `Appointment_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `client` DROP FOREIGN KEY `Client_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `client` DROP FOREIGN KEY `Client_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `sale` DROP FOREIGN KEY `Sale_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `service` DROP FOREIGN KEY `Service_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `service` DROP FOREIGN KEY `Service_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `unit` DROP FOREIGN KEY `Unit_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_unitId_fkey`;

-- AlterTable
ALTER TABLE `appointment` DROP COLUMN `companyId`,
    DROP COLUMN `unitId`;

-- AlterTable
ALTER TABLE `client` DROP COLUMN `companyId`,
    DROP COLUMN `unitId`;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `unitId`;

-- AlterTable
ALTER TABLE `sale` DROP COLUMN `unitId`;

-- AlterTable
ALTER TABLE `service` DROP COLUMN `companyId`,
    DROP COLUMN `unitId`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `companyId`,
    DROP COLUMN `unitId`,
    MODIFY `role` ENUM('ADMIN', 'SUPERVISOR', 'BARBER') NOT NULL;

-- DropTable
DROP TABLE `unit`;

-- DropTable
DROP TABLE `company`;
