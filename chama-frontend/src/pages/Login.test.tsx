import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Login } from './Login'

vi.mock('../lib/api', () => ({
  default: {
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}))

vi.mock('../store/authStore', () => ({
  useAuthStore: (fn: (s: { login: () => void }) => void) => fn({ login: vi.fn() }),
}))

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <div data-testid="google-login">Google</div>,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

describe('Login', () => {
  it('renders email and password inputs', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    expect(screen.getByPlaceholderText(/email/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/password/i)).toBeDefined()
  })

  it('has submit button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    expect(screen.getAllByRole('button', { name: /sign in/i }).length).toBeGreaterThan(0)
  })
})
