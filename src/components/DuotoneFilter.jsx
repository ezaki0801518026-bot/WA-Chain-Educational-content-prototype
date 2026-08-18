// Mounted once (see App.jsx). Defines an SVG filter, referenced by id from
// CSS as `filter: url(#duotone)`, that remaps every photo's shadows to ink
// (#2b2b2b) and highlights to paper (#f5f0e8) — the same two tokens as
// --accent-ish dark and --bg, so photos sit inside the existing palette
// rather than importing their own colour.
function DuotoneFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="duotone" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.33 0.33 0.33 0 0
                    0.33 0.33 0.33 0 0
                    0.33 0.33 0.33 0 0
                    0    0    0   1 0"
          />
          <feComponentTransfer colorInterpolationFilters="sRGB">
            <feFuncR type="table" tableValues="0.1686 0.9608" />
            <feFuncG type="table" tableValues="0.1686 0.9412" />
            <feFuncB type="table" tableValues="0.1686 0.9098" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  )
}

export default DuotoneFilter
