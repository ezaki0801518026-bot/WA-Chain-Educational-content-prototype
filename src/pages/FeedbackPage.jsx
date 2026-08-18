import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { submitForm } from '../formConfig.js'
import styles from './FeedbackPage.module.css'

const TYPES = [
  { value: 'general', labelKey: 'feedbackTypeGeneral' },
  { value: 'error', labelKey: 'feedbackTypeError' },
  { value: 'idea', labelKey: 'feedbackTypeIdea' },
  { value: 'bug', labelKey: 'feedbackTypeBug' },
]

// Standalone feedback form, reachable from the site menu and footer. Sends
// through the same shared submitForm() helper as the survey and waitlist
// (see src/formConfig.js), so all delivery is configured in one place.
function FeedbackPage() {
  const { t } = useLanguage()
  const [type, setType] = useState('general')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState('idle') // 'idle' | 'sending' | 'success' | 'error'
  const [invalid, setInvalid] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!message.trim()) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setPhase('sending')
    const typeLabel = t(TYPES.find((x) => x.value === type)?.labelKey || 'feedbackTypeGeneral')
    try {
      await submitForm({
        _subject: `Washi Course — feedback: ${type}`,
        feedbackType: typeLabel,
        message: message.trim(),
        replyTo: email || '(not provided)',
      })
      setPhase('success')
    } catch {
      setPhase('error')
    }
  }

  if (phase === 'success') {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>{t('feedbackTitle')}</h1>
        <p className={styles.successText}>{t('feedbackThanks')}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{t('feedbackTitle')}</h1>
        <p className={styles.description}>{t('feedbackDescription')}</p>
      </div>

      <form className={styles.form} onSubmit={submit}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t('feedbackTypeLabel')}</legend>
          <div className={styles.typeRow}>
            {TYPES.map(({ value, labelKey }) => (
              <label key={value} className={`${styles.typeChip} ${type === value ? styles.typeChipActive : ''}`}>
                <input
                  type="radio"
                  name="feedback-type"
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value)}
                  className={styles.srOnly}
                />
                {t(labelKey)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className={styles.label} htmlFor="feedback-message">
          {t('feedbackMessageLabel')}
        </label>
        <textarea
          id="feedback-message"
          className={styles.textarea}
          rows={6}
          placeholder={t('feedbackMessagePlaceholder')}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value)
            if (invalid) setInvalid(false)
          }}
          disabled={phase === 'sending'}
          aria-invalid={invalid}
        />
        {invalid && <p className={styles.validation}>{t('feedbackValidation')}</p>}

        <label className={styles.label} htmlFor="feedback-email">
          {t('feedbackEmailLabel')}
        </label>
        <input
          id="feedback-email"
          type="email"
          className={styles.input}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={phase === 'sending'}
        />

        <button type="submit" className={styles.submit} disabled={phase === 'sending'}>
          {phase === 'sending' ? t('feedbackSending') : t('feedbackSubmit')}
        </button>
        {phase === 'error' && <p className={styles.errorText}>{t('feedbackError')}</p>}
      </form>
    </div>
  )
}

export default FeedbackPage
