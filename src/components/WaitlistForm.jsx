import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { submitForm } from '../formConfig.js'
import styles from './WaitlistForm.module.css'

// Reusable email-capture form for not-yet-built offerings (subscription
// plan, washi-kit bundle, conservator community). Submits via the shared
// submitForm() helper (see src/formConfig.js) — no page navigation, with a
// bounded timeout so a blocked/slow network shows a retryable error
// instead of hanging indefinitely.
const ROLE_OPTIONS = [
  { value: 'freelance', labelKey: 'waitlistRoleFreelance' },
  { value: 'institution', labelKey: 'waitlistRoleInstitution' },
  { value: 'student', labelKey: 'waitlistRoleStudent' },
  { value: 'other', labelKey: 'waitlistRoleOther' },
]

function WaitlistForm({ context, buttonLabel }) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [phase, setPhase] = useState('idle') // 'idle' | 'sending' | 'success' | 'error'

  const submit = async (event) => {
    event.preventDefault()
    setPhase('sending')
    try {
      await submitForm({
        _subject: `Washi Course — waitlist: ${context}`,
        waitlist: context,
        email: email || '(not provided)',
        role: role || '(not provided)',
      })
      setPhase('success')
    } catch {
      setPhase('error')
    }
  }

  if (phase === 'success') {
    return <p className={styles.resultText}>{t('waitlistThanks')}</p>
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.roleField}>
        <label className={styles.roleLabel} htmlFor={`waitlist-role-${context}`}>
          {t('waitlistRoleLabel')}
        </label>
        <select
          id={`waitlist-role-${context}`}
          className={styles.select}
          value={role}
          onChange={(event) => setRole(event.target.value)}
          disabled={phase === 'sending'}
        >
          <option value="">{t('waitlistRolePlaceholder')}</option>
          {ROLE_OPTIONS.map(({ value, labelKey }) => (
            <option key={value} value={value}>
              {t(labelKey)}
            </option>
          ))}
        </select>
      </div>
      <label className={styles.srOnlyLabel} htmlFor={`waitlist-email-${context}`}>
        {t('waitlistEmailLabel')}
      </label>
      <input
        id={`waitlist-email-${context}`}
        type="email"
        required
        className={styles.input}
        placeholder={t('waitlistEmailPlaceholder')}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={phase === 'sending'}
      />
      <button type="submit" className={styles.button} disabled={phase === 'sending'}>
        {phase === 'sending' ? t('waitlistSending') : buttonLabel || t('waitlistJoin')}
      </button>
      {phase === 'error' && <p className={styles.resultTextError}>{t('waitlistError')}</p>}
    </form>
  )
}

export default WaitlistForm
