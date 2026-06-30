import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadService } from '../upload/upload.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  PUBLIC_SETTING_KEYS,
  SETTINGS_BY_KEY,
  SETTINGS_CATALOG,
  SettingGroup,
} from './settings.catalog';
import { Setting } from './setting.entity';

export type SettingsMap = Record<string, string>;

export interface AdminSettingField {
  key: string;
  label: string;
  value: string;
  group: SettingGroup;
  public: boolean;
  multiline: boolean;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settings: Repository<Setting>,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Cấu hình CÔNG KHAI cho frontend (Header/Footer/Liên hệ/SEO).
   * Chỉ trả key `public: true` trong catalog; thiếu trong DB thì lấy `default`
   * nên frontend luôn nhận đủ key, không bao giờ undefined.
   */
  async getPublicMap(): Promise<SettingsMap> {
    const stored = await this.loadStoredMap();
    const out: SettingsMap = {};
    for (const key of PUBLIC_SETTING_KEYS) {
      out[key] = stored[key] ?? SETTINGS_BY_KEY.get(key)!.default;
    }
    return out;
  }

  /**
   * View cho màn hình quản trị: toàn bộ field theo catalog, gom theo nhóm,
   * kèm nhãn + giá trị hiện tại (kể cả key non-public).
   */
  async getAdminView(): Promise<Record<SettingGroup, AdminSettingField[]>> {
    const stored = await this.loadStoredMap();
    const grouped = {} as Record<SettingGroup, AdminSettingField[]>;
    for (const def of SETTINGS_CATALOG) {
      const field: AdminSettingField = {
        key: def.key,
        label: def.label,
        value: stored[def.key] ?? def.default,
        group: def.group,
        public: def.public,
        multiline: def.multiline ?? false,
      };
      (grouped[def.group] ??= []).push(field);
    }
    return grouped;
  }

  /**
   * Upsert nhiều cấu hình. Chỉ chấp nhận key có trong catalog (chống rác);
   * group lấy từ catalog, không cho client tự đặt. Trả lại view admin sau khi lưu.
   */
  async updateMany(
    dto: UpdateSettingsDto,
  ): Promise<Record<SettingGroup, AdminSettingField[]>> {
    const unknown = dto.items
      .map((i) => i.key)
      .filter((key) => !SETTINGS_BY_KEY.has(key));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Cấu hình không hợp lệ: ${unknown.join(', ')}`,
      );
    }

    // Xóa ảnh Cloudinary cũ khi public_id của logo/favicon đổi sang ảnh khác.
    await this.cleanupReplacedImages(dto);

    const entities = dto.items.map((item) => {
      const def = SETTINGS_BY_KEY.get(item.key)!;
      return this.settings.create({
        key: item.key,
        value: item.value ?? null,
        group: def.group, // group là của catalog, không tin client
      });
    });
    // save() với khóa chính có sẵn => upsert theo setting_key.
    await this.settings.save(entities);
    return this.getAdminView();
  }

  /**
   * Nếu logo_public_id / favicon_public_id thay đổi (đổi sang ảnh mới hoặc xóa),
   * gọi Cloudinary xóa ảnh cũ để không để rác.
   */
  private async cleanupReplacedImages(dto: UpdateSettingsDto): Promise<void> {
    const idKeys = [
      'logo_public_id',
      'favicon_public_id',
      'seo_default_og_image_public_id',
    ];
    const incoming = dto.items.filter((i) => idKeys.includes(i.key));
    if (incoming.length === 0) return;

    const stored = await this.loadStoredMap();
    for (const item of incoming) {
      const oldPid = stored[item.key];
      const newPid = item.value ?? '';
      if (oldPid && oldPid !== newPid) {
        await this.uploadService.destroy(oldPid);
      }
    }
  }

  /**
   * Giải link Google Maps (kể cả link rút gọn maps.app.goo.gl) thành link nhúng
   * dùng được cho <iframe>. Chạy phía server để theo redirect (client bị CORS).
   * Chỉ chấp nhận domain Google (chống SSRF). Lấy tọa độ @lat,lng từ URL cuối.
   */
  async resolveMapEmbed(rawUrl: string): Promise<{
    embedUrl: string;
    resolvedUrl: string;
    lat: number;
    lng: number;
  }> {
    let url: URL;
    try {
      url = new URL(rawUrl.trim());
    } catch {
      throw new BadRequestException('Link không hợp lệ');
    }

    const ALLOWED_HOSTS = [
      'maps.app.goo.gl',
      'goo.gl',
      'g.co',
      'maps.google.com',
      'www.google.com',
      'google.com',
    ];
    const host = url.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      throw new BadRequestException('Chỉ chấp nhận link Google Maps');
    }

    let resolvedUrl: string;
    try {
      const res = await fetch(url.toString(), {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10_000),
      });
      resolvedUrl = res.url || url.toString();
    } catch {
      throw new BadRequestException('Không truy cập được link Google Maps');
    }

    const coords = this.extractLatLng(resolvedUrl);
    if (!coords) {
      throw new BadRequestException(
        'Không lấy được tọa độ từ link. Hãy dùng link địa điểm có vị trí cụ thể.',
      );
    }

    const { lat, lng } = coords;
    const embedUrl = `https://www.google.com/maps?q=${lat},${lng}&z=17&hl=vi&output=embed`;
    return { embedUrl, resolvedUrl, lat, lng };
  }

  /**
   * Trích tọa độ từ URL Google Maps. Ưu tiên !3d..!4d.. (vị trí ghim thật của
   * địa điểm) vì @lat,lng chỉ là tâm khung nhìn (có thể lệch).
   */
  private extractLatLng(u: string): { lat: number; lng: number } | null {
    const pin = u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pin) return { lat: Number(pin[1]), lng: Number(pin[2]) };
    const at = u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
    return null;
  }

  private async loadStoredMap(): Promise<SettingsMap> {
    const rows = await this.settings.find();
    return rows.reduce<SettingsMap>((acc, row) => {
      acc[row.key] = row.value ?? '';
      return acc;
    }, {});
  }
}
