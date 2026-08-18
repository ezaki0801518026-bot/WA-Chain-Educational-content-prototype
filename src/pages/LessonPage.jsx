import { useEffect, useState } from 'react'
import lessons from '../../data/lessons.json'
import { getProgress, setSectionStep } from '../utils/progress.js'
import StepView from '../components/StepView.jsx'
import ProgressIndicator from '../components/ProgressIndicator.jsx'
import ReadingProgress from '../components/ReadingProgress.jsx'
import StepOutline from '../components/StepOutline.jsx'
import FormatToggle from '../components/FormatToggle.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { useArrowKeyNav } from '../hooks/useArrowKeyNav.js'
import { track } from '../utils/analytics.js'
import styles from './LessonPage.module.css'

// Step-by-step lesson viewer. Owns the local step index; all content comes
// from lessons.json. Calls onFinish(sectionId) after the last step. Each
// step transition slides gently in the direction of travel, and a small
// checkmark pulses on forward progress — functional feedback, not praise.
// On wide viewports, a step outline in the left margin shows section
// position at a glance and lets the reader jump directly to another step.
function LessonPage({ sectionId, onFinish, navigate }) {
  const { t } = useLanguage()
  const section = lessons.sections.find((s) => s.id === sectionId)
  // Reopen at the saved step if the reader left partway through (and it's
  // still a valid index for this section); otherwise start at the top.
  const [stepIndex, setStepIndex] = useState(() => {
    const saved = getProgress()[sectionId]?.step
    if (section && typeof saved === 'number' && saved > 0 && saved < section.steps.length) return saved
    return 0
  })
  const [direction, setDirection] = useState('forward')
  const [pulseCheck, setPulseCheck] = useState(false)

  const total = section ? section.steps.length : 0

  // Persist the current step (with a timestamp, via setSectionStep) so the
  // home page can offer to resume the most recently touched section.
  useEffect(() => {
    if (section) {
      setSectionStep(sectionId, stepIndex)
      track('lesson_step', { section: sectionId, detail: `step ${stepIndex + 1}/${section.steps.length}` })
    }
  }, [sectionId, stepIndex, section])
  const step = section ? section.steps[stepIndex] : null
  const isLast = stepIndex === total - 1

  const goToStep = (nextIndex, dir) => {
    setDirection(dir)
    if (dir === 'forward') {
      setPulseCheck(true)
      window.setTimeout(() => setPulseCheck(false), 700)
    }
    setStepIndex(nextIndex)
  }

  const jumpToStep = (nextIndex) => {
    if (nextIndex === stepIndex) return
    goToStep(nextIndex, nextIndex > stepIndex ? 'forward' : 'backward')
  }

  const goFinish = () => {
    setPulseCheck(true)
    window.setTimeout(() => onFinish(sectionId), 320)
  }

  // Hooks must run unconditionally on every render, so the arrow-key
  // handlers are computed here (before the "section not found" early
  // return below) and simply no-op via undefined when there's no section.
  useArrowKeyNav({
    onNext: section ? (isLast ? goFinish : () => goToStep(stepIndex + 1, 'forward')) : undefined,
    onPrevious: section && stepIndex > 0 ? () => goToStep(stepIndex - 1, 'backward') : undefined,
  })

  if (!section) {
    return <p className={styles.notFound}>{t('sectionNotFound')}</p>
  }

  return (
    <div className={styles.pageGrid}>
      <StepOutline steps={section.steps} currentIndex={stepIndex} onSelect={jumpToStep} />
      <div className={styles.lesson}>
        <div className={styles.progressSlot}>
          <ReadingProgress value={(stepIndex + 1) / total} />
        </div>
        <div className={styles.lessonHeader}>
          <div className={styles.lessonMeta}>
            <div className={styles.topBar}>
              <ProgressIndicator text={t('step', { n: stepIndex + 1, total })} />
              {pulseCheck && (
                <span className={styles.checkPulse} aria-hidden="true">
                  ✓
                </span>
              )}
            </div>
            <p className={styles.sectionTitle}>{section.title}</p>
          </div>
          <FormatToggle sectionId={sectionId} hasVideo={Boolean(section.video)} navigate={navigate} />
        </div>
        <div className={styles.content}>
          <div
            key={step.id}
            className={direction === 'forward' ? styles.slideForward : styles.slideBackward}
          >
            <StepView step={step} sources={section.sources} />
          </div>
        </div>
        <nav className={styles.nav} aria-label="Lesson step navigation">
          <button
            type="button"
            className={styles.navButton}
            onClick={() => goToStep(stepIndex - 1, 'backward')}
            disabled={stepIndex === 0}
          >
            {t('previous')}
          </button>
          {isLast ? (
            <button type="button" className={styles.navButton} onClick={goFinish}>
              {t('finishGoToQuiz')}
            </button>
          ) : (
            <button type="button" className={styles.navButton} onClick={() => goToStep(stepIndex + 1, 'forward')}>
              {t('next')}
            </button>
          )}
        </nav>
      </div>
    </div>
  )
}

export default LessonPage
