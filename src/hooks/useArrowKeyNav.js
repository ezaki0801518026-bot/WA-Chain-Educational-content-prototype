import { useEffect } from 'react'

// ArrowRight advances (Next / Finish / Continue), ArrowLeft goes back
// (Previous), on any page that opts in. Ignored while typing in a form
// field, while a modifier key is held, or when focus is inside the
// persistent header (so arrow-key browsing there is never hijacked).
// Handlers are expected to no-op internally when the action is currently
// disabled (e.g. Quiz's goNext already checks isAnswered), so passing a
// handler unconditionally is safe.
export function useArrowKeyNav({ onNext, onPrevious } = {}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      const tag = target?.tagName
      // INPUT/TEXTAREA: don't hijack typing. VIDEO/AUDIO: let the browser's
      // native arrow-key seek controls work when a media element has focus.
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'VIDEO' || tag === 'AUDIO' || target?.isContentEditable) {
        return
      }
      if (target?.closest?.('header')) return

      if (event.key === 'ArrowRight' && onNext) {
        event.preventDefault()
        onNext()
      } else if (event.key === 'ArrowLeft' && onPrevious) {
        event.preventDefault()
        onPrevious()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNext, onPrevious])
}
