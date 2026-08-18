// Section 1 diagram: the three-tier conservation priority hierarchy.
// Bar length signals precedence, not magnitude. Palette restricted to
// background #f5f0e8, line/text #2b2b2b, accent #b5533c.
const TIERS = [
  { rank: '1', label: 'Honshi preservation', width: 320, y: 30 },
  { rank: '2', label: 'Structural stability', width: 230, y: 110 },
  { rank: '3', label: 'Visual harmony', width: 140, y: 190 },
]

function PriorityDiagram() {
  return (
    <svg
      viewBox="0 0 420 250"
      role="img"
      aria-labelledby="priority-diagram-title"
      style={{ width: '100%', height: 'auto' }}
    >
      <title id="priority-diagram-title">
        Conservation priority hierarchy: honshi preservation ranks above structural stability, which ranks above
        visual harmony
      </title>
      <rect width="420" height="250" fill="#f5f0e8" />

      {TIERS.map((tier) => (
        <g key={tier.rank}>
          <rect
            x="60"
            y={tier.y}
            width={tier.width}
            height="36"
            fill="none"
            stroke={tier.rank === '1' ? '#b5533c' : '#2b2b2b'}
            strokeWidth={tier.rank === '1' ? 2.5 : 1.5}
          />
          <text x="34" y={tier.y + 24} textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fill="#2b2b2b">
            {tier.rank}
          </text>
          <text
            x="76"
            y={tier.y + 23}
            fontFamily="system-ui, sans-serif"
            fontSize="13"
            fill="#2b2b2b"
          >
            {tier.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default PriorityDiagram
