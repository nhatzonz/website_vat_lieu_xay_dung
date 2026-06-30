import { IsIn, IsOptional } from 'class-validator';
import { BANNER_POSITIONS, BannerPosition } from '../banner-positions';

/** Query lọc theo vị trí cho cả public (GET /public/banners) và admin list. */
export class QueryBannerDto {
  @IsOptional()
  @IsIn(BANNER_POSITIONS, {
    message: `position phải là một trong: ${BANNER_POSITIONS.join(', ')}`,
  })
  position?: BannerPosition;
}
