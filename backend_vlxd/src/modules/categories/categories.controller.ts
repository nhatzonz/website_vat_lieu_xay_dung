import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { BulkCategoriesDto } from './dto/bulk-categories.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
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

  /** Thùng rác: danh mục đã xóa mềm. */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Get('admin/categories/trash')
  trash() {
    return this.categoriesService.findTrashed();
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Post('admin/categories')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  /** Sắp xếp lại hàng loạt (kéo–thả). Đặt trước route động `:id`. */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Patch('admin/categories/reorder')
  @HttpCode(204)
  reorder(@Body() dto: ReorderCategoriesDto) {
    return this.categoriesService.reorder(dto);
  }

  /** Thao tác hàng loạt: activate / deactivate / delete. */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Patch('admin/categories/bulk')
  bulk(@Body() dto: BulkCategoriesDto) {
    return this.categoriesService.bulk(dto);
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

  /** Khôi phục từ thùng rác. */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Patch('admin/categories/:id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.restore(id);
  }

  /** Xóa mềm (đưa vào thùng rác). */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete('admin/categories/:id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }

  /** Xóa vĩnh viễn khỏi thùng rác. */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete('admin/categories/:id/force')
  @HttpCode(204)
  forceRemove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.forceRemove(id);
  }
}
