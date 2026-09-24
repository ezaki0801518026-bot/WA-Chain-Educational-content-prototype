// Section 3 diagram: three static stages showing fibers suspended in
// water, then drying as water departs, then bonded tightly once dry.
// Palette restricted to background var(--color-bg-subtle), line/text var(--color-text), accent var(--color-accent-solid).
const STAGES = [
  { cx: 80, title: 'Wet', caption: 'fibers dispersed', gap: 14 },
  { cx: 210, title: 'Drying', caption: 'water departs', gap: 7 },
  { cx: 340, title: 'Dry', caption: 'hydrogen bonds form', gap: 0 },
]

function fiberPath(cx, cy, gap, seed) {
  const x0 = cx - 30
  const x1 = cx + 30
  const y = cy + seed * gap
  return `M${x0},${y} Q${cx},${y - gap - 4} ${x1},${y}`
}

function HydrogenBondingDiagram() {
  const cy = 90

  return (
    <svg
      viewBox="0 0 420 190"
      role="img"
      aria-labelledby="hydrogen-bonding-title"
      style={{ width: '100%', height: 'auto' }}
    >
      <title id="hydrogen-bonding-title">
        Three stages of paper formation: fibers dispersed in water, drying as water departs, and bonded tightly
        once dry
      </title>
      <rect width="420" height="190" fill="var(--color-bg-subtle)" />

      {STAGES.map((stage, si) => (
        <g key={stage.title}>
          <rect x={stage.cx - 55} y={40} width="110" height="100" fill="none" stroke="var(--color-text)" strokeWidth="1" />
          {[-1, 0, 1].map((seed, i) => (
            <path
              key={i}
              d={fiberPath(stage.cx, cy + seed * 18, stage.gap, seed % 2 === 0 ? 1 : -1)}
              fill="none"
              stroke={si === 2 ? 'var(--color-accent-solid)' : 'var(--color-text)'}
              strokeWidth={si === 2 ? 2 : 1.5}
            />
          ))}
          {si < 2 &&
            [-1, 0, 1].map((seed, i) => (
              <circle key={`w-${i}`} cx={stage.cx + (i - 1) * 14} cy={cy + seed * 6} r={si === 0 ? 2.4 : 1.6} fill="var(--color-text)" opacity={si === 0 ? 0.6 : 0.3} />
            ))}
          <text x={stage.cx} y="28" textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fill="var(--color-text)">
            {stage.title}
          </text>
          <text x={stage.cx} y="158" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="var(--color-text)">
            {stage.caption}
          </text>
        </g>
      ))}

      <line x1="140" y1="90" x2="150" y2="90" stroke="var(--color-text)" strokeWidth="1.5" markerEnd="url(#hb-arrow)" />
      <line x1="270" y1="90" x2="280" y2="90" stroke="var(--color-text)" strokeWidth="1.5" markerEnd="url(#hb-arrow)" />
      <defs>
        <marker id="hb-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-text)" />
        </marker>
      </defs>
    </svg>
  )
}

export default HydrogenBondingDiagram
