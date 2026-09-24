// Renders its children in place, with no entrance animation.
//
// This used to fade-and-lift every section as it scrolled into view. A
// fade on each section is the generic default of generated pages and, on a
// site people return to daily, it charges an attention cost on every visit
// (WA-Edu 03_設計計画 §4). The component stays so callers keep their
// semantics (`as`, className); `delay` is accepted and ignored.
function Reveal({ children, as: Tag = 'div', className = '' }) {
  return <Tag className={className || undefined}>{children}</Tag>
}

export default Reveal
