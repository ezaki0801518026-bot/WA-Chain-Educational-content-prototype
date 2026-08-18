import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './tokens.css'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>,
)

// Offline support (production only, so dev never serves stale modules).
// Registered under BASE_URL rather than '/', so the worker's scope covers the
// sub-path a GitHub Pages project site is served from.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  })
}
