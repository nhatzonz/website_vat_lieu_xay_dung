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
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { QueryVideoDto } from './dto/query-video.dto';
import { ReorderVideosDto } from './dto/reorder-videos.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@ApiTags('videos')
@Controller()
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // ---------- Public ----------

  /** Video active cho web, lọc theo vị trí: /public/videos?position=sidebar */
  @Public()
  @Get('public/videos')
  publicList(@Query() query: QueryVideoDto) {
    return this.videosService.publicList(query.position);
  }

  // ---------- Admin ----------

  @ApiBearerAuth()
  @Get('admin/videos')
  findAll() {
    return this.videosService.findAll();
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Post('admin/videos')
  create(@Body() dto: CreateVideoDto) {
    return this.videosService.create(dto);
  }

  /** Sắp xếp lại hàng loạt (kéo–thả). Đặt trước route động `:id`. */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Patch('admin/videos/reorder')
  @HttpCode(204)
  reorder(@Body() dto: ReorderVideosDto) {
    return this.videosService.reorder(dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Put('admin/videos/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVideoDto) {
    return this.videosService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete('admin/videos/:id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.videosService.remove(id);
  }
}
