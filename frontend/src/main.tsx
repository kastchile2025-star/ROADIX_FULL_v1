import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { tryRecoverFromChunkLoadError } from './utils/chunkLoadRecovery'

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    const viteEvent = event as Event & { payload?: unknown }
    if (tryRecoverFromChunkLoadError(viteEvent.payload ?? event)) {
      event.preventDefault()
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (tryRecoverFromChunkLoadError(event.reason)) {
      event.preventDefault()
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
