import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ---------- Public ----------

  @Public()
  @Get('public/products')
  publicList(@Query() query: QueryProductDto) {
    return this.productsService.publicList(query);
  }

  @Public()
  @Get('public/products/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.productsService.findPublicBySlug(slug);
  }

  /** Tăng lượt xem (gọi khi mở trang chi tiết). */
  @Public()
  @Post('public/products/:slug/view')
  @HttpCode(204)
  view(@Param('slug') slug: string) {
    return this.productsService.incrementView(slug);
  }

  // ---------- Admin ----------

  @ApiBearerAuth()
  @Get('admin/products')
  adminList(@Query() query: QueryProductDto) {
    return this.productsService.adminList(query);
  }

  @ApiBearerAuth()
  @Get('admin/products/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findByIdAdmin(id);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Post('admin/products')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Put('admin/products/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete('admin/products/:id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
