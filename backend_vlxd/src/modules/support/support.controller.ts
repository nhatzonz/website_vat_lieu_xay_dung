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
import { SupportService } from './support.service';
import { CreateSupportContactDto } from './dto/create-support-contact.dto';
import { ReorderSupportContactsDto } from './dto/reorder-support-contacts.dto';
import { UpdateSupportContactDto } from './dto/update-support-contact.dto';

@ApiTags('support')
@Controller()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ---------- Public ----------

  /** Danh sách hỗ trợ trực tuyến hiển thị trên web (chỉ mục đang bật). */
  @Public()
  @Get('public/support')
  publicList() {
    return this.supportService.publicList();
  }

  // ---------- Admin ----------

  @ApiBearerAuth()
  @Get('admin/support')
  findAll() {
    return this.supportService.findAll();
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Post('admin/support')
  create(@Body() dto: CreateSupportContactDto) {
    return this.supportService.create(dto);
  }

  /** Sắp xếp lại hàng loạt (kéo–thả). Đặt trước route động `:id`. */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Patch('admin/support/reorder')
  @HttpCode(204)
  reorder(@Body() dto: ReorderSupportContactsDto) {
    return this.supportService.reorder(dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Put('admin/support/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupportContactDto,
  ) {
    return this.supportService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete('admin/support/:id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.supportService.remove(id);
  }
}
