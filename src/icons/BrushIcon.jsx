// Conservation brush/tool — used for "Practice & Theory" track placeholder
// sections (cleaning, lining, infill technique). Single-color line art
// (currentColor).
function BrushIcon({ size = 24, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 4l5 5-9.5 9.5a3 3 0 0 1-2 1l-3.5.5.5-3.5a3 3 0 0 1 1-2L15 4Z" />
      <path d="M13 6l5 5" />
    </svg>
  )
}

export default BrushIcon
