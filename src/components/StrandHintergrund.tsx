export default function StrandHintergrund() {
  return (
    <svg
      className="fixed inset-0 -z-10 h-full w-full pointer-events-none"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="himmelMeer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe4f2" />
          <stop offset="38%" stopColor="#7fc8d9" />
          <stop offset="62%" stopColor="#2f9c9a" />
          <stop offset="100%" stopColor="#e8d7ad" />
        </linearGradient>
        <radialGradient id="sonne" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="55%" stopColor="#ffcf6b" />
          <stop offset="100%" stopColor="#ffcf6b" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1440" height="900" fill="url(#himmelMeer)" />
      <circle cx="1230" cy="150" r="140" fill="url(#sonne)" />
      <circle cx="1230" cy="150" r="52" fill="#ffd77a" />

      <path
        d="M0,560 Q120,540 240,560 T480,560 T720,560 T960,560 T1200,560 T1440,560 V900 H0 Z"
        fill="#ffffff"
        opacity="0.10"
      />
      <path
        d="M0,610 Q120,590 240,610 T480,610 T720,610 T960,610 T1200,610 T1440,610 V900 H0 Z"
        fill="#ffffff"
        opacity="0.14"
      />
      <path
        d="M0,660 Q120,640 240,660 T480,660 T720,660 T960,660 T1200,660 T1440,660 V900 H0 Z"
        fill="#f4ead0"
        opacity="0.9"
      />

      <g transform="translate(90,470)">
        <path
          d="M0,340 C10,260 -20,180 30,110"
          fill="none"
          stroke="#6b4a35"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <g fill="#1f6f5c">
          <path d="M30,110 C-40,90 -90,40 -130,60 C-80,110 -20,120 30,110 Z" />
          <path d="M30,110 C-30,60 -60,0 -40,-40 C10,10 30,60 30,110 Z" />
          <path d="M30,110 C20,40 40,-20 90,-50 C100,10 70,70 30,110 Z" />
          <path d="M30,110 C90,80 140,90 170,140 C110,150 60,140 30,110 Z" />
          <path d="M30,110 C70,150 80,190 60,230 C20,190 10,150 30,110 Z" />
        </g>
      </g>
    </svg>
  );
}
