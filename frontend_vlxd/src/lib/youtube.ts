/** Tiện ích YouTube phía FE: rút videoId, dựng URL thumbnail & embed. */

const YOUTUBE_ID = /^[\w-]{11}$/;

/** Rút videoId (11 ký tự) từ mọi dạng link phổ biến; null nếu không nhận ra. */
export function getYoutubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (YOUTUBE_ID.test(value)) return value;

  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /\/embed\/([\w-]{11})/,
    /\/shorts\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = value.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Ảnh thumbnail chất lượng cao của video. */
export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/** URL nhúng iframe; autoplay khi người dùng bấm play (facade). */
export function youtubeEmbed(id: string, autoplay = false): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    ...(autoplay ? { autoplay: '1' } : {}),
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
