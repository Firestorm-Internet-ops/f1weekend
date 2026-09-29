import Image from 'next/image';

export default function CircuitMap({
  className,
  src = '/tracks/Australia_Circuit.avif',
  alt = 'Albert Park Circuit — Melbourne',
  width = 1920,
  height = 1080,
}: {
  className?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-auto object-contain"
        priority
      />
    </div>
  );
}