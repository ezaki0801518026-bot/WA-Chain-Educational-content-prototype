import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './CertificateButton.module.css'

// Wraps canvas text at a maximum width, returning the lines to draw.
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word
    if (ctx.measureText(attempt).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = attempt
    }
  }
  if (line) lines.push(line)
  return lines
}

// Draws a completion card (1200×630, OG-image proportions) on a canvas:
// paper ground, ink text, a vermillion seal — consistent with the site's
// ink-and-paper identity. Shared via the Web Share API where available,
// otherwise downloaded as a PNG.
function drawCard({ heading, sectionTitle, courseName, dateLabel, scoreLabel }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')

  // Paper ground + double ink border
  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(0, 0, 1200, 630)
  ctx.strokeStyle = '#2b2b2b'
  ctx.lineWidth = 3
  ctx.strokeRect(28, 28, 1144, 574)
  ctx.lineWidth = 1
  ctx.strokeRect(40, 40, 1120, 550)

  ctx.textAlign = 'center'

  // Heading
  ctx.fillStyle = '#4a4a3a'
  ctx.font = '600 26px Lora, Georgia, serif'
  ctx.fillText(heading.toUpperCase(), 600, 140)

  // Rule under heading
  ctx.strokeStyle = '#4a4a3a'
  ctx.beginPath()
  ctx.moveTo(500, 165)
  ctx.lineTo(700, 165)
  ctx.stroke()

  // Section title (wrapped)
  ctx.fillStyle = '#1a1a1a'
  ctx.font = '500 44px Lora, Georgia, serif'
  const lines = wrapLines(ctx, sectionTitle, 980)
  const startY = lines.length > 1 ? 280 : 310
  lines.forEach((line, i) => ctx.fillText(line, 600, startY + i * 58))

  // Score (optional) + date
  ctx.fillStyle = '#4a4a3a'
  ctx.font = '24px Lora, Georgia, serif'
  if (scoreLabel) ctx.fillText(scoreLabel, 600, 440)
  ctx.fillText(dateLabel, 600, scoreLabel ? 480 : 450)

  // Course name
  ctx.font = '600 22px Lora, Georgia, serif'
  ctx.fillText(courseName, 600, 545)

  // Vermillion seal, slightly tilted like a hand-pressed stamp
  ctx.save()
  ctx.translate(1080, 520)
  ctx.rotate(0.06)
  ctx.fillStyle = '#a63f2e'
  ctx.fillRect(-32, -32, 64, 64)
  ctx.fillStyle = '#f5f0e8'
  ctx.font = '600 30px Lora, Georgia, serif'
  ctx.fillText('和', 0, 11)
  ctx.restore()

  return canvas
}

function CertificateButton({ sectionTitle, quizResult }) {
  const { t, lang } = useLanguage()

  const handleClick = () => {
    const canvas = drawCard({
      heading: t('certHeading'),
      sectionTitle,
      courseName: t('appTitle'),
      dateLabel: new Date().toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      scoreLabel: quizResult
        ? t('quizScore', { correct: quizResult.correct, total: quizResult.total })
        : '',
    })

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'washi-course-completion.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: t('certHeading') })
          return
        } catch {
          // Cancelled or unsupported mid-flight — fall through to download.
        }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'washi-course-completion.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <button type="button" className={styles.button} onClick={handleClick}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 2v8" />
        <path d="M4.5 6.5 8 10l3.5-3.5" />
        <path d="M2.5 13.5h11" />
      </svg>
      {t('certButton')}
    </button>
  )
}

export default CertificateButton
