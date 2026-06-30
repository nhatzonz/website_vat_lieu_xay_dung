import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** Công khai: cấu hình site dạng { key: value } cho frontend. */
  @Public()
  @Get('public/settings')
  getPublic() {
    return this.settingsService.getPublicMap();
  }

  /** Admin: toàn bộ field theo catalog, gom nhóm + nhãn + giá trị hiện tại. */
  @ApiBearerAuth()
  @Get('admin/settings')
  getAdminView() {
    return this.settingsService.getAdminView();
  }

  /** Admin: cập nhật nhiều cấu hình một lần (chỉ super_admin). */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Put('admin/settings')
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateMany(dto);
  }

  /** Admin: giải link Google Maps → link nhúng + tọa độ (cho preview & lưu). */
  @ApiBearerAuth()
  @Get('admin/settings/resolve-map')
  resolveMap(@Query('url') url?: string) {
    if (!url) throw new BadRequestException('Thiếu tham số url');
    return this.settingsService.resolveMapEmbed(url);
  }
}
