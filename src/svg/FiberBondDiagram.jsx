// Section 3 diagram: schematic comparison of short vs long fibers —
// longer fibers cross and overlap more often, creating more bond points
// and a stronger sheet. Palette restricted to background #f5f0e8,
// line/text #2b2b2b, accent #b5533c.
function FiberBondDiagram() {
  const shortFibers = [
    [40, 60, 120, 90],
    [130, 50, 60, 110],
    [50, 120, 140, 130],
  ]
  const longFibers = [
    [230, 40, 380, 100],
    [380, 40, 230, 100],
    [230, 90, 390, 60],
    [230, 130, 390, 130],
    [250, 40, 260, 140],
  ]

  return (
    <svg
      viewBox="0 0 420 170"
      role="img"
      aria-labelledby="fiber-bond-title"
      style={{ width: '100%', height: 'auto' }}
    >
      <title id="fiber-bond-title">
        Schematic comparison: short fibers create few bond points, long fibers cross often and create many bond
        points, producing a stronger sheet
      </title>
      <rect width="420" height="170" fill="#f5f0e8" />

      <rect x="20" y="20" width="160" height="120" fill="none" stroke="#2b2b2b" strokeWidth="1" />
      {shortFibers.map(([x1, y1, x2, y2], i) => (
        <line key={`s-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2b2b2b" strokeWidth="2" />
      ))}
      <text x="100" y="150" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="#2b2b2b">
        short fibers — few bond points
      </text>

      <rect x="220" y="20" width="180" height="120" fill="none" stroke="#b5533c" strokeWidth="1.5" />
      {longFibers.map(([x1, y1, x2, y2], i) => (
        <line key={`l-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b5533c" strokeWidth="2" />
      ))}
      <text x="310" y="150" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="#2b2b2b">
        long fibers — many bond points
      </text>
    </svg>
  )
}

export default FiberBondDiagram
