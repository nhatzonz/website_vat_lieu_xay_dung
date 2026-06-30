'use client';

/**
 * Client gọi danh mục hành chính Việt Nam (provinces.open-api.vn) — chạy phía
 * trình duyệt cho các select đổ tầng Tỉnh → Quận/Huyện → Phường/Xã.
 *
 * - GET /p/                  → danh sách tỉnh
 * - GET /p/{code}?depth=2    → tỉnh kèm mảng districts
 * - GET /d/{code}?depth=2    → quận/huyện kèm mảng wards
 */
const BASE = 'https://provinces.open-api.vn/api';

export interface AdminUnit {
  code: number;
  name: string;
}

interface ProvinceDetail extends AdminUnit {
  districts: AdminUnit[];
}

interface DistrictDetail extends AdminUnit {
  wards: AdminUnit[];
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lỗi tải dữ liệu địa chỉ (${res.status})`);
  return res.json() as Promise<T>;
}

export function getProvinces(): Promise<AdminUnit[]> {
  return getJson<AdminUnit[]>(`${BASE}/p/`);
}

export async function getDistricts(provinceCode: number): Promise<AdminUnit[]> {
  const data = await getJson<ProvinceDetail>(
    `${BASE}/p/${provinceCode}?depth=2`,
  );
  return data.districts ?? [];
}

export async function getWards(districtCode: number): Promise<AdminUnit[]> {
  const data = await getJson<DistrictDetail>(
    `${BASE}/d/${districtCode}?depth=2`,
  );
  return data.wards ?? [];
}

/** Ghép địa chỉ đầy đủ từ các phần (bỏ phần rỗng), ngăn bằng ", ". */
export function composeAddress(parts: {
  detail?: string;
  ward?: string;
  district?: string;
  province?: string;
}): string {
  return [parts.detail, parts.ward, parts.district, parts.province]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(', ');
}
