interface PreproomLogoProps {
  size?: number;
  showWordmark?: boolean;
  wordmarkClass?: string;
}

export function DoorIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="door-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C6FF7" />
          <stop offset="1" stopColor="#5B8AF5" />
        </linearGradient>
      </defs>
      {/* Outer rounded rect with gradient border */}
      <rect x="1" y="1" width="26" height="26" rx="6" stroke="url(#door-grad)" strokeWidth="2" fill="rgba(108,99,246,0.12)" />
      {/* Inner door panel */}
      <rect x="7" y="5" width="14" height="18" rx="2.5" fill="rgba(15,17,32,0.9)" stroke="url(#door-grad)" strokeWidth="1.2" />
      {/* Keyhole circle */}
      <circle cx="17" cy="14" r="2" fill="url(#door-grad)" />
      {/* Door handle line */}
      <line x1="15" y1="14" x2="12" y2="14" stroke="url(#door-grad)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function PreproomLogo({ size = 28, showWordmark = true, wordmarkClass = "text-lg" }: PreproomLogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <DoorIcon size={size} />
      {showWordmark && (
        <span className={`font-extrabold tracking-tight ${wordmarkClass}`}>
          <span style={{ color: "#7C6FF7" }}>prep</span>
          <span style={{ color: "#8891B4", fontWeight: 300 }}>room</span>
        </span>
      )}
    </span>
  );
}
