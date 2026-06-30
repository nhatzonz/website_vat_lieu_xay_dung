import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { UploadApiResponse } from 'cloudinary';
import sharp from 'sharp';
import { CLOUDINARY, type CloudinaryApi } from './cloudinary.provider';
import { publicIdFromUrl } from './cloudinary-url';
import {
  ALLOWED_MIME,
  IMAGE_PRESETS,
  type ImageKind,
  type ImagePreset,
  MAX_INPUT_PIXELS,
  MAX_UPLOAD_BYTES,
} from './image-presets';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

interface IncomingFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(@Inject(CLOUDINARY) private readonly cloudinary: CloudinaryApi) {}

  /** Đã cấu hình Cloudinary chưa (có cloud_name). */
  isConfigured(): boolean {
    return Boolean(this.cloudinary.config().cloud_name);
  }

  /**
   * Validate → nén/tối ưu bằng sharp theo preset → upload Cloudinary.
   * Trả về metadata đầy đủ để FE/DB dùng.
   */
  async uploadImage(file: IncomingFile, kind: ImageKind): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Dịch vụ lưu trữ ảnh chưa được cấu hình',
      );
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        'Định dạng không hỗ trợ. Chấp nhận: JPEG, PNG, WebP, GIF, AVIF',
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(
        `Ảnh vượt quá ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB`,
      );
    }

    const preset = IMAGE_PRESETS[kind];
    const optimized = await this.optimize(file.buffer, preset);
    return this.uploadBuffer(optimized, preset);
  }

  /**
   * Xóa ảnh Cloudinary theo URL (tự bóc public_id). Tiện cho các bảng chỉ lưu
   * URL (banners, categories). Bỏ qua an toàn nếu URL không phải của Cloudinary.
   */
  async destroyByUrl(url: string | null | undefined): Promise<void> {
    await this.destroy(publicIdFromUrl(url));
  }

  /** Xóa ảnh Cloudinary theo public_id (an toàn: bỏ qua nếu trống/lỗi). */
  async destroy(publicId: string | null | undefined): Promise<void> {
    if (!publicId || !this.isConfigured()) return;
    try {
      await this.cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (err) {
      this.logger.warn(`Không xóa được ảnh Cloudinary ${publicId}: ${err}`);
    }
  }

  /** Resize + đổi định dạng + nén; tự xoay theo EXIF; loại metadata thừa. */
  private async optimize(buffer: Buffer, preset: ImagePreset): Promise<Buffer> {
    try {
      const pipeline = sharp(buffer, {
        failOn: 'none',
        limitInputPixels: MAX_INPUT_PIXELS,
      }).rotate(); // baked-in orientation từ EXIF, rồi EXIF bị loại

      const meta = await pipeline.metadata();
      if (!meta.width || !meta.height) {
        throw new BadRequestException('Tệp không phải ảnh hợp lệ');
      }

      const resized = pipeline.resize({
        width: preset.maxWidth,
        height: preset.maxHeight,
        fit: preset.fit,
        withoutEnlargement: true,
      });

      if (preset.format === 'png') {
        return await resized.png({ quality: preset.quality, compressionLevel: 9 }).toBuffer();
      }
      if (preset.format === 'jpeg') {
        return await resized
          .flatten({ background: '#ffffff' }) // nền trắng cho ảnh có alpha
          .jpeg({ quality: preset.quality, mozjpeg: true })
          .toBuffer();
      }
      return await resized.webp({ quality: preset.quality }).toBuffer();
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Không xử lý được ảnh (tệp hỏng?)');
    }
  }

  private uploadBuffer(
    buffer: Buffer,
    preset: ImagePreset,
  ): Promise<UploadResult> {
    // Cloudinary dùng 'jpg' thay cho 'jpeg'.
    const cldFormat = preset.format === 'jpeg' ? 'jpg' : preset.format;
    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        { folder: preset.folder, resource_type: 'image', format: cldFormat },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error(`Upload Cloudinary lỗi: ${error?.message}`);
            return reject(new BadRequestException('Tải ảnh lên thất bại'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );
      stream.end(buffer);
    });
  }
}
