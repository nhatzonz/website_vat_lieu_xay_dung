import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MaxLength(100)
  name: string;

  /** Để trống sẽ tự sinh từ name. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;
}
