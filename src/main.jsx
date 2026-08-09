import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/CustomButton/CustomButton.css'
import App from './App.jsx'
import { installVitePreloadRecovery } from './lib/vitePreloadRecovery.js'

installVitePreloadRecovery()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
