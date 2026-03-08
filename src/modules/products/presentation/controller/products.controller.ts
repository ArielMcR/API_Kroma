import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/modules/auth/presentation/decorators/current-user.decorator';
import type { UserAuthDto } from 'src/modules/auth/presentation/dto/user-auth.dto';
import { Roles } from 'src/modules/auth/presentation/decorators/roles-user.decorator';
import { RolesGuard } from 'src/modules/auth/infra/guards/roles.guard';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CreateProductUseCase } from '../../useCases/create-product.usecase';
import { UpdateProductUseCase } from '../../useCases/update-product.usecase';
import { DeleteProductUseCase } from '../../useCases/delete-product.usecase';
import { FindAllProductsUseCase } from '../../useCases/find-all-products.usecase';
import { FindByIdProductUseCase } from '../../useCases/find-by-id-product.usecase';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly create: CreateProductUseCase,
        private readonly update: UpdateProductUseCase,
        private readonly deleteProduct: DeleteProductUseCase,
        private readonly getAll: FindAllProductsUseCase,
        private readonly getById: FindByIdProductUseCase,
    ) { }

    @Get()
    async getAll_(@CurrentUser() user: UserAuthDto) {
        return this.getAll.execute(user.unitId!);
    }

    @Get(':id')
    async getById_(@Param('id', ParseIntPipe) id: number) {
        return this.getById.execute(id);
    }

    @Post()
    @Roles('SUPER_ADMIN', 'ADMIN')
    @UseGuards(RolesGuard)
    async create_(@Body() data: CreateProductDto) {
        return this.create.execute(data as any);
    }

    @Patch(':id')
    @Roles('SUPER_ADMIN', 'ADMIN')
    @UseGuards(RolesGuard)
    async update_(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProductDto) {
        return this.update.execute(id, data as any);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN', 'ADMIN')
    @UseGuards(RolesGuard)
    async delete_(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.deleteProduct.execute(id);
    }
}
