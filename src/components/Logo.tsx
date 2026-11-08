/** Kuenstlicher Horizont als Logo. roll in Grad, pitch in Pixeln (Horizont nach unten = Nase hoch). */
export function Logo({ size = 28, roll = -12, pitch = 0 }: { size?: number; roll?: number; pitch?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <clipPath id="logo-ai">
          <circle cx="32" cy="32" r="26" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#ffffff" stroke="#ffffff" strokeWidth="2" />
      <g clipPath="url(#logo-ai)">
        <g transform={`rotate(${roll} 32 32) translate(0 ${pitch})`} style={{ transition: "transform 120ms linear" }}>
          <rect x="-40" y="-40" width="144" height="75" fill="#1d7fb3" />
          <rect x="-40" y="35" width="144" height="70" fill="#7a4a24" />
          <line x1="-40" y1="35" x2="104" y2="35" stroke="#e4ebf2" strokeWidth="1.5" />
          <line x1="24" y1="28" x2="40" y2="28" stroke="#e4ebf2" strokeWidth="1" opacity="0.7" />
          <line x1="27" y1="21" x2="37" y2="21" stroke="#e4ebf2" strokeWidth="1" opacity="0.7" />
          <line x1="24" y1="42" x2="40" y2="42" stroke="#e4ebf2" strokeWidth="1" opacity="0.5" />
        </g>
      </g>
      <path d="M14 33h11l3 4M50 33H39l-3 4" fill="none" stroke="#ffb422" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="33" r="2.2" fill="#ffb422" />
    </svg>
  );
}
