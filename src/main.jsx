import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerServiceWorker } from '@/lib/serviceWorker'

// Register service worker for offline caching
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)