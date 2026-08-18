// Water droplet — Section 3 (hydrogen bonding, water re-wetting paper).
// Single-color line art (currentColor).
function DropletIcon({ size = 24, className }) {
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
      <path d="M12 3c3.5 4.5 6 8.1 6 11.2A6 6 0 1 1 6 14.2C6 11.1 8.5 7.5 12 3Z" />
    </svg>
  )
}

export default DropletIcon
