// Section 4 diagram: horizontal bar chart comparing average fiber length
// across the three washi raw materials and wood pulp. Palette restricted
// to background #f5f0e8, line/text #2b2b2b, accent #b5533c.
const FIBERS = [
  { name: 'Kōzo', mm: 10.5, y: 26, accent: true },
  { name: 'Gampi', mm: 4.3, y: 84, accent: false },
  { name: 'Mitsumata', mm: 3.7, y: 142, accent: false },
  { name: 'Wood pulp', mm: 1.3, y: 200, accent: false },
]

const MAX_MM = 10.5
const CHART_X0 = 110
const CHART_WIDTH = 220

function FiberLengthChart() {
  return (
    <svg
      viewBox="0 0 420 240"
      role="img"
      aria-labelledby="fiber-length-title"
      style={{ width: '100%', height: 'auto' }}
    >
      <title id="fiber-length-title">
        Average fiber length comparison: kōzo 10.5mm, gampi 4.3mm, mitsumata 3.7mm, wood pulp 1.3mm
      </title>
      <rect width="420" height="240" fill="#f5f0e8" />

      {FIBERS.map((fiber) => {
        const width = (fiber.mm / MAX_MM) * CHART_WIDTH
        return (
          <g key={fiber.name}>
            <rect
              x={CHART_X0}
              y={fiber.y}
              width={width}
              height="28"
              fill="none"
              stroke={fiber.accent ? '#b5533c' : '#2b2b2b'}
              strokeWidth={fiber.accent ? 2.5 : 1.5}
            />
            <text x={CHART_X0 - 10} y={fiber.y + 19} textAnchor="end" fontFamily="system-ui, sans-serif" fontSize="12" fill="#2b2b2b">
              {fiber.name}
            </text>
            <text
              x={CHART_X0 + width + 10}
              y={fiber.y + 19}
              fontFamily="system-ui, sans-serif"
              fontSize="12"
              fill="#2b2b2b"
            >
              {fiber.mm} mm
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default FiberLengthChart
