// Plant branch with leaves — Section 4 (kōzo, gampi, mitsumata raw fiber
// plants). Single-color line art (currentColor).
function BranchIcon({ size = 24, className }) {
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
      <path d="M3 20c6-1 12-5 18-16" />
      <path d="M9 15c-1-2-1-4 0-6" />
      <path d="M13 10c-1-2-1-4 0-6" />
      <path d="M6 18c-1.5-1-2-2.5-1.5-4" />
    </svg>
  )
}

export default BranchIcon
