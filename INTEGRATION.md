# Chama Backend–Frontend Integration

## API contract

- **Response shape:** `{ success: boolean, data?: any, message?: string, errors?: any }`
- **Auth:** All protected routes use `Authorization: Bearer <JWT>`
- **Chama scope:** Chama routes use `chamaId` in the path: `/api/chamas/:chamaId/...`
- **Frontend storage:** `token`, `user`, `activeChamaId`, `activeChama` (with `role`) in Zustand + localStorage

---

## Backend routes used by the frontend

Base URL: `VITE_API_URL` (e.g. `http://localhost:5000/api`).

| Method | Path | Used by |
|--------|------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google login |
| POST | `/api/auth/forgot-password` | Forgot password |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Refresh user + memberships |
| GET | `/api/chamas/my` | Select chama |
| POST | `/api/chamas` | Create chama |
| POST | `/api/chamas/join` | Join chama |
| GET | `/api/chamas/:chamaId/context` | Chama context |
| GET | `/api/chamas/:chamaId/members` | Members list |
| PATCH | `/api/chamas/:chamaId/members/:userId/role` | Role change |
| GET | `/api/chamas/:chamaId/invites` | Invites list |
| POST | `/api/chamas/:chamaId/invites` | Create invite |
| GET | `/api/chamas/:chamaId/join-requests` | Join requests |
| PATCH | `/api/chamas/:chamaId/join-requests/:id/approve` | Approve join |
| PATCH | `/api/chamas/:chamaId/join-requests/:id/reject` | Reject join |
| GET | `/api/chamas/:chamaId/contributions` | Admin contributions |
| GET | `/api/chamas/:chamaId/my/contributions` | My contributions |
| GET | `/api/chamas/:chamaId/loans` | Admin loans |
| GET | `/api/chamas/:chamaId/my/loans` | My loans |
| PATCH | `/api/chamas/:chamaId/loans/:loanId/approve` | Approve loan |
| PATCH | `/api/chamas/:chamaId/loans/:loanId/reject` | Reject loan |
| POST | `/api/mpesa/:chamaId/stkpush` | STK push |
| GET | `/api/mpesa/:chamaId/my/mpesa` | My Mpesa payments |
| GET | `/api/mpesa/:chamaId/mpesa` | Admin Mpesa list |
| GET | `/api/invites/preview?token=` | Accept invite preview |
| POST | `/api/invites/accept` | Accept invite |
| GET | `/api/super/chamas` | Super admin |
| GET | `/api/super/users` | Super admin |
| PATCH | `/api/super/users/:userId/global-role` | Super admin |
| GET | `/api/super/audit` | Super admin |

---

## Frontend routes

- **Public:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/accept-invite`
- **Protected:** `/select-chama`
- **Chama member:** `/member/:chamaId/dashboard`, `.../contributions`, `.../loans`, `.../transactions`, `.../mpesa`, `.../analytics`, `.../chama-health`, `.../settings`
- **Chama admin:** `/admin/:chamaId/dashboard`, `.../members`, `.../contributions`, `.../loans`, `.../transactions`, `.../mpesa`, `.../approvals`, `.../join-requests`, `.../reports`, `.../analytics`, `.../audit-log`, `.../settings`
- **Super admin:** `/super`, `/super/chamas`, `/super/users`, `/super/audit`

---

## Env variables

**Backend (`.env`):**

- `PORT` – server port (default 5000)
- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – secret for JWT
- `JWT_EXPIRES_IN` – e.g. 7d
- `GOOGLE_CLIENT_ID` – for Google login
- `CORS_ORIGIN` – comma-separated, e.g. `http://localhost:5173,http://localhost:3000`
- `FRONTEND_URL` – e.g. `http://localhost:5173` (invites, reset links)
- `MPESA_*` – Mpesa Daraja (optional)

**Frontend (`.env`):**

- `VITE_API_URL` – backend API base including `/api`, e.g. `http://localhost:5000/api`
- `VITE_GOOGLE_CLIENT_ID` – same as backend for Google button

---

## How to run

**Backend:**

```bash
cd chama-backend
npm install
cp .env.example .env   # edit with real values
npx prisma migrate dev
npx prisma db seed     # optional: test users
npm run dev
```

**Frontend:**

```bash
cd chama-frontend
npm install
cp .env.example .env   # set VITE_API_URL and optionally VITE_GOOGLE_CLIENT_ID
npm run dev
```

Backend: http://localhost:5000  
Frontend: http://localhost:5173 (Vite)

---

## Manual test checklist

1. **Health:** `GET http://localhost:5000/api/health` → `{ ok: true }`
2. **Signup:** Register → redirect to `/select-chama`, memberships empty
3. **Login:** Email/password → redirect to `/select-chama`, memberships loaded
4. **Google login:** (if configured) → same as login
5. **Create chama:** From select-chama → joinCode shown → Enter → admin dashboard
6. **Join chama:** Join with code → membership in list → Enter → member dashboard
7. **Chama switch:** Header switcher → change chama → dashboard updates
8. **Member Mpesa:** STK push form → payment record → (after callback) contribution/repayment
9. **Admin Mpesa:** List shows all chama payments
10. **Role guard:** Member URL to admin route → `/unauthorized`
11. **Logout:** Clears token and chama → redirect to `/login`

---

## Fixes applied

- **CORS:** Allow `http://localhost:5173`, `http://localhost:3000`, `Authorization` header
- **Routes:** Invites at `/api/invites/*`; chama invites at `/api/chamas/:chamaId/invites`
- **Frontend `chamaRoute`:** Mpesa paths use `/mpesa/...` (no double `/api`)
- **Frontend API calls:** Invites use `/invites/preview`, `/invites/accept`, `/chamas/:id/invites`
- **Auth store:** `refreshMemberships` sets `globalRole` on user
- **Backend:** `GET /api/health` returns `{ ok: true }`
