export function RoadixLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill="#1e40af" />
      <g transform="translate(32,30)">
        <circle cx="0" cy="0" r="18" fill="#3b82f6" />
        <rect x="-3" y="-22" width="6" height="8" rx="1" fill="#3b82f6" />
        <rect x="-3" y="14" width="6" height="8" rx="1" fill="#3b82f6" />
        <rect x="-22" y="-3" width="8" height="6" rx="1" fill="#3b82f6" />
        <rect x="14" y="-3" width="8" height="6" rx="1" fill="#3b82f6" />
        <rect
          x="10" y="-16" width="6" height="8" rx="1" fill="#3b82f6"
          transform="rotate(45 13 -12)"
        />
        <rect
          x="-16" y="-16" width="6" height="8" rx="1" fill="#3b82f6"
          transform="rotate(-45 -13 -12)"
        />
        <rect
          x="10" y="8" width="6" height="8" rx="1" fill="#3b82f6"
          transform="rotate(-45 13 12)"
        />
        <rect
          x="-16" y="8" width="6" height="8" rx="1" fill="#3b82f6"
          transform="rotate(45 -13 12)"
        />
        <circle cx="0" cy="0" r="10" fill="#1e40af" />
      </g>
      <g transform="translate(32,30)">
        <rect x="-2.5" y="-6" width="5" height="16" rx="2" fill="white" />
        <path d="M-6,-11 Q-6,-17 0,-18 Q6,-17 6,-11 L4,-7 L-4,-7 Z" fill="white" />
        <path
          d="M-3,-11 Q-3,-15 0,-16 Q3,-15 3,-11 L2,-8 L-2,-8 Z"
          fill="#1e40af"
        />
      </g>
      <polygon
        points="38,14 33,23 37,22 32,30 42,20 39,21 43,14"
        fill="#fbbf24"
      />
      <text
        x="32"
        y="54"
        textAnchor="middle"
        fontFamily="Arial,sans-serif"
        fontWeight="900"
        fontSize="11"
        fill="white"
        letterSpacing="1"
      >
        RX
      </text>
    </svg>
  );
}
