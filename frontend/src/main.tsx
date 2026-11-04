import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './styles/index.css'

window.addEventListener('unhandledrejection', (event) => {
  console.error(`[promise-error ${new Date().toISOString()}]`, event.reason)
})

const container = document.getElementById('root')
if (!container) throw new Error('Root container #root not found')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
