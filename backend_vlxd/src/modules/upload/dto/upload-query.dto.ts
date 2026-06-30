import { IsIn, IsOptional } from 'class-validator';
import { IMAGE_KINDS, type ImageKind } from '../image-presets';

/** Query cho POST /admin/upload: chọn preset xử lý ảnh. */
export class UploadQueryDto {
  @IsOptional()
  @IsIn(IMAGE_KINDS, { message: `kind phải là một trong: ${IMAGE_KINDS.join(', ')}` })
  kind?: ImageKind;
}
