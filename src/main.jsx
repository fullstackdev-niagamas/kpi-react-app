import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { KPIProvider } from './context/KPIContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <KPIProvider>
        <App />
      </KPIProvider>
    </ToastProvider>
  </React.StrictMode>,
)
