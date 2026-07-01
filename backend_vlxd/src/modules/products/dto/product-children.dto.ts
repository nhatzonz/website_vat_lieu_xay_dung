import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/** 1 ảnh trong thư viện sản phẩm. */
export class ProductImageDto {
  @IsString()
  @MaxLength(255)
  imagePath: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

/** 1 giá trị thuộc tính của sản phẩm. */
export class ProductAttributeValueDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attributeId: number;

  @IsString()
  @MaxLength(500)
  value: string;
}

/** 1 media tab "Kết quả thử nghiệm". */
export class ProductTestMediaDto {
  @IsIn(['youtube', 'image'])
  mediaType: 'youtube' | 'image';

  @IsString()
  @MaxLength(255)
  mediaValue: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
