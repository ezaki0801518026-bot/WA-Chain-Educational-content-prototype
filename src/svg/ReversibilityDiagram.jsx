// Section 1 diagram: a schematic (not photorealistic) two-panel comparison
// showing wheat starch paste bonding fibers when dry, and releasing them
// when re-wetted. Palette restricted to background #f5f0e8, line/text
// #2b2b2b, accent #b5533c.
function ReversibilityDiagram() {
  const fiberY = [70, 95, 120]

  return (
    <svg
      viewBox="0 0 420 190"
      role="img"
      aria-labelledby="reversibility-diagram-title"
      style={{ width: '100%', height: 'auto' }}
    >
      <title id="reversibility-diagram-title">
        Schematic diagram: paste bonds hold fibers together when dry, and release when re-wetted with water
      </title>
      <rect width="420" height="190" fill="#f5f0e8" />

      {/* Dry panel */}
      <text x="100" y="30" textAnchor="middle" fontFamily="Georgia, serif" fontSize="15" fill="#2b2b2b">
        Dry — bonded
      </text>
      {fiberY.map((y, i) => (
        <line key={`dry-${i}`} x1="40" y1={y} x2="160" y2={y} stroke="#2b2b2b" strokeWidth="2" />
      ))}
      {fiberY.slice(0, -1).map((y, i) => (
        <circle key={`dot-${i}`} cx="100" cy={(y + fiberY[i + 1]) / 2} r="3" fill="#b5533c" />
      ))}
      <rect x="30" y="55" width="140" height="80" fill="none" stroke="#2b2b2b" strokeWidth="1" />

      {/* Arrow + droplet */}
      <line x1="185" y1="95" x2="235" y2="95" stroke="#2b2b2b" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
      <path
        d="M210 60 C216 70 222 78 222 85 C222 91.5 216.6 96 210 96 C203.4 96 198 91.5 198 85 C198 78 204 70 210 60 Z"
        fill="none"
        stroke="#b5533c"
        strokeWidth="1.5"
      />
      <text x="210" y="115" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="#2b2b2b">
        water
      </text>

      {/* Wet panel */}
      <text x="320" y="30" textAnchor="middle" fontFamily="Georgia, serif" fontSize="15" fill="#2b2b2b">
        Wet — released
      </text>
      <line x1="260" y1={70} x2="380" y2={66} stroke="#2b2b2b" strokeWidth="2" />
      <line x1="260" y1={95} x2="380" y2={99} stroke="#2b2b2b" strokeWidth="2" />
      <line x1="260" y1={120} x2="380" y2={114} stroke="#2b2b2b" strokeWidth="2" />
      <rect x="250" y="55" width="140" height="80" fill="none" stroke="#2b2b2b" strokeWidth="1" />

      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#2b2b2b" />
        </marker>
      </defs>
    </svg>
  )
}

export default ReversibilityDiagram
