import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './StructureDiagram.module.css'

const LINE_COLOR = '#2b2b2b'
const ACCENT_COLOR = '#b5533c'

const LAYERS = [
  { key: 'sotei', x: 20, y: 20, width: 380, height: 220, labelX: 30, labelY: 38, label: 'sōtei — outer fabric mount' },
  { key: 'hadaUragami', x: 70, y: 60, width: 280, height: 140, labelX: 80, labelY: 76, label: 'hada-uragami — first lining' },
  { key: 'honshi', x: 130, y: 96, width: 160, height: 90, labelX: 210, labelY: 146, label: 'honshi', sublabel: 'primary support' },
]

// Section 1 diagram: the honshi (primary support) at the centre, surrounded
// by the sōtei mounting layers that protect it. Clicking a layer highlights
// it and shows its description (from `interactions`, sourced from
// lessons.json) below the diagram. Palette restricted to background
// #f5f0e8, line/text #2b2b2b, accent #b5533c.
function StructureDiagram({ interactions = [] }) {
  const { t } = useLanguage()
  const [selectedKey, setSelectedKey] = useState(null)

  const toggle = (key) => setSelectedKey((prev) => (prev === key ? null : key))
  const handleKeyDown = (key) => (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle(key)
    }
  }

  const selected = interactions.find((item) => item.key === selectedKey)

  return (
    <div>
      <svg
        viewBox="0 0 420 260"
        role="img"
        aria-labelledby="structure-diagram-title"
        style={{ width: '100%', height: 'auto' }}
      >
        <title id="structure-diagram-title">
          Cross-section diagram: the honshi primary support at the centre, surrounded by sōtei mounting layers.
          Select a layer for details.
        </title>
        <rect width="420" height="260" fill="#f5f0e8" />

        {LAYERS.map((layer) => {
          const isSelected = selectedKey === layer.key
          const isDimmed = selectedKey && !isSelected
          const stroke = isSelected ? ACCENT_COLOR : layer.key === 'honshi' ? ACCENT_COLOR : LINE_COLOR
          return (
            <g
              key={layer.key}
              className={styles.layer}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-label={layer.label}
              onClick={() => toggle(layer.key)}
              onKeyDown={handleKeyDown(layer.key)}
              opacity={isDimmed ? 0.4 : 1}
            >
              <rect
                x={layer.x}
                y={layer.y}
                width={layer.width}
                height={layer.height}
                fill="transparent"
                stroke={stroke}
                strokeWidth={isSelected ? 3 : layer.key === 'honshi' ? 2.5 : 1.5}
                className={styles.layerRect}
              />
              <text
                x={layer.labelX}
                y={layer.labelY}
                textAnchor={layer.key === 'honshi' ? 'middle' : 'start'}
                fontFamily={layer.key === 'honshi' ? 'Georgia, serif' : 'system-ui, sans-serif'}
                fontSize={layer.key === 'honshi' ? 14 : 12}
                fill={isSelected ? ACCENT_COLOR : LINE_COLOR}
              >
                {layer.label}
              </text>
              {layer.sublabel && (
                <text
                  x={layer.labelX}
                  y={layer.labelY + 18}
                  textAnchor="middle"
                  fontFamily="system-ui, sans-serif"
                  fontSize={11}
                  fill={LINE_COLOR}
                >
                  {layer.sublabel}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div className={styles.detailPanel} aria-live="polite">
        {selected ? (
          <>
            <p className={styles.detailLabel}>{selected.label}</p>
            <p className={styles.detailDescription}>{selected.description}</p>
          </>
        ) : (
          <p className={styles.detailHint}>{t('selectLayerHint')}</p>
        )}
      </div>
    </div>
  )
}

export default StructureDiagram
