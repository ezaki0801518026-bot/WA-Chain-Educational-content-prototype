// Section 2 diagram: a simplified, non-literal schematic of a cellulose
// polymer chain — repeating linked units forming a long, stable backbone.
// Palette restricted to background #f5f0e8, line/text #2b2b2b, accent #b5533c.
const UNIT_X = [50, 120, 190, 260, 330]

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function CelluloseDiagram() {
  const cy = 70
  const r = 26

  return (
    <svg
      viewBox="0 0 420 160"
      role="img"
      aria-labelledby="cellulose-diagram-title"
      style={{ width: '100%', height: 'auto' }}
    >
      <title id="cellulose-diagram-title">
        Simplified schematic of a cellulose polymer chain: repeating linked units forming a long, stable backbone
      </title>
      <rect width="420" height="160" fill="#f5f0e8" />

      {UNIT_X.slice(0, -1).map((x, i) => (
        <line key={`bond-${i}`} x1={x + r} y1={cy} x2={UNIT_X[i + 1] - r} y2={cy} stroke="#2b2b2b" strokeWidth="1.5" />
      ))}
      {UNIT_X.map((x, i) => (
        <polygon
          key={`unit-${i}`}
          points={hexPoints(x, cy, r)}
          fill="none"
          stroke={i === 2 ? '#b5533c' : '#2b2b2b'}
          strokeWidth={i === 2 ? 2 : 1.5}
        />
      ))}
      <text x="30" y="10" fontFamily="system-ui, sans-serif" fontSize="11" fill="#2b2b2b">
        ← long repeating chain →
      </text>
      <text x="210" y="125" textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fill="#2b2b2b">
        cellulose
      </text>
      <text x="210" y="143" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="#2b2b2b">
        crystalline backbone — chemically stable
      </text>
    </svg>
  )
}

export default CelluloseDiagram
