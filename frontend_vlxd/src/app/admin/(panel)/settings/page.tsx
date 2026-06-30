'use client';

import {
  Building2,
  Map,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Search,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AddressFields } from '@/components/admin/AddressFields';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { MapField } from '@/components/admin/MapField';
import { Button } from '@/components/admin/ui/Button';
import { TextArea, TextField } from '@/components/admin/ui/Field';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getStoredUser, isSuperAdmin } from '@/lib/auth-store';
import { clearBrandingCache } from '@/lib/branding';
import type { SettingField, SettingGroup, SettingsAdminView } from '@/types/admin';
import styles from './settings.module.scss';

interface GroupDef {
  key: SettingGroup;
  label: string;
  icon: LucideIcon;
  desc: string;
}

/** Các field settings hiển thị dưới dạng ô upload ảnh (Cloudinary). */
const IMAGE_FIELDS: Record<
  string,
  { uploadKind: 'logo' | 'favicon' | 'og'; hint: string }
> = {
  logo: {
    uploadKind: 'logo',
    hint: 'Nên dùng PNG nền trong suốt. Hệ thống tự nén & tối ưu khi tải lên.',
  },
  favicon: {
    uploadKind: 'favicon',
    hint: 'Ảnh vuông (vd 256×256). Tự resize về 64×64 PNG.',
  },
  seo_default_og_image: {
    uploadKind: 'og',
    hint: 'Ảnh ngang ~1200×630, hiện khi chia sẻ link lên Facebook/Zalo. Tự cắt & nén JPEG.',
  },
};

const GROUPS: GroupDef[] = [
  { key: 'company', label: 'Công ty', icon: Building2, desc: 'Tên công ty, mã số thuế, logo, favicon.' },
  { key: 'contact', label: 'Liên hệ', icon: Phone, desc: 'Hotline, email, số Zalo.' },
  { key: 'address', label: 'Địa chỉ', icon: MapPin, desc: 'Chọn Tỉnh/Quận/Phường và nhập chi tiết — hệ thống tự gộp.' },
  { key: 'map', label: 'Bản đồ', icon: Map, desc: 'Dán mã nhúng Google Maps để hiện bản đồ + tên địa điểm.' },
  { key: 'social', label: 'Mạng xã hội', icon: Share2, desc: 'Liên kết Facebook, YouTube, TikTok, Zalo OA.' },
  { key: 'seo', label: 'SEO', icon: Search, desc: 'Tiêu đề, mô tả, từ khóa và ảnh chia sẻ mặc định.' },
];

export default function SettingsPage() {
  const toast = useToast();
  const canEdit = isSuperAdmin(getStoredUser());

  const [view, setView] = useState<SettingsAdminView | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<SettingGroup>('company');

  function hydrate(data: SettingsAdminView) {
    setView(data);
    const next: Record<string, string> = {};
    for (const group of Object.values(data)) {
      for (const f of group) next[f.key] = f.value ?? '';
    }
    setValues(next);
  }

  useEffect(() => {
    adminApi
      .get<SettingsAdminView>('/admin/settings')
      .then(hydrate)
      .catch((err) => {
        setLoadError(
          err instanceof AdminApiError ? err.message : 'Không tải được cấu hình.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  // Map key → giá trị gốc, để tính field nào đã đổi.
  const originalByKey = useMemo(() => {
    const map: Record<string, string> = {};
    if (view) {
      for (const group of Object.values(view)) {
        for (const f of group) map[f.key] = f.value ?? '';
      }
    }
    return map;
  }, [view]);

  const changedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const key of Object.keys(originalByKey)) {
      if ((values[key] ?? '') !== (originalByKey[key] ?? '')) set.add(key);
    }
    return set;
  }, [originalByKey, values]);

  // Đếm số thay đổi theo nhóm (để gắn badge trên tab).
  const changedByGroup = useMemo(() => {
    const counts = {} as Record<SettingGroup, number>;
    if (view) {
      for (const g of GROUPS) {
        counts[g.key] = (view[g.key] ?? []).filter((f) =>
          changedKeys.has(f.key),
        ).length;
      }
    }
    return counts;
  }, [view, changedKeys]);

  const totalChanged = changedKeys.size;

  function resetAll() {
    setValues({ ...originalByKey });
  }

  async function save() {
    if (totalChanged === 0) return;
    setSaving(true);
    try {
      const items = Array.from(changedKeys).map((key) => ({
        key,
        value: values[key] ?? '',
      }));
      const updated = await adminApi.put<SettingsAdminView>('/admin/settings', {
        items,
      });
      hydrate(updated);
      clearBrandingCache(); // logo/tên công ty mới sẽ được lấy lại ở sidebar/login
      toast.success('Đã lưu cấu hình.');
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Lưu cấu hình thất bại.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Đang tải cấu hình..." />;
  if (loadError) return <div className={styles.error}>{loadError}</div>;
  if (!view) return null;

  const activeDef = GROUPS.find((g) => g.key === active)!;

  return (
    <div className={styles.page}>
      {!canEdit && (
        <div className={styles.readonly}>
          Bạn chỉ có quyền xem. Chỉ quản trị viên mới được sửa cấu hình.
        </div>
      )}

      {/* Tabs theo nhóm */}
      <nav className={styles.tabs}>
        {GROUPS.filter((g) => view[g.key]?.length).map((g) => {
          const Icon = g.icon;
          const isActive = g.key === active;
          return (
            <button
              key={g.key}
              type="button"
              className={[styles.tab, isActive && styles.tabActive]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActive(g.key)}
            >
              <Icon size={17} />
              <span>{g.label}</span>
              {changedByGroup[g.key] > 0 && (
                <span className={styles.tabBadge}>{changedByGroup[g.key]}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Nội dung nhóm đang chọn */}
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <activeDef.icon size={20} className={styles.panelIcon} />
          <div>
            <h2 className={styles.panelTitle}>{activeDef.label}</h2>
            <p className={styles.panelDesc}>{activeDef.desc}</p>
          </div>
        </header>

        <div className={styles.panelBody}>
          {active === 'address' ? (
            <AddressFields
              values={values}
              disabled={!canEdit}
              onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
            />
          ) : active === 'map' ? (
            <MapField
              link={values.map_link ?? ''}
              embed={values.map_embed ?? ''}
              disabled={!canEdit}
              onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
            />
          ) : (
            <div className={styles.fields}>
              {view[active].map((field) => {
                // Ẩn các key kỹ thuật (public_id của ảnh) khỏi giao diện.
                if (field.key.endsWith('_public_id')) return null;

                // Các field ảnh: dùng ô upload (Cloudinary), chiếm hết hàng.
                const img = IMAGE_FIELDS[field.key];
                if (img) {
                  return (
                    <div key={field.key} className={styles.full}>
                      <ImageUploadField
                        settingKey={field.key}
                        uploadKind={img.uploadKind}
                        label={field.label}
                        url={values[field.key] ?? ''}
                        disabled={!canEdit}
                        hint={img.hint}
                        onChange={(patch) =>
                          setValues((prev) => ({ ...prev, ...patch }))
                        }
                      />
                    </div>
                  );
                }

                return (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={values[field.key] ?? ''}
                    changed={changedKeys.has(field.key)}
                    disabled={!canEdit}
                    onChange={(v) =>
                      setValues((prev) => ({ ...prev, [field.key]: v }))
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Thanh lưu cố định */}
      {canEdit && (
        <div className={styles.savebar}>
          <span className={styles.savebarInfo}>
            {totalChanged > 0
              ? `Có ${totalChanged} thay đổi chưa lưu`
              : 'Chưa có thay đổi'}
          </span>
          <div className={styles.savebarActions}>
            <Button
              variant="ghost"
              icon={<RotateCcw size={15} />}
              disabled={totalChanged === 0 || saving}
              onClick={resetAll}
            >
              Hoàn tác
            </Button>
            <Button
              icon={<Save size={16} />}
              loading={saving}
              disabled={totalChanged === 0}
              onClick={save}
            >
              Lưu thay đổi{totalChanged > 0 ? ` (${totalChanged})` : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  changed,
  disabled,
  onChange,
}: {
  field: SettingField;
  value: string;
  changed: boolean;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  const label = (
    <>
      {field.label}
      {changed && <span className={styles.dot} title="Đã thay đổi" />}
    </>
  );
  const common = {
    id: `set-${field.key}`,
    label,
    value,
    disabled,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
  };
  return (
    <div className={field.multiline ? styles.full : undefined}>
      {field.multiline ? (
        <TextArea {...common} rows={3} />
      ) : (
        <TextField {...common} />
      )}
    </div>
  );
}
