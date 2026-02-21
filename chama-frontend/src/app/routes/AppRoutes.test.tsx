import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AppRoutes } from './AppRoutes'

describe('AppRoutes', () => {
  it('renders login at /login', () => {
    render(<AppRoutes />, {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/login']}>
          <GoogleOAuthProvider clientId="test">{children}</GoogleOAuthProvider>
        </MemoryRouter>
      ),
    })
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0)
  })

  it('renders register at /register', () => {
    render(<AppRoutes />, {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/register']}>
          <GoogleOAuthProvider clientId="test">{children}</GoogleOAuthProvider>
        </MemoryRouter>
      ),
    })
    expect(screen.getAllByText(/sign up|register/i).length).toBeGreaterThan(0)
  })
})
