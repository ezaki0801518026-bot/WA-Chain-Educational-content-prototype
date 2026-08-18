import StructureDiagram from './StructureDiagram.jsx'
import PriorityDiagram from './PriorityDiagram.jsx'
import ReversibilityDiagram from './ReversibilityDiagram.jsx'
import CelluloseDiagram from './CelluloseDiagram.jsx'
import LigninComparisonChart from './LigninComparisonChart.jsx'
import AcidityScaleDiagram from './AcidityScaleDiagram.jsx'
import HydrogenBondingDiagram from './HydrogenBondingDiagram.jsx'
import FiberBondDiagram from './FiberBondDiagram.jsx'
import FiberLengthChart from './FiberLengthChart.jsx'
import FiberShapeDiagram from './FiberShapeDiagram.jsx'

// Maps the `svgRef` string used in lessons.json to its component.
// Extended as each section's diagrams are implemented.
const svgRegistry = {
  StructureDiagram,
  PriorityDiagram,
  ReversibilityDiagram,
  CelluloseDiagram,
  LigninComparisonChart,
  AcidityScaleDiagram,
  HydrogenBondingDiagram,
  FiberBondDiagram,
  FiberLengthChart,
  FiberShapeDiagram,
}

export default svgRegistry
