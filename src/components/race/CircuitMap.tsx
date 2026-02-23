import Image from 'next/image';

export default function CircuitMap({ className }: { className?: string }) {
  return (
    <div className={`relative ${className ?? ''}`}>
      {/* Subtle red glow behind the image */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(225,6,0,0.08) 0%, transparent 70%)',
        }}
      />
      <Image
        src="/Australia_Circuit.avif"
        alt="Albert Park Circuit — Melbourne"
        width={1920}
        height={1080}
        className="w-full h-auto object-contain opacity-85 drop-shadow-[0_0_24px_rgba(0,210,190,0.1)]"
        priority
      />
    </div>
  );
}