import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { AppConfig } from '../../config/configuration';

/** Token DI cho Cloudinary SDK đã cấu hình. */
export const CLOUDINARY = 'CLOUDINARY';

export type CloudinaryApi = typeof cloudinary;

/**
 * Cấu hình Cloudinary SDK từ config (CLOUDINARY_* trong env) và cung cấp dưới
 * dạng provider để inject vào UploadService.
 */
export const CloudinaryProvider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (config: ConfigService<AppConfig, true>): CloudinaryApi => {
    const c = config.get('cloudinary', { infer: true });
    cloudinary.config({
      cloud_name: c.cloudName,
      api_key: c.apiKey,
      api_secret: c.apiSecret,
      secure: true,
    });
    return cloudinary;
  },
};
