// Section 2 diagram: a pH scale showing where typical modern acidic
// wood-pulp paper and traditional washi fall, relative to neutral (7).
// Approximate representative ranges. Palette restricted to background
// #f5f0e8, line/text #2b2b2b, accent #b5533c.
function AcidityScaleDiagram() {
  const scaleX0 = 40
  const scaleX1 = 380
  const scaleY = 90
  const toX = (ph) => scaleX0 + ((ph - 0) / 14) * (scaleX1 - scaleX0)

  return (
    <svg
      viewBox="0 0 420 170"
      role="img"
      aria-labelledby="acidity-diagram-title"
      style={{ width: '100%', height: 'auto' }}
    >
      <title id="acidity-diagram-title">
        pH scale comparing acidic modern wood-pulp paper (roughly pH 4.5–5.5) with neutral to weakly alkaline
        traditional washi (roughly pH 7–8.5)
      </title>
      <rect width="420" height="170" fill="#f5f0e8" />

      <line x1={scaleX0} y1={scaleY} x2={scaleX1} y2={scaleY} stroke="#2b2b2b" strokeWidth="1.5" />
      {[0, 7, 14].map((ph) => (
        <g key={ph}>
          <line x1={toX(ph)} y1={scaleY - 6} x2={toX(ph)} y2={scaleY + 6} stroke="#2b2b2b" strokeWidth="1.5" />
          <text x={toX(ph)} y={scaleY + 24} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="#2b2b2b">
            {ph}
          </text>
        </g>
      ))}
      <text x={toX(7)} y={scaleY - 14} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="10" fill="#2b2b2b">
        neutral
      </text>

      {/* Acidic wood-pulp paper range */}
      <rect x={toX(4.5)} y={scaleY - 34} width={toX(5.5) - toX(4.5)} height="14" fill="none" stroke="#b5533c" strokeWidth="2" />
      <text x={toX(5)} y={scaleY - 42} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="#b5533c">
        modern wood-pulp paper
      </text>

      {/* Washi range */}
      <rect x={toX(7)} y={scaleY + 42} width={toX(8.5) - toX(7)} height="14" fill="none" stroke="#2b2b2b" strokeWidth="1.5" />
      <text x={toX(7.75)} y={scaleY + 70} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="#2b2b2b">
        traditional washi
      </text>
    </svg>
  )
}

export default AcidityScaleDiagram
