// Albert Park circuit — simplified layout, animated car
export default function CircuitMap({ className }: { className?: string }) {
  // Approximation of the Albert Park street circuit:
  // Clockwise: pit straight (bottom) → left sweep → back straight (top) → chicane → hairpin
  const d =
    'M 60,210 C 15,210 10,180 10,150 L 10,75 C 10,35 48,12 88,12 L 228,12 ' +
    'C 268,12 308,35 308,75 L 308,100 C 308,118 294,126 280,126 ' +
    'L 252,126 C 238,126 232,140 232,155 L 232,176 ' +
    'C 232,200 250,210 270,210 Z';

  return (
    <svg
      viewBox="0 0 320 228"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Albert Park Circuit layout"
    >
      <defs>
        {/* Hidden path used only for animateMotion reference */}
        <path id="ap-track" d={d} />

        <filter id="car-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Track layers ── */}
      {/* Outer kerb / run-off */}
      <path
        d={d}
        stroke="#1E1E2D"
        strokeWidth={24}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Kerb stripe */}
      <path
        d={d}
        stroke="#2A2A3C"
        strokeWidth={20}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Tarmac surface */}
      <path
        d={d}
        stroke="#272738"
        strokeWidth={14}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Centre line dashes */}
      <path
        d={d}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={1}
        strokeDasharray="8 16"
        strokeLinejoin="round"
      />
      {/* Teal highlight on one edge (gives depth) */}
      <path
        d={d}
        stroke="rgba(0,210,190,0.08)"
        strokeWidth={7}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* ── Start / finish line ── */}
      <line
        x1="60"
        y1="202"
        x2="60"
        y2="218"
        stroke="white"
        strokeWidth={2.5}
        strokeOpacity={0.7}
      />

      {/* ── Labels ── */}
      <text
        x="165"
        y="225"
        textAnchor="middle"
        fill="#3A3A5C"
        fontSize={7}
        fontFamily="monospace"
        letterSpacing={2}
      >
        PIT STRAIGHT
      </text>
      <text
        x="160"
        y="115"
        textAnchor="middle"
        fill="#2A2A4C"
        fontSize={9}
        fontFamily="sans-serif"
        fontWeight="bold"
        letterSpacing={1}
      >
        ALBERT PARK
      </text>

      {/* ── Animated car (red dot + trail) ── */}
      {/* Trail dot */}
      <circle r="3.5" fill="#FF4444" opacity="0.45">
        <animateMotion dur="8s" repeatCount="indefinite" begin="-0.18s" rotate="auto">
          <mpath href="#ap-track" />
        </animateMotion>
      </circle>

      {/* Main car */}
      <circle r="6" fill="#E10600" filter="url(#car-glow)">
        <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
          <mpath href="#ap-track" />
        </animateMotion>
      </circle>
    </svg>
  );
}
