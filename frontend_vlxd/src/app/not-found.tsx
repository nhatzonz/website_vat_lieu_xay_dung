import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-4 text-gray-600">Không tìm thấy trang bạn yêu cầu.</p>
      <Link href="/" className="mt-6 text-blue-600 underline">
        Về trang chủ
      </Link>
    </div>
  );
}
