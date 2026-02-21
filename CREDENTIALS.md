# Demo credentials

Use these after running the backend seed: `cd chama-backend && npx prisma db seed`.

---

## Member in one Sacco (Kisumu United Sacco – KRU001)

| Field    | Value            |
|---------|------------------|
| **Email**   | `member1@chama.com` |
| **Password**| `Member123!`       |
| **Chama**   | Kisumu United Sacco (KRU001) |
| **Role**    | Member |

This user is also a member of **Nairobi Boda Sacco (NBO002)**. After login, choose **Kisumu United Sacco** to use the member dashboard for that Sacco.

---

## Other demo logins (from seed)

- **Super Admin** (platform admin): `admin@chama.com` / `Admin123!`
- **Admin / Treasurer**: `treasurer@chama.com` / `Treasurer123!` (KRU001, NBO002)
- **Second member**: `member2@chama.com` / `Member123!` (KRU001, NBO002)
- **Seeded members** (90 users): pattern `firstname.lastnameNN@chama.co.ke` — password **`Member123!`** (exact emails are printed when you run `npx prisma db seed`).

---

## Chama codes (Saccos)

KRU001, NBO002, MBS003, NKR004, ELD005, KSM006, THK007, MAL008, GAR009, KAK010.
