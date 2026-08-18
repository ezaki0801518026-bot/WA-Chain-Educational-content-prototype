import ScrollIcon from './ScrollIcon.jsx'
import LeafIcon from './LeafIcon.jsx'
import DropletIcon from './DropletIcon.jsx'
import BranchIcon from './BranchIcon.jsx'
import ThreadIcon from './ThreadIcon.jsx'
import LoupeIcon from './LoupeIcon.jsx'
import BrushIcon from './BrushIcon.jsx'

// Sections 1-4 each have a distinct topic icon. Inactive "Coming soon"
// sections fall back to an icon representing their curriculum track.
const sectionIcons = {
  'section-1': ScrollIcon,
  'section-2': LeafIcon,
  'section-3': DropletIcon,
  'section-4': BranchIcon,
}

const trackIcons = {
  foundations: ThreadIcon,
  diagnostics: LoupeIcon,
  practice: BrushIcon,
}

export function getSectionIcon(section) {
  return sectionIcons[section.id] ?? trackIcons[section.track] ?? ScrollIcon
}
