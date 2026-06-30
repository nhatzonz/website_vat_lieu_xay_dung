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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { QueryBannerDto } from './dto/query-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@ApiTags('banners')
@Controller()
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  // ---------- Public ----------

  /** Banner active cho web, lọc theo vị trí: /public/banners?position=home_slider */
  @Public()
  @Get('public/banners')
  publicList(@Query() query: QueryBannerDto) {
    return this.bannersService.publicList(query.position);
  }

  // ---------- Admin ----------

  @ApiBearerAuth()
  @Get('admin/banners')
  findAll(@Query() query: QueryBannerDto) {
    return this.bannersService.findAll(query.position);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Post('admin/banners')
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  /** Sắp xếp lại hàng loạt (kéo–thả). Đặt trước route động `:id`. */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Patch('admin/banners/reorder')
  @HttpCode(204)
  reorder(@Body() dto: ReorderBannersDto) {
    return this.bannersService.reorder(dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Put('admin/banners/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete('admin/banners/:id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannersService.remove(id);
  }
}
