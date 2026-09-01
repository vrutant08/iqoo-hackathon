export function NapkinSketch({ enhanced = false }: { enhanced?: boolean }) {
  return (
    <svg
      viewBox="0 0 240 320"
      className="h-full w-full"
      aria-hidden
      style={{
        filter: enhanced
          ? "contrast(1.35) saturate(0.2)"
          : "contrast(0.92) brightness(1.04)",
      }}
    >
      <defs>
        <filter id="rough" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.05"
            numOctaves="2"
            seed="3"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
        </filter>
        <pattern id="paper" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#f3ead6" />
          <path d="M0 8 L8 0" stroke="#e4d7b8" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="240" height="320" fill="url(#paper)" />
      <g
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1.6"
        strokeLinecap="round"
        filter="url(#rough)"
      >
        <rect x="28" y="22" width="184" height="276" />
        <rect x="44" y="38" width="152" height="92" />
        <path d="M52 54 h40 M52 66 h28" strokeWidth="1.2" />
        <circle cx="168" cy="78" r="16" />
        <path d="M160 78 h16 M168 70 v16" strokeWidth="1.1" />
        <path d="M48 148 h120" strokeWidth="2.2" />
        <path d="M48 162 h86" strokeWidth="1.4" />
        <path d="M48 178 l8 -8 8 4 8 -6 8 8" strokeWidth="1.3" />
        <text
          x="48"
          y="206"
          fontFamily="ui-monospace, monospace"
          fontSize="13"
          fill="#111"
          stroke="none"
          filter="none"
        >
          $48
        </text>
        <rect x="48" y="224" width="128" height="32" />
        <path d="M64 240 h96" strokeWidth="1.3" />
        <path d="M170 268 c18 -6 28 10 12 18" strokeWidth="1.1" />
      </g>
      <text
        x="112"
        y="244"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        letterSpacing="1.4"
        fill="#111"
      >
        ADD TO BAG
      </text>
      <text
        x="48"
        y="144"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="11"
        fontWeight="700"
        fill="#111"
      >
        AURORA TEE
      </text>
    </svg>
  );
}
