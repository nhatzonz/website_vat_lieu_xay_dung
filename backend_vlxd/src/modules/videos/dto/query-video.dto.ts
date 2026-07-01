import { IsIn, IsOptional } from 'class-validator';
import { VIDEO_POSITIONS, VideoPosition } from '../video-positions';

/** Query lọc theo vị trí cho public (GET /public/videos?position=home) & admin. */
export class QueryVideoDto {
  @IsOptional()
  @IsIn(VIDEO_POSITIONS, {
    message: `position phải là một trong: ${VIDEO_POSITIONS.join(', ')}`,
  })
  position?: VideoPosition;
}
