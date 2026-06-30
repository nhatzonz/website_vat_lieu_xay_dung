import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Bọc mọi response thành công vào envelope { success, data }.
 * Frontend chỉ cần đọc `res.data` đồng nhất ở mọi endpoint.
 *
 * Nếu controller đã trả về object có sẵn `success` (vd dữ liệu phân trang
 * tự định dạng) thì giữ nguyên, không bọc thêm.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data as T;
        }
        return { success: true, data };
      }),
    );
  }
}
