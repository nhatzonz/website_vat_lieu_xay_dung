import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  canonicalYoutubeUrl,
  extractYoutubeId,
} from '../../common/util/youtube';
import { Video } from './video.entity';
import { VideoPosition, DEFAULT_VIDEO_POSITION } from './video-positions';
import { CreateVideoDto } from './dto/create-video.dto';
import { ReorderVideosDto } from './dto/reorder-videos.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private readonly videos: Repository<Video>,
  ) {}

  /** Validate + chuẩn hóa link YouTube về dạng watch. Lỗi → 400. */
  private normalizeUrl(url: string): string {
    const id = extractYoutubeId(url);
    if (!id) {
      throw new BadRequestException('Link YouTube không hợp lệ.');
    }
    return canonicalYoutubeUrl(id);
  }

  /** Danh sách công khai: video active, lọc theo vị trí (SET) nếu có. */
  publicList(position?: VideoPosition): Promise<Video[]> {
    const qb = this.videos
      .createQueryBuilder('v')
      .where('v.isActive = 1')
      .orderBy('v.sortOrder', 'ASC')
      .addOrderBy('v.id', 'ASC');

    if (position) {
      // Cột SET lưu chuỗi "home,sidebar" → dùng FIND_IN_SET để kiểm tra thành viên.
      qb.andWhere('FIND_IN_SET(:pos, v.position)', { pos: position });
    }
    return qb.getMany();
  }

  /** Danh sách quản trị: toàn bộ video. */
  findAll(): Promise<Video[]> {
    return this.videos.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async findById(id: number): Promise<Video> {
    const video = await this.videos.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException('Không tìm thấy video');
    }
    return video;
  }

  create(dto: CreateVideoDto): Promise<Video> {
    const video = this.videos.create({
      ...dto,
      youtubeUrl: this.normalizeUrl(dto.youtubeUrl),
      position: dto.position ?? [DEFAULT_VIDEO_POSITION],
    });
    return this.videos.save(video);
  }

  async update(id: number, dto: UpdateVideoDto): Promise<Video> {
    const video = await this.findById(id);
    Object.assign(video, dto);
    if (dto.youtubeUrl !== undefined) {
      video.youtubeUrl = this.normalizeUrl(dto.youtubeUrl);
    }
    return this.videos.save(video);
  }

  async remove(id: number): Promise<void> {
    const result = await this.videos.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Không tìm thấy video');
    }
  }

  /** Cập nhật hàng loạt thứ tự (kéo–thả). */
  async reorder(dto: ReorderVideosDto): Promise<void> {
    if (dto.items.length === 0) return;

    const ids = dto.items.map((i) => i.id);
    const existing = await this.videos.find({ where: { id: In(ids) } });
    const byId = new Map(existing.map((v) => [v.id, v]));

    for (const item of dto.items) {
      const video = byId.get(item.id);
      if (!video) {
        throw new NotFoundException(`Không tìm thấy video #${item.id}`);
      }
      video.sortOrder = item.sortOrder;
    }

    await this.videos.save([...byId.values()]);
  }
}
