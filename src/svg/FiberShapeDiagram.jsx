// Section 4 diagram: simplified schematic of the two fiber silhouettes
// used for microscope identification — kōzo's near-cylindrical fiber with
// a rounded tip vs mitsumata's spindle shape, swollen at mid-fiber and
// tapering to fine points (per 『装潢文化財の保存修理』 reference data).
// Palette restricted to background #f5f0e8, line/text #2b2b2b, accent #b5533c.
function FiberShapeDiagram() {
  return (
    <svg
      viewBox="0 0 420 170"
      role="img"
      aria-labelledby="fiber-shape-title"
      style={{ width: '100%', height: 'auto' }}
    >
      <title id="fiber-shape-title">
        Fiber identification schematic: kōzo fibers are long and near-cylindrical with a rounded tip; mitsumata
        fibers are spindle-shaped, swollen at the middle and tapering to fine points
      </title>
      <rect width="420" height="170" fill="#f5f0e8" />

      <rect x="20" y="20" width="170" height="120" fill="none" stroke="#2b2b2b" strokeWidth="1" />
      <path d="M50,80 Q120,70 155,80 Q165,82 165,80 Q165,78 155,80" fill="none" stroke="#b5533c" strokeWidth="2.5" />
      <circle cx="164" cy="80" r="4" fill="none" stroke="#b5533c" strokeWidth="2" />
      <text x="105" y="155" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="#2b2b2b">
        kōzo — rounded tip
      </text>

      <rect x="230" y="20" width="170" height="120" fill="none" stroke="#2b2b2b" strokeWidth="1" />
      <path
        d="M255,80 Q285,80 305,73 Q315,70 325,73 Q345,80 375,80 Q345,84 325,87 Q315,90 305,87 Q285,80 255,80 Z"
        fill="none"
        stroke="#2b2b2b"
        strokeWidth="2"
      />
      <text x="315" y="155" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="#2b2b2b">
        mitsumata — spindle, tapering ends
      </text>
    </svg>
  )
}

export default FiberShapeDiagram
