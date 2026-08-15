import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
