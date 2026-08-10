/** Líneas del campo reglamentario (o de la retícula del espacio reducido). */

const CHALK = 'rgba(234,242,236,.5)'
const GOAL_CHALK = 'rgba(234,242,236,.75)'
const GRID_LINE = 'rgba(234,242,236,.14)'

function GridMarkings() {
  const vertical = Array.from({ length: 9 }, (_, i) => (
    <line key={`v${i}`} x1={(i + 1) * 105} y1="0" x2={(i + 1) * 105} y2="680" stroke={GRID_LINE} strokeWidth="2" />
  ))
  const horizontal = Array.from({ length: 7 }, (_, i) => (
    <line key={`h${i}`} x1="0" y1={(i + 1) * 85} x2="1050" y2={(i + 1) * 85} stroke={GRID_LINE} strokeWidth="2" />
  ))
  return (
    <g>
      {vertical}
      {horizontal}
      <rect x="4" y="4" width="1042" height="672" fill="none" stroke={CHALK} strokeWidth="4" />
    </g>
  )
}

export function PitchMarkings({ surface }) {
  if (surface === 'grid') return <GridMarkings />

  return (
    <g fill="none" stroke={CHALK} strokeWidth="3.5" strokeLinecap="round">
      <rect x="4" y="4" width="1042" height="672" />
      <line x1="525" y1="4" x2="525" y2="676" />
      <circle cx="525" cy="340" r="91.5" />
      <circle cx="525" cy="340" r="6" fill={CHALK} stroke="none" />

      {/* Portería izquierda */}
      <rect x="4" y="138.5" width="161" height="403" />
      <rect x="4" y="248.5" width="51" height="183" />
      <circle cx="110" cy="340" r="6" fill={CHALK} stroke="none" />
      <path d="M165,266.9 A91.5,91.5 0 0 1 165,413.1" />
      <rect x="-18" y="303.4" width="22" height="73.2" stroke={GOAL_CHALK} />

      {/* Portería derecha */}
      <rect x="885" y="138.5" width="161" height="403" />
      <rect x="995" y="248.5" width="51" height="183" />
      <circle cx="940" cy="340" r="6" fill={CHALK} stroke="none" />
      <path d="M885,266.9 A91.5,91.5 0 0 0 885,413.1" />
      <rect x="1046" y="303.4" width="22" height="73.2" stroke={GOAL_CHALK} />

      {/* Córners */}
      <path d="M4,24 A20,20 0 0 0 24,4" />
      <path d="M1026,4 A20,20 0 0 0 1046,24" />
      <path d="M4,656 A20,20 0 0 1 24,676" />
      <path d="M1046,656 A20,20 0 0 0 1026,676" />
    </g>
  )
}
