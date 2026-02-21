# Chama – Fullstack App

React (Vite) frontend + Node (Express) backend with Prisma/PostgreSQL. Multi-chama, roles, join requests, loans, contributions, M-Pesa (STK push + callback simulation), and analytics.

---

## Implementation summary (improvements)

- **Platform Admin**: Button visible only when `user.globalRole === 'SUPER_ADMIN'`; navigates to `/super/dashboard`. Super admin routes wrapped in `SuperAdminLayout` with sidebar (Dashboard, Chamas, Users, Audit Log). Backend: `GET /super/chamas`, `GET /super/users`, `PATCH /super/users/:userId/global-role`, `GET /super/audit` protected by `requireGlobalRole(['SUPER_ADMIN'])`. `/auth/me` returns `globalRole`.
- **Logout**: Works from any page. `logout()` clears token, user, memberships, and localStorage (`chama-auth`, `chama-context`, `chama-token`, `chama-active-chama-id`) then redirects to `/login`. Axios 401 interceptor performs the same cleanup and redirect.
- **Analytics**: Backend returns stable shapes: all series are arrays (default month keys for range so charts get full timeline), KPIs and amounts are numbers (`ensureNumber`). Frontend charts use `Number()` for values and show empty/loading states.
- **Seed**: 10 chamas (incl. PLATFORM for audit), 90+ members, PENDING join requests for APPROVAL chamas, 12 months contributions, loans (PENDING/ACTIVE/PAID/LATE), MpesaPayment and Transaction ledger. Demo logins printed after `npx prisma db seed`.

---

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- (Optional) Google OAuth client ID for Google login
- (Optional) M-Pesa Daraja credentials for live STK push

### Backend

```bash
cd chama-backend
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, and optionally GOOGLE_CLIENT_ID, M-Pesa vars
npm install
npx prisma migrate dev
npm run dev
```

Runs at `http://localhost:5000`. API base: `http://localhost:5000/api`.

### Frontend

```bash
cd chama-frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api and optionally VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### Simulating M-Pesa (development)

To test sending money through M-Pesa **without real Safaricom credentials**:

1. **Leave M-Pesa env vars empty** in `chama-backend/.env` (no `MPESA_CONSUMER_KEY`, etc.). The backend will use a mock STK push.
2. **Run backend in development** (`npm run dev`), so the dev-only simulate endpoint is enabled.
3. In the app, log in as a **member** (e.g. `member1@chama.com` / `Member123!`), select a chama, go to **Mpesa** (sidebar).
4. Enter a **phone number** (e.g. `254712345678`) and **amount** (e.g. `500`), choose **Contribution**, then click **Initiate Payment**.
5. After a few seconds the app will **simulate a successful callback** and the payment will show as **SUCCESS**. The contribution is created and appears under Contributions and in the payment list.

No real M-Pesa flow runs; the frontend calls the backend’s `POST /api/mpesa/dev/simulate-callback` after initiating so the payment completes in dev.

### Publishing to GitHub

- **Do not commit** `.env` files (they are in `.gitignore`). Use `.env.example` in each package as a template.
- After cloning, run `cp .env.example .env` in both `chama-backend` and `chama-frontend`, then set `DATABASE_URL`, `JWT_SECRET`, and other variables.
- Demo logins are documented in `CREDENTIALS.md` (from seed).

---

## Environment variables

### Backend (chama-backend/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DATABASE_URL_TEST` | No | Test DB URL; if set, tests use it |
| `JWT_SECRET` | Yes | Secret for JWT (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Default `7d` |
| `PORT` | No | Default `5000` |
| `CORS_ORIGIN` | No | Comma-separated origins (default includes localhost:5173) |
| `FRONTEND_URL` | No | Used in emails (e.g. `http://localhost:5173`) |
| `GOOGLE_CLIENT_ID` | No | For Google login |
| `MPESA_*` | No | For live M-Pesa; leave empty to use mock STK + dev simulate callback |
| `SMTP_*` | No | For sending emails; leave empty to log to console |

### Frontend (chama-frontend/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Default `http://localhost:5000/api` |
| `VITE_GOOGLE_CLIENT_ID` | No | For Google OAuth button |

---

## Email (Gmail SMTP)

The app uses a single mail utility (`src/utils/mailer.js`) with **nodemailer** over SMTP. Port 587 uses STARTTLS; Gmail is supported. If SMTP is not configured, emails are logged to the console.

### Config

Set in `chama-backend/.env` only (do not commit; see `.env.example` for placeholders):
2. **Create a Sender Identity** (Settings → Sender Authentication): verify a single sender or domain so SendGrid can send on your behalf.
3. **Create an API key** (Settings → API Keys): create a key with “Mail Send” permission; copy the key (shown once).
4. **Configure the backend** using the **SMTP method** (no code changes; uses `nodemailer` over SMTP):

In `chama-backend/.env`:

```env
SMTP_PROVIDER=sendgrid
SENDGRID_SMTP_USER=apikey
SENDGRID_SMTP_PASS=<your-sendgrid-api-key>
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_FROM="Chama App <your-verified-sender@yourdomain.com>"
FRONTEND_URL=https://your-frontend-domain.com
```

- `SENDGRID_SMTP_PASS` is your SendGrid API key (not a separate “SMTP password”).
- `SMTP_FROM` must use a verified sender (email or domain) from step 2.

5. **Optional: test email config**  
   - `GET /api/health/email` returns `{ ok: true, emailConfigured: true|false }` so you can confirm the transport is set up.

The server runs an in-process queue worker every 30 seconds. For production at scale, run a **separate worker process** that calls the same `processEmailQueue()` and use `POST /api/super/email/flush` (super admin only) to trigger processing on demand.

---

## Commands

### Backend

- `npm run dev` – start API with nodemon  
- `npm test` – run integration tests (Vitest + Supertest)  
- `npm run test:watch` – run tests in watch mode  
- `npm run test:db:reset` – reset DB (run with `DATABASE_URL` or `DATABASE_URL_TEST` as needed)  
- `npm run lint` – run ESLint (`npx eslint .`)  
- `npm run lint:fix` – ESLint with auto-fix  
- `npx prisma migrate dev` – run migrations  
- `npx prisma db seed` – seed realistic demo data (see **Demo logins** below)  
- `npx prisma studio` – open Prisma Studio  

### Frontend

- `npm run dev` – start Vite dev server  
- `npm run build` – TypeScript + Vite build  
- `npm run preview` – preview production build  
- `npm test` – run unit/integration tests (Vitest + RTL)  
- `npm run test:watch` – tests in watch mode  
- `npm run lint` – run ESLint  
- `npm run lint:fix` – ESLint with auto-fix  

---

## Test results summary

### Backend (integration)

Run: `cd chama-backend && npm test`

- **Auth**: Register → login → GET /auth/me returns user and memberships; Google login route validates input.
- **Chama**: Create chama (creator is ADMIN); search returns expected fields; request join (PENDING); admin approves → membership created.
- **Loans**: Member requests loan (PENDING); admin approves (APPROVED); admin disburses → MpesaPayment LOAN_DISBURSE + Transaction OUT.
- **Mpesa**: Member initiates STK repayment → MpesaPayment PENDING; dev simulate callback SUCCESS → repayment created.
- **Analytics**: Admin and member analytics return valid shapes (series arrays, kpis).

All 13 backend tests pass when DB and env are configured.

### Frontend (unit / routing)

Run: `cd chama-frontend && npm test`

- **AppRoutes**: Renders login at `/login`, register at `/register`.
- **Login**: Renders email/password inputs and submit button.

All 4 frontend tests pass.

---

## Manual QA checklist

1. **Auth**  
   - [ ] Register with email/password → redirect to Select Chama.  
   - [ ] **Logout** from any page (Select Chama, member dashboard, admin dashboard, super admin) → token/state cleared, redirect to /login.  
   - [ ] Login with same user → Select Chama.  
   - [ ] (If configured) Google login → Select Chama.

2. **Chama selection**  
   - [ ] Create Chama → see code + join code; chama appears in list.  
   - [ ] Join with code (OPEN chama) → chama appears; Enter Chama works.  
   - [ ] “Explore chamas” → search; Request to Join on one chama → status PENDING.

3. **Join requests (admin)**  
   - [ ] As admin, open Join Requests for a chama.  
   - [ ] Approve a request → toast; user sees chama in My Chamas after refresh.  
   - [ ] Reject a request → toast; request removed/updated.

4. **Loans**  
   - [ ] Member: Request Loan (amount) → appears as PENDING in My Loans.  
   - [ ] Admin: Approvals or Loans → Approve → status APPROVED.  
   - [ ] Admin: Disburse → status ACTIVE; Mpesa record and transaction created.  
   - [ ] Member: My Loans shows correct status and repayment progress.

5. **Contributions**  
   - [ ] Member: Mpesa → Contribution, amount, phone → STK push (or mock).  
   - [ ] Admin: Record Contribution (manual) → appears in Contributions list.  
   - [ ] Member: My Contributions shows entries.

6. **Mpesa**  
   - [ ] Member: Initiate payment (Contribution or Repayment) → PENDING; after callback/simulate → SUCCESS.  
   - [ ] Admin: Mpesa page shows list; Refresh works.  
   - [ ] (Dev) POST /api/mpesa/dev/simulate-callback with checkoutRequestId + resultCode 0 → payment and repayment/contribution updated.

7. **Analytics**  
   - [ ] Admin: Analytics page loads and shows charts.  
   - [ ] Member: Analytics page loads and shows member charts.

8. **Platform Admin (Super Admin)**  
   - [ ] Login as admin@chama.com (SUPER_ADMIN).  
   - [ ] **Platform Admin** button visible on Select Chama and Admin header → click → /super/dashboard.  
   - [ ] Super layout: Dashboard, Chamas, Users, Audit Log; Logout works.  
   - [ ] If user is not SUPER_ADMIN, Platform Admin button is hidden; visiting /super redirects to /unauthorized.

9. **Navigation and roles**  
   - [ ] Member: only member nav and routes.  
   - [ ] Admin/Chair: admin nav, Members, Settings, Join Requests, Loans, etc.  
   - [ ] No console errors on main flows; all main buttons work.

10. **Profile pictures and avatar dropdown**  
   - [ ] Login as admin (e.g. admin@chama.com) → header shows profile picture (or initials if no avatar).  
   - [ ] Click avatar → dropdown opens with Profile, Settings, Notifications, Help/About, Logout (and Chama settings when in a chama).  
   - [ ] Profile → shows avatar, name, email; upload new picture → header updates immediately.  
   - [ ] Settings → user-level settings; Chama settings remain under Admin → Chama Settings.  
   - [ ] Logout from dropdown → token/state cleared, redirect to /login.  
   - [ ] Refresh page → avatar still shows (avatarUrl from /auth/me).  
   - [ ] On mobile: avatar opens bottom-sheet menu; Profile, Settings, Logout accessible.

---

## Remaining routes (reference)

### Backend (API)

- **Auth**: POST /auth/register, /auth/login, /auth/google, GET /auth/me, /auth/forgot-password, /auth/reset-password  
- **Chamas**: POST /chamas, GET /chamas/my, /chamas/search, POST /chamas/join, GET /chamas/:id/context, GET/PATCH /chamas/:id/members, PATCH /chamas/:id/settings, GET/POST /chamas/:id/invites, GET/POST /chamas/:id/join-requests, PATCH approve/reject  
- **Loans**: POST /chamas/:id/loans/request, GET /chamas/:id/loans, /chamas/:id/my/loans, PATCH approve/reject, POST disburse  
- **Repayments**: POST /chamas/:id/loans/:loanId/repayments, GET /chamas/:id/my/repayments, GET /chamas/:id/repayments  
- **Contributions**: POST/GET /chamas/:id/contributions, GET /chamas/:id/my/contributions  
- **Mpesa**: POST /mpesa/:chamaId/stkpush, POST /mpesa/callback, POST /mpesa/dev/simulate-callback, GET /mpesa/:chamaId/mpesa, /mpesa/:chamaId/my/mpesa  
- **Analytics**: GET /chamas/:id/analytics/admin, GET /chamas/:id/analytics/member  
- **Invites**: GET /invites/preview, POST /invites/accept  
- **Super**: GET /super/chamas, /super/users, PATCH /super/users/:id/global-role, GET /super/audit  
- **Admin users**: POST /super/users, POST /chamas/:id/users  

### Frontend

- **Public**: /, /login, /register, /forgot-password, /reset-password, /accept-invite, /unauthorized  
- **Protected**: /select-chama, /join-chama; account: /profile, /settings, /help (→/about), /about  
- **Member**: /member/:chamaId/dashboard, contributions, loans, transactions, chama-health, mpesa, analytics, settings  
- **Admin**: /admin/:chamaId/dashboard, members, contributions, loans, transactions, mpesa, approvals, join-requests, reports, analytics, audit-log, settings  
- **Super**: /super (redirects to /super/dashboard), /super/dashboard, /super/chamas, /super/users, /super/audit  

---

## Demo logins (after seed)

Run `cd chama-backend && npx prisma db seed`. The seed prints demo logins; typical values:

| Role | Email | Password | Notes |
|------|--------|----------|--------|
| **Super Admin** | admin@chama.com | Admin123! | Platform Admin button → /super/dashboard |
| **Admin** | admin@chama.com | Admin123! | All chamas (ADMIN) |
| **Admin** | treasurer@chama.com | Treasurer123! | KRU001, NBO002 (TREASURER) |
| **Member** | member1@chama.com | Member123! | KRU001, NBO002 |
| **Member** | member2@chama.com | Member123! | KRU001, NBO002 |

Chama codes: KRU001, NBO002, MBS003, NKR004, ELD005, KSM006, THK007, MAL008, GAR009, KAK010.  
APPROVAL chamas (NBO002, NKR004, KSM006, MAL008, KAK010) have PENDING join requests for admins to approve.

---

## Removed files (dead code cleanup)

- **chama-frontend/src/pages/Dashboard.tsx** – Unused; app uses MemberDashboard and AdminDashboard from member/ and admin/ folders.  
- **chama-frontend/src/app/layout/AppLayout.tsx** – Unused; app uses MemberLayout and AdminLayout only.  

Mock data (`mockData.ts`) is still used by some dashboard widgets and Reports for chart placeholders; those pages can be wired to the analytics API in a follow-up.
