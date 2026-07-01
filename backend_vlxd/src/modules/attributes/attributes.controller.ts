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
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { ReorderAttributesDto } from './dto/reorder-attributes.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@ApiTags('attributes')
@Controller()
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  /** Thuộc tính active (dùng khi dựng form/lọc sản phẩm). */
  @Public()
  @Get('public/attributes')
  publicList() {
    return this.attributesService.publicList();
  }

  @ApiBearerAuth()
  @Get('admin/attributes')
  findAll() {
    return this.attributesService.findAll();
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Post('admin/attributes')
  create(@Body() dto: CreateAttributeDto) {
    return this.attributesService.create(dto);
  }

  /** Sắp xếp lại hàng loạt (kéo–thả). Đặt trước route động `:id`. */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Patch('admin/attributes/reorder')
  @HttpCode(204)
  reorder(@Body() dto: ReorderAttributesDto) {
    return this.attributesService.reorder(dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Put('admin/attributes/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAttributeDto) {
    return this.attributesService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete('admin/attributes/:id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attributesService.remove(id);
  }
}
