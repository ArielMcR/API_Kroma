import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new HttpException('Registro duplicado', HttpStatus.CONFLICT);
    }
    if (error.code === 'P2003') {
      throw new HttpException(
        'Referência inválida (FK)',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (error.code === 'P2025') {
      throw new HttpException('Registro não encontrado', HttpStatus.NOT_FOUND);
    }
  }
  throw error;
}
