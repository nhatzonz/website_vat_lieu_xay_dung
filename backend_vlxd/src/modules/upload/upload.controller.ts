import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UploadQueryDto } from './dto/upload-query.dto';
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from './image-presets';
import { UploadService } from './upload.service';

/** Lọc sớm ở tầng multer: chỉ nhận MIME ảnh cho phép. */
function imageFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) {
  if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
  cb(
    new BadRequestException('Định dạng không hỗ trợ (JPEG/PNG/WebP/GIF/AVIF)'),
    false,
  );
}

@ApiTags('upload')
@Controller('admin')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload + tối ưu 1 ảnh. Mọi admin đã đăng nhập đều dùng được (cho cả trình
   * soạn thảo nội dung sau này). Giới hạn dung lượng + tần suất chống lạm dụng.
   */
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
      fileFilter: imageFileFilter,
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query() query: UploadQueryDto,
  ) {
    if (!file) throw new BadRequestException('Thiếu tệp ảnh (field "file")');
    return this.uploadService.uploadImage(file, query.kind ?? 'generic');
  }

  /** Xóa 1 ảnh khỏi Cloudinary (dọn ảnh thừa). Chỉ super_admin. */
  @ApiBearerAuth()
  @Roles('super_admin')
  @Delete('upload')
  @HttpCode(204)
  async remove(@Query('publicId') publicId?: string) {
    if (!publicId) throw new BadRequestException('Thiếu publicId');
    await this.uploadService.destroy(publicId);
  }
}
