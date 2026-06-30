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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ---------- Public ----------

  /** Cây danh mục cho menu/sidebar. */
  @Public()
  @Get('public/categories')
  tree() {
    return this.categoriesService.tree();
  }

  @Public()
  @Get('public/categories/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.categoriesService.findPublicBySlug(slug);
  }

  // ---------- Admin ----------

  @ApiBearerAuth()
  @Get('admin/categories')
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Post('admin/categories')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Put('admin/categories/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete('admin/categories/:id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
