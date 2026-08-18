import { useEffect, useRef, useState } from 'react'
import lessons from '../../data/lessons.json'
import { setQuizResult } from '../utils/progress.js'
import ProgressIndicator from '../components/ProgressIndicator.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { useArrowKeyNav } from '../hooks/useArrowKeyNav.js'
import styles from './QuizPage.module.css'

// One question at a time; after the last question, shows a review list of
// every question with correct/incorrect indicators and explanations. No
// pass/fail gate — the correct count is displayed factually and the user
// always proceeds. The Next/See-results button always sits in the same
// fixed footer position (matching LessonPage's nav) whether or not the
// question has been answered yet — only its disabled state changes — so
// the control never jumps around as feedback text appears. ArrowRight
// mirrors that same button.
function QuizPage({ sectionId, onFinish }) {
  const { t } = useLanguage()
  const section = lessons.sections.find((s) => s.id === sectionId)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [phase, setPhase] = useState('quiz') // 'quiz' | 'review'
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [questionIndex, phase])

  const quiz = section ? section.quiz : []
  const total = quiz.length
  const question = phase === 'quiz' ? quiz[questionIndex] : null
  const selectedOptionId = question ? answers[question.id] : undefined
  const isAnswered = selectedOptionId != null
  const isLast = questionIndex === total - 1

  const goNext = () => {
    if (!isAnswered) return
    if (isLast) {
      const correctCount = quiz.filter((q) => answers[q.id] === q.correctOptionId).length
      setQuizResult(sectionId, correctCount, total)
      setPhase('review')
    } else {
      setQuestionIndex((i) => i + 1)
    }
  }

  // Hooks must run unconditionally on every render, so this is computed
  // here (before the "section not found" early return below) — goNext
  // already no-ops when unanswered, and review's forward action is simply
  // onFinish.
  useArrowKeyNav({
    onNext: !section ? undefined : phase === 'review' ? () => onFinish(sectionId) : goNext,
  })

  if (!section) {
    return <p className={styles.notFound}>{t('sectionNotFound')}</p>
  }


  if (phase === 'review') {
    const correct = quiz.filter((q) => answers[q.id] === q.correctOptionId).length
    return (
      <div className={styles.pageGrid}>
        <div className={styles.spacer} />
        <div className={styles.review}>
          <div className={styles.topRow}>
            <ProgressIndicator text={t('quizScore', { correct, total })} />
          </div>
          <div className={styles.reviewScroll}>
            <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
              {t('quizResults')}
            </h1>
            <ul className={styles.reviewList}>
              {quiz.map((q) => {
                const selectedId = answers[q.id]
                const isCorrect = selectedId === q.correctOptionId
                const selectedOption = q.options.find((o) => o.id === selectedId)
                const correctOption = q.options.find((o) => o.id === q.correctOptionId)
                return (
                  <li key={q.id} className={styles.reviewItem}>
                    <p className={styles.reviewQuestion}>
                      <span className={isCorrect ? styles.markCorrect : styles.markIncorrect} aria-hidden="true">
                        {isCorrect ? '✓' : '✗'}
                      </span>{' '}
                      {q.text}
                    </p>
                    <p className={styles.reviewAnswer}>
                      {t('yourAnswer')} {selectedOption ? selectedOption.text : t('noAnswer')}
                    </p>
                    {!isCorrect && (
                      <p className={styles.reviewCorrectAnswer}>
                        {t('correctAnswerLabel')} {correctOption.text}
                      </p>
                    )}
                    <p className={styles.explanation}>{q.explanation}</p>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className={styles.reviewFooter}>
            <button type="button" className={styles.navButton} onClick={() => onFinish(sectionId)}>
              {t('continueToSummary')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const selectOption = (optionId) => {
    if (isAnswered) return
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }))
  }

  return (
    <div className={styles.pageGrid}>
      <div className={styles.spacer} />
      <div className={styles.quiz}>
        <div className={styles.topBar}>
          <ProgressIndicator text={t('question', { n: questionIndex + 1, total })} />
        </div>
        <div className={styles.content}>
          <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
            {question.text}
          </h1>
          <ul className={styles.options}>
            {question.options.map((option) => {
              let stateClass = styles.option
              if (isAnswered && option.id === question.correctOptionId) {
                stateClass = `${styles.option} ${styles.optionCorrect}`
              } else if (isAnswered && option.id === selectedOptionId) {
                stateClass = `${styles.option} ${styles.optionIncorrect}`
              }
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={stateClass}
                    onClick={() => selectOption(option.id)}
                    disabled={isAnswered}
                    aria-pressed={option.id === selectedOptionId}
                  >
                    {option.text}
                  </button>
                </li>
              )
            })}
          </ul>
          {isAnswered && (
            <div className={styles.feedback}>
              <p className={styles.feedbackLabel}>
                {selectedOptionId === question.correctOptionId ? (
                  <>
                    <span className={styles.feedbackCheck} aria-hidden="true">
                      ✓
                    </span>{' '}
                    {t('correctFeedback')}
                  </>
                ) : (
                  t('incorrectFeedback')
                )}
              </p>
              <p className={styles.explanation}>{question.explanation}</p>
            </div>
          )}
        </div>
        <nav className={styles.nav} aria-label="Quiz question navigation">
          <button type="button" className={styles.navButton} onClick={goNext} disabled={!isAnswered}>
            {isLast ? t('seeResults') : t('nextQuestion')}
          </button>
        </nav>
      </div>
    </div>
  )
}

export default QuizPage
