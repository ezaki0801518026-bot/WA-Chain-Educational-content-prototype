import { serveWithRanges } from '../../server/range.js'

// /videos/* — lecture videos. See server/range.js for why this exists.
export const onRequest = serveWithRanges
