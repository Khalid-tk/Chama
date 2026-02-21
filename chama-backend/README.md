# Chama Backend API

Node.js/Express API with Prisma, JWT auth, and M-Pesa Daraja STK Push integration.

## Setup

```bash
cp .env.example .env
# Edit .env (DATABASE_URL, JWT_SECRET, etc.)
npm install
npx prisma migrate dev
npm run dev
```

API base: `http://localhost:5000/api`

---

## M-Pesa Daraja (STK Push + Callback)

### Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/mpesa/callback` | Public | Safaricom callback (Daraja calls this) |
| POST | `/api/mpesa/:chamaId/stkpush` | Auth + membership | Initiate STK push |
| GET | `/api/mpesa/:chamaId/my/mpesa` | Auth + membership | Member: my M-Pesa payments |
| GET | `/api/mpesa/:chamaId/mpesa` | Auth + role (Admin/Treasurer/Chair/Auditor) | Admin: all M-Pesa payments |
| POST | `/api/mpesa/dev/simulate-callback` | None (DEV only) | Simulate callback for testing |

### STK Push body

`POST /api/mpesa/:chamaId/stkpush` body:

```json
{
  "purpose": "CONTRIBUTION",
  "amount": 100,
  "phone": "254712345678",
  "loanId": "optional-uuid-for-REPAYMENT"
}
```

- `purpose`: `"CONTRIBUTION"` or `"REPAYMENT"`
- For `REPAYMENT`, `loanId` is required.

### Callback URL (required for live STK Push)

Safaricom must reach your server. In development use **ngrok**:

1. **Run ngrok** (in a separate terminal):
   ```bash
   ngrok http 5000
   ```
2. Copy the HTTPS URL (e.g. `https://abc123.ngrok.io`).
3. **Set callback URL** in `.env` to the **full path**:
   ```env
   MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/mpesa/callback
   ```
   The path must end with `/api/mpesa/callback`.
4. Restart the backend so it picks up the new `MPESA_CALLBACK_URL`.

### Testing with Postman

1. **Trigger STK push**
   - `POST {{baseUrl}}/api/mpesa/{{chamaId}}/stkpush`
   - Headers: `Authorization: Bearer <token>`
   - Body (JSON): `purpose`, `amount`, `phone`, optional `loanId`
   - From the response, copy `data.payment.checkoutRequestId` (or `data.safaricom.CheckoutRequestID`).

2. **If callback is not received quickly** (e.g. no phone to complete payment, or testing offline):
   - Call the **DEV-only simulate endpoint**:
   - `POST {{baseUrl}}/api/mpesa/dev/simulate-callback`
   - Body (JSON):
     ```json
     {
       "checkoutRequestId": "<paste CheckoutRequestID from step 1>",
       "resultCode": 0,
       "mpesaReceiptNo": "DEV123456"
     }
     ```
   - `resultCode`: `0` = success, `1` (or any other) = failed.
   - This runs the same logic as the real callback (e.g. creates Contribution or Repayment on success).

**Note:** `POST /api/mpesa/dev/simulate-callback` is only available when `NODE_ENV !== "production"` (returns 404 in production).

### Env vars

See `.env.example`. Required for real Daraja STK push:

- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`, `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL` (full URL including `/api/mpesa/callback`)
- `MPESA_ENV=sandbox` (or `production`)

If credentials are missing, STK push returns a mock response so the app does not break.
