import { serveWithRanges } from '../../server/range.js'

// /video/* — section intro clips. See server/range.js for why this exists.
export const onRequest = serveWithRanges
