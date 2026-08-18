import { useEffect, useRef } from 'react'
import svgRegistry from '../svg/index.js'
import ImageSlot from './ImageSlot.jsx'
import AudioButton from './AudioButton.jsx'
import PullQuote from './PullQuote.jsx'
import GlossaryText from './GlossaryText.jsx'
import SourceStrip from './SourceStrip.jsx'
import styles from './StepView.module.css'
import { asset } from '../utils/asset.js'

// Renders one lesson step purely from data. Focus moves to the heading on
// step change so keyboard/screen-reader users get an explicit cue that the
// content changed, without relying on a visual-only progress bar.
function StepView({ step, sources }) {
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [step.id])

  const SvgComponent = step.svgRef ? svgRegistry[step.svgRef] : null

  return (
    <article className={styles.step}>
      <h2 ref={headingRef} tabIndex={-1} className={styles.heading}>
        {step.heading}
      </h2>
      {step.paragraphs.map((paragraph, index) => (
        <p key={index} className={styles.paragraph}>
          <GlossaryText text={paragraph} />
        </p>
      ))}
      <PullQuote text={step.pullQuote} />
      {SvgComponent && (
        <div className={styles.figure}>
          <SvgComponent interactions={step.svgInteractions} />
        </div>
      )}
      {step.videoSrc && (
        <figure className={styles.videoFigure}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video className={styles.video} src={asset(step.videoSrc)} controls preload="metadata" playsInline />
          {step.videoCaption && <figcaption className={styles.videoCaption}>{step.videoCaption}</figcaption>}
        </figure>
      )}
      <ImageSlot imageSlot={step.imageSlot} />
      <AudioButton audioSrc={step.audioSrc} />
      <SourceStrip citations={step.citations} sources={sources} />
    </article>
  )
}

export default StepView
