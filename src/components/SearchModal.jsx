import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { buildSearchIndex, searchIndex } from '../utils/search.js'
import styles from './SearchModal.module.css'

const TYPE_ORDER = ['section', 'washi', 'glossary', 'page']
const TYPE_LABEL_KEY = {
  section: 'searchTypeSection',
  washi: 'searchTypeWashi',
  glossary: 'searchTypeGlossary',
  page: 'searchTypePage',
}

// Site-wide search, available from the header on every page. Opens as a
// modal (button, or the "/" and Cmd/Ctrl-K shortcuts); results are grouped
// by kind and fully keyboard-navigable. Selecting a result routes to it.
// The shortcut is Cmd-K on Apple hardware and Ctrl-K elsewhere; the hint
// has to say the one the reader actually has.
const IS_APPLE =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '')

function SearchModal({ navigate }) {
  const { t, lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const triggerRef = useRef(null)

  const index = useMemo(() => buildSearchIndex(t), [lang]) // eslint-disable-line react-hooks/exhaustive-deps
  const results = useMemo(() => searchIndex(index, query), [index, query])

  // Group results by type, keeping the ranked order within each group, and
  // flatten again for keyboard navigation so the cursor matches the DOM.
  const grouped = useMemo(() => {
    const byType = {}
    for (const item of results) (byType[item.type] ||= []).push(item)
    const order = []
    const groups = []
    for (const type of TYPE_ORDER) {
      if (byType[type]?.length) {
        groups.push({ type, items: byType[type] })
        order.push(...byType[type])
      }
    }
    return { groups, flat: order }
  }, [results])

  useEffect(() => setCursor(0), [query])

  const close = () => {
    setOpen(false)
    setQuery('')
    triggerRef.current?.focus()
  }

  const choose = (item) => {
    if (!item) return
    setOpen(false)
    setQuery('')
    navigate(item.route)
  }

  // Global shortcuts: "/" or Cmd/Ctrl-K opens search (ignored while typing
  // in a field); Escape closes.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (open && event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (open) return
      const target = event.target
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || target.tagName === 'SELECT')
      const isSlash = event.key === '/' && !typing
      const isCmdK = (event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')
      if (isSlash || isCmdK) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const onInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((c) => Math.min(c + 1, grouped.flat.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(grouped.flat[cursor])
    }
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label={t('searchOpen')}
      >
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" />
          <line x1="12.5" y1="12.5" x2="16" y2="16" strokeLinecap="round" />
        </svg>
        <kbd className={styles.kbdHint} aria-hidden="true">
          {IS_APPLE ? '⌘ K' : 'Ctrl K'}
        </kbd>
      </button>

      {open && (
        <div className={styles.backdrop} onClick={close}>
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label={t('searchOpen')}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.searchBar}>
              <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="8" cy="8" r="5.5" />
                <line x1="12.5" y1="12.5" x2="16" y2="16" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                className={styles.input}
                placeholder={t('searchPlaceholder')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                aria-label={t('searchPlaceholder')}
              />
              <button type="button" className={styles.closeButton} onClick={close} aria-label={t('searchClose')}>
                Esc
              </button>
            </div>

            <div className={styles.results}>
              {!query.trim() ? (
                <p className={styles.message}>{t('searchHint')}</p>
              ) : grouped.flat.length === 0 ? (
                <p className={styles.message}>{t('searchNoResults', { q: query })}</p>
              ) : (
                grouped.groups.map((group) => (
                  <div key={group.type} className={styles.group}>
                    <p className={styles.groupLabel}>{t(TYPE_LABEL_KEY[group.type])}</p>
                    <ul className={styles.list}>
                      {group.items.map((item) => {
                        const flatIndex = grouped.flat.indexOf(item)
                        return (
                          <li key={`${item.type}-${item.title}-${flatIndex}`}>
                            <button
                              type="button"
                              className={`${styles.result} ${flatIndex === cursor ? styles.resultActive : ''}`}
                              onMouseEnter={() => setCursor(flatIndex)}
                              onClick={() => choose(item)}
                            >
                              <span className={styles.resultTitle}>{item.title}</span>
                              {item.subtitle && <span className={styles.resultSubtitle}>{item.subtitle}</span>}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SearchModal
