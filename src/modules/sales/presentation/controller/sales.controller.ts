import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateSaleDto } from '../dto/create-sale.dto';
import { CreateSaleUseCase } from '../../useCases/create-sale.usecase';
import { DeleteSaleUseCase } from '../../useCases/delete-sale.usecase';
import { FindAllSalesUseCase } from '../../useCases/find-all-sales.usecase';
import { FindByIdSaleUseCase } from '../../useCases/find-by-id-sale.usecase';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly create: CreateSaleUseCase,
    private readonly deleteSale: DeleteSaleUseCase,
    private readonly getAll: FindAllSalesUseCase,
    private readonly getById: FindByIdSaleUseCase,
  ) {}

  @Get()
  async getAll_() {
    return this.getAll.execute();
  }

  @Get(':id')
  async getById_(@Param('id', ParseIntPipe) id: number) {
    return this.getById.execute(id);
  }

  @Post()
  async create_(@Body() data: CreateSaleDto) {
    return this.create.execute(data as any);
  }

  @Delete(':id')
  async delete_(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.deleteSale.execute(id);
  }
}
