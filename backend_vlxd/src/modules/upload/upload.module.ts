import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

/**
 * Upload ảnh lên Cloudinary (nén bằng sharp). Export UploadService để
 * module khác (Settings) dùng xóa ảnh cũ khi đổi logo/favicon.
 */
@Module({
  providers: [CloudinaryProvider, UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
