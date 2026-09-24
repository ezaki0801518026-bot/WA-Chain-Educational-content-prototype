// lessons.json records each source's type in Japanese (権威書 / 公的機関 / 専門家).
// The label shown follows the interface language.
const KEYS = { 権威書: 'sourceTypeAuthority', 公的機関: 'sourceTypePublic', 専門家: 'sourceTypeExpert' }

export function sourceTypeLabel(type, t) {
  const key = KEYS[type]
  return key ? t(key) : type
}
