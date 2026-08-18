// Simple leaf outline — Section 2 (plant-fiber composition: cellulose,
// hemicellulose, lignin). Single-color line art (currentColor).
function LeafIcon({ size = 24, className }) {
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
      <path d="M12 21c-5-1.5-8-6-7.5-12.5C9 7 15 6.5 19.5 3c1 7-1.5 15-7.5 18Z" />
      <path d="M12 21c0-6 2-11 7-15" />
    </svg>
  )
}

export default LeafIcon
