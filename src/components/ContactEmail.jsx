import { useMemo } from 'react'
import styles from './ContactEmail.module.css'

// Spam protection, in two layers:
//  1. The address is assembled at runtime from parts, so the literal string
//     never appears in the JS bundle for a scraper to regex out.
//  2. The page is client-rendered, so the served HTML contains no address
//     at all — crawlers that do not execute scripts see nothing.
// Both are cheap and neither costs a real visitor anything.
const PARTS = ['wachain', '2026', 'gmail', 'com']

function ContactEmail({ className = '' }) {
  const address = useMemo(() => `${PARTS[0]}${PARTS[1]}@${PARTS[2]}.${PARTS[3]}`, [])

  return (
    <a className={`${styles.link} ${className}`} href={`mailto:${address}`}>
      {address}
    </a>
  )
}

export default ContactEmail
