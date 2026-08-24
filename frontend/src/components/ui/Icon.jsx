/** Set de iconos SVG en línea: sin dependencias externas y con `currentColor`. */

const PATHS = {
  pointer: <path d="M4 3l7 17 2-7 7-2z" />,
  arrowRight: (
    <>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </>
  ),
  chevronRight: <polyline points="9 6 15 12 9 18" />,
  chevronUp: <polyline points="6 15 12 9 18 15" />,
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  waves: (
    <>
      <path d="M3 8c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
      <path d="M3 16c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
    </>
  ),
  pen: (
    <>
      <path d="M3 21l4-1 11-11-3-3L4 17z" />
      <path d="M14 6l3 3" />
    </>
  ),
  square: <rect x="4" y="4" width="16" height="16" rx="1" />,
  type: (
    <>
      <polyline points="4 6 4 4 20 4 20 6" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="9" y1="20" x2="15" y2="20" />
    </>
  ),
  triangle: <polygon points="12 3 21 20 3 20" />,
  circle: <circle cx="12" cy="12" r="8" />,
  ball: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5l3.4 2.5-1.3 4h-4.2l-1.3-4z" />
    </>
  ),
  goalSmall: (
    <>
      <path d="M7 17V9h10v8" />
      <line x1="4" y1="17" x2="20" y2="17" />
      <line x1="12" y1="9" x2="12" y2="17" />
    </>
  ),
  goalBig: (
    <>
      <path d="M4 18V7h16v11" />
      <line x1="2" y1="18" x2="22" y2="18" />
      <line x1="9" y1="7" x2="9" y2="18" />
      <line x1="15" y1="7" x2="15" y2="18" />
      <line x1="4" y1="12.5" x2="20" y2="12.5" />
    </>
  ),
  ladder: (
    <>
      <line x1="4" y1="4" x2="4" y2="20" />
      <line x1="20" y1="4" x2="20" y2="20" />
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="16" x2="20" y2="16" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  stop: <rect x="5" y="5" width="14" height="14" rx="1.5" fill="currentColor" stroke="none" />,
  eraser: (
    <>
      <path d="M20 20H8l-5-5a2 2 0 0 1 0-3l9-9a2 2 0 0 1 3 0l7 7a2 2 0 0 1 0 3l-6 6" />
      <line x1="14" y1="20" x2="20" y2="20" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  play: <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />,
  download: (
    <>
      <path d="M12 3v12" />
      <polyline points="6 11 12 17 18 11" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </>
  ),
  save: (
    <>
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8 3v6h8V3" />
      <path d="M7 21v-8h10v8" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c.7-3.6 3.2-5.5 6.5-5.5s5.8 1.9 6.5 5.5" />
      <circle cx="17.2" cy="9" r="2.4" />
      <path d="M15.5 14.6c2.6.2 4.3 1.9 4.9 5" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </>
  ),
  x: (
    <>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <rect x="8" y="2.5" width="8" height="3.5" rx="1" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="16" y2="15" />
    </>
  ),
  rotate: (
    <>
      <path d="M3 9a9 9 0 1 1 1.5 8.5" />
      <polyline points="3 4 3 9 8 9" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <polyline points="12 7 12 12 15.5 14" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </>
  ),
}

export function Icon({ name, size = 16, ...props }) {
  const children = PATHS[name]
  if (!children) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}
