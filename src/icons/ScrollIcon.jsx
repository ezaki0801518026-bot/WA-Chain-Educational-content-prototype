// Hanging scroll silhouette — Section 1 (philosophy of mounting / reversibility).
// Single-color line art (currentColor), no fill, matching the muted washi
// palette used throughout the app.
function ScrollIcon({ size = 24, className }) {
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
      <rect x="7" y="2" width="10" height="2.4" rx="1.2" />
      <rect x="7" y="19.6" width="10" height="2.4" rx="1.2" />
      <path d="M8.5 4.4v15.2" />
      <path d="M15.5 4.4v15.2" />
      <path d="M10 8.5h4" />
      <path d="M10 12h4" />
      <path d="M10 15.5h4" />
    </svg>
  )
}

export default ScrollIcon
