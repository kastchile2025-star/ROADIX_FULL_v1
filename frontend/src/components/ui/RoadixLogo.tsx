export function RoadixLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="2" width="40" height="40" rx="11" fill="rgba(43,190,249,0.08)" stroke="#2bbef9" strokeWidth="1.5" />
      <path d="M11 30 A12 12 0 1 1 31 30" fill="none" stroke="#2bbef9" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="21" y1="27" x2="28" y2="16" stroke="#ffb648" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="21" cy="27" r="2.2" fill="#ffb648" />
      <line x1="11" y1="33" x2="31" y2="33" stroke="#2bbef9" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
