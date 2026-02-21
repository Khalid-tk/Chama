import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AppRoutes } from './app/routes/AppRoutes'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          <AppRoutes />
        </GoogleOAuthProvider>
      ) : (
        <AppRoutes />
      )}
    </BrowserRouter>
  </StrictMode>,
)
