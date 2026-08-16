-- Um agendamento passa a ter 1..N servicos.
--
-- Escrita a mao de proposito: a migracao gerada pelo Prisma apagaria a coluna
-- `Appointment.serviceId` sem preservar nada, e havia 14 agendamentos usando
-- ela. A copia para a nova tabela acontece ANTES do DROP.

-- CreateTable
CREATE TABLE `AppointmentService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointmentId` INTEGER NOT NULL,
    `serviceId` INTEGER NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AppointmentService_appointmentId_idx`(`appointmentId`),
    INDEX `AppointmentService_serviceId_idx`(`serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migra o vinculo 1:1 existente. O preco vem do cadastro atual do servico
-- (era o que os relatorios ja usavam) e a duracao do proprio agendamento,
-- que pode ter sido ajustada na marcacao.
INSERT INTO `AppointmentService`
    (`appointmentId`, `serviceId`, `unitPrice`, `durationMinutes`, `position`)
SELECT
    a.`id`,
    a.`serviceId`,
    s.`price`,
    COALESCE(a.`durationMinutes`, s.`durationMinutes`),
    0
FROM `Appointment` a
INNER JOIN `Service` s ON s.`id` = a.`serviceId`;

-- DropForeignKey
ALTER TABLE `Appointment` DROP FOREIGN KEY `Appointment_serviceId_fkey`;

-- AlterTable
ALTER TABLE `Appointment` DROP COLUMN `serviceId`;

-- AddForeignKey
ALTER TABLE `AppointmentService` ADD CONSTRAINT `AppointmentService_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppointmentService` ADD CONSTRAINT `AppointmentService_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
