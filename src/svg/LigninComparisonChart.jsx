// Section 2 diagram: approximate lignin content comparison between bast
// fiber (kōzo) and wood pulp. Values are widely-cited approximate ranges,
// not precise measurements of any single sample. Bar widths are scaled
// proportionally to the midpoint of each range. Palette restricted to
// background #f5f0e8, line/text #2b2b2b, accent #b5533c.
const BARS = [
  { label: 'Kōzo bast fiber', range: '~5–8% lignin', midpoint: 6.5, y: 40, accent: false },
  { label: 'Wood pulp', range: '~20–30% lignin', midpoint: 25, y: 110, accent: true },
]

const MAX_MIDPOINT = 30
const CHART_X0 = 150
const CHART_WIDTH = 150

function LigninComparisonChart() {
  return (
    <svg
      viewBox="0 0 420 170"
      role="img"
      aria-labelledby="lignin-diagram-title"
      style={{ width: '100%', height: 'auto' }}
    >
      <title id="lignin-diagram-title">
        Approximate lignin content comparison: kōzo bast fiber is far lower in lignin than wood pulp
      </title>
      <rect width="420" height="170" fill="#f5f0e8" />

      {BARS.map((bar) => {
        const width = (bar.midpoint / MAX_MIDPOINT) * CHART_WIDTH
        return (
          <g key={bar.label}>
            <rect
              x={CHART_X0}
              y={bar.y}
              width={width}
              height="30"
              fill="none"
              stroke={bar.accent ? '#b5533c' : '#2b2b2b'}
              strokeWidth={bar.accent ? 2 : 1.5}
            />
            <text
              x={CHART_X0 - 10}
              y={bar.y + 20}
              textAnchor="end"
              fontFamily="system-ui, sans-serif"
              fontSize="12"
              fill="#2b2b2b"
            >
              {bar.label}
            </text>
            <text
              x={CHART_X0 + CHART_WIDTH + 10}
              y={bar.y + 20}
              fontFamily="system-ui, sans-serif"
              fontSize="12"
              fill="#2b2b2b"
            >
              {bar.range}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default LigninComparisonChart
