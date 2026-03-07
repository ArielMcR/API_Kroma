/*
  Warnings:

  - Added the required column `empresaId` to the `Agendamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unidadeId` to the `Servico` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `agendamento` ADD COLUMN `empresaId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `servico` ADD COLUMN `unidadeId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Servico` ADD CONSTRAINT `Servico_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `Unidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
