import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ProductAttributeValueDto,
  ProductImageDto,
  ProductTestMediaDto,
} from './product-children.dto';

export class CreateProductDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @IsString()
  @MaxLength(255)
  name: string;

  /** Để trống sẽ tự sinh từ name. */
  @IsOptional()
  @IsString()
  @MaxLength(280)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  priceUnit?: string;

  @IsOptional()
  @IsIn(['fixed', 'contact'])
  priceType?: 'fixed' | 'contact';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  thumbnail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  testResult?: string;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaKeywords?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ogImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  canonicalUrl?: string;

  // ---- Con (ghi lồng nhau) ----

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeValueDto)
  attributeValues?: ProductAttributeValueDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ProductTestMediaDto)
  testMedia?: ProductTestMediaDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @Type(() => Number)
  @IsInt({ each: true })
  tagIds?: number[];
}
