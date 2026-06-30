'use client';

import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  composeAddress,
  getDistricts,
  getProvinces,
  getWards,
  type AdminUnit,
} from '@/lib/vn-address';
import { SelectField, TextField } from './ui/Field';
import { SearchableSelect } from './ui/SearchableSelect';
import styles from './AddressFields.module.scss';

/** PC/laptop/iPad (>=768px) → combobox có tìm kiếm; mobile → select gốc. */
function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
}

function Picker({
  id,
  label,
  value,
  units,
  placeholder,
  disabled,
  desktop,
  onChange,
}: {
  id: string;
  label: string;
  value: number | null;
  units: AdminUnit[];
  placeholder: string;
  disabled?: boolean;
  desktop: boolean;
  onChange: (value: number | null) => void;
}) {
  if (desktop) {
    return (
      <SearchableSelect
        id={id}
        label={label}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        options={units.map((u) => ({ value: u.code, label: u.name }))}
        onChange={onChange}
      />
    );
  }
  return (
    <SelectField
      id={id}
      label={label}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">{placeholder}</option>
      {units.map((u) => (
        <option key={u.code} value={u.code}>
          {u.name}
        </option>
      ))}
    </SelectField>
  );
}

interface Selection {
  provinceCode: number | null;
  districtCode: number | null;
  wardCode: number | null;
  detail: string;
}

interface Props {
  /** Map giá trị settings hiện tại (đọc addr_*_code, addr_detail, address). */
  values: Record<string, string>;
  disabled?: boolean;
  /** Cập nhật nhiều key một lần vào state cha. */
  onChange: (patch: Record<string, string>) => void;
}

export function AddressFields({ values, disabled = false, onChange }: Props) {
  const [sel, setSel] = useState<Selection>(() => ({
    provinceCode: values.addr_province_code
      ? Number(values.addr_province_code)
      : null,
    districtCode: values.addr_district_code
      ? Number(values.addr_district_code)
      : null,
    wardCode: values.addr_ward_code ? Number(values.addr_ward_code) : null,
    detail: values.addr_detail ?? '',
  }));

  const [provinces, setProvinces] = useState<AdminUnit[]>([]);
  const [districts, setDistricts] = useState<AdminUnit[]>([]);
  const [wards, setWards] = useState<AdminUnit[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const desktop = useIsDesktop();

  // Tải tỉnh khi mount.
  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch(() => setLoadingError('Không tải được danh sách Tỉnh/Thành phố.'));
  }, []);

  // Tải quận/huyện theo tỉnh đang chọn (kể cả lúc mở lại để sửa).
  useEffect(() => {
    if (sel.provinceCode === null) {
      setDistricts([]);
      return;
    }
    let alive = true;
    getDistricts(sel.provinceCode)
      .then((d) => alive && setDistricts(d))
      .catch(() => alive && setDistricts([]));
    return () => {
      alive = false;
    };
  }, [sel.provinceCode]);

  // Tải phường/xã theo quận/huyện đang chọn.
  useEffect(() => {
    if (sel.districtCode === null) {
      setWards([]);
      return;
    }
    let alive = true;
    getWards(sel.districtCode)
      .then((w) => alive && setWards(w))
      .catch(() => alive && setWards([]));
    return () => {
      alive = false;
    };
  }, [sel.districtCode]);

  /** Cập nhật lựa chọn + đẩy patch (tên + mã + chuỗi đầy đủ) lên cha. */
  function update(next: Selection) {
    setSel(next);
    const provinceName =
      provinces.find((p) => p.code === next.provinceCode)?.name ?? '';
    const districtName =
      districts.find((d) => d.code === next.districtCode)?.name ?? '';
    const wardName = wards.find((w) => w.code === next.wardCode)?.name ?? '';
    onChange({
      addr_detail: next.detail,
      addr_ward: wardName,
      addr_district: districtName,
      addr_province: provinceName,
      address: composeAddress({
        detail: next.detail,
        ward: wardName,
        district: districtName,
        province: provinceName,
      }),
      addr_province_code: next.provinceCode ? String(next.provinceCode) : '',
      addr_district_code: next.districtCode ? String(next.districtCode) : '',
      addr_ward_code: next.wardCode ? String(next.wardCode) : '',
    });
  }

  const fullAddress = values.address ?? '';

  return (
    <div className={styles.wrap}>
      {loadingError && <div className={styles.warn}>{loadingError}</div>}

      <div className={styles.selects}>
        <Picker
          id="addr-province"
          label="Tỉnh / Thành phố"
          value={sel.provinceCode}
          units={provinces}
          placeholder="— Chọn Tỉnh/TP —"
          disabled={disabled}
          desktop={desktop}
          onChange={(code) =>
            update({
              provinceCode: code,
              districtCode: null,
              wardCode: null,
              detail: sel.detail,
            })
          }
        />
        <Picker
          id="addr-district"
          label="Quận / Huyện"
          value={sel.districtCode}
          units={districts}
          placeholder="— Chọn Quận/Huyện —"
          disabled={disabled || sel.provinceCode === null}
          desktop={desktop}
          onChange={(code) =>
            update({ ...sel, districtCode: code, wardCode: null })
          }
        />
        <Picker
          id="addr-ward"
          label="Phường / Xã"
          value={sel.wardCode}
          units={wards}
          placeholder="— Chọn Phường/Xã —"
          disabled={disabled || sel.districtCode === null}
          desktop={desktop}
          onChange={(code) => update({ ...sel, wardCode: code })}
        />
      </div>

      <TextField
        id="addr-detail"
        label="Số nhà, tên đường"
        placeholder="VD: Số 12, đường Lê Lợi"
        value={sel.detail}
        disabled={disabled}
        onChange={(e) => update({ ...sel, detail: e.target.value })}
      />

      <div className={styles.preview}>
        <MapPin size={16} />
        <div>
          <span className={styles.previewLabel}>Địa chỉ đầy đủ</span>
          <p className={styles.previewText}>
            {fullAddress || 'Chọn địa chỉ ở trên để tự gộp...'}
          </p>
        </div>
      </div>
    </div>
  );
}
