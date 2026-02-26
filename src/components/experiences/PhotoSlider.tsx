'use client';
import Image from 'next/image';
import { useRef } from 'react';

interface Props {
  photos: string[] | null;
  imageUrl?: string | null;
  title: string;
  color: string;
  imageEmoji: string;
}

export default function PhotoSlider({ photos, imageUrl, title, color, imageEmoji }: Props) {
  const allPhotos = (photos && photos.length > 0) ? photos : (imageUrl ? [imageUrl] : []);
  const n = allPhotos.length;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const item = el.firstElementChild as HTMLElement | null;
    const width = item?.offsetWidth ?? el.clientWidth;
    el.scrollBy({ left: dir * width, behavior: 'smooth' });
  };

  if (n === 0) {
    return (
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${color}40 0%, #15151E 55%, ${color}18 100%)`,
          }}
        >
          <span className="text-9xl select-none" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}>
            {imageEmoji}
          </span>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #15151E 0%, transparent 100%)' }}
        />
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
      </div>
    );
  }

  return (
    <div className="relative h-56 sm:h-64 overflow-hidden">
      {/* Scrollable photo strip */}
      <div
        ref={scrollRef}
        className="flex h-full overflow-x-auto scrollbar-none"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {allPhotos.map((url, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 h-full"
            style={{ aspectRatio: '1024/500', scrollSnapAlign: 'start' }}
          >
            <Image
              src={url}
              alt={`${title} photo ${i + 1}`}
              fill
              unoptimized
              referrerPolicy="no-referrer"
              sizes="(max-width: 640px) 100vw, 60vw"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* Prev button */}
      {n > 1 && (
        <button
          onClick={() => scroll(-1)}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {n > 1 && (
        <button
          onClick={() => scroll(1)}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #15151E 0%, transparent 100%)' }}
      />

      {/* Top colour strip */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
    </div>
  );
}
