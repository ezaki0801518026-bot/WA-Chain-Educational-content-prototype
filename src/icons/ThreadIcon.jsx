// Wavy fiber strand — used for remaining "Foundations" track placeholder
// sections. Single-color line art (currentColor).
function ThreadIcon({ size = 24, className }) {
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
      <path d="M3 6c3 0 3 3 6 3s3-3 6-3 3 3 6 3" />
      <path d="M3 12c3 0 3 3 6 3s3-3 6-3 3 3 6 3" />
      <path d="M3 18c3 0 3 3 6 3s3-3 6-3 3 3 6 3" />
    </svg>
  )
}

export default ThreadIcon
