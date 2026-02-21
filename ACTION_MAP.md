# UI Action Map – Buttons → API Endpoints

Internal dev reference. Every button must call the listed endpoint and update UI (loading, toast, refresh).

---

## Auth
| Button / Action | Endpoint | Notes |
|-----------------|----------|--------|
| Login (email/password) | POST /api/auth/login | body: { email, password }; store token, redirect /select-chama |
| Register | POST /api/auth/register | body: { fullName, email, password, phone? } |
| Google Login | POST /api/auth/google | body: { idToken }; store token, redirect |
| Logout | (client) | clear token + chama id, redirect /login |
| Get current user | GET /api/auth/me | used by auth store / refresh memberships |

---

## Chamas
| Button / Action | Endpoint | Notes |
|-----------------|----------|--------|
| Create Chama | POST /api/chamas | body: { name, description?, joinMode?, isPublic? }; returns chama + joinCode |
| My Chamas | GET /api/chamas/my | list memberships with chama info |
| Search chamas | GET /api/chamas/search?q= | discoverable chamas |
| Join Chama (code) | POST /api/chamas/join | body: { chamaCode, joinCode? }; OPEN=immediate join, APPROVAL=join request |
| Request to Join (by id) | POST /api/chamas/:chamaId/join-requests | auth only; 409 if already member/pending |
| My join request | GET /api/chamas/:chamaId/my/join-request | single request or null |
| My join requests (all) | GET /api/chamas/my/join-requests | list for current user |
| Chama context | GET /api/chamas/:chamaId/context | membership required; settings for sidebar |

---

## Join Requests (Admin)
| Button / Action | Endpoint | Notes |
|-----------------|----------|--------|
| List join requests | GET /api/chamas/:chamaId/join-requests | ADMIN/CHAIR; ?status=PENDING |
| Approve | PATCH /api/chamas/:chamaId/join-requests/:requestId/approve | creates membership |
| Reject | PATCH /api/chamas/:chamaId/join-requests/:requestId/reject | |

---

## Loans
| Button / Action | Endpoint | Notes |
|-----------------|----------|--------|
| Request Loan (member) | POST /api/chamas/:chamaId/loans/request | body: { principal, dueDate? } |
| My Loans | GET /api/chamas/:chamaId/my/loans | paginated |
| List Loans (admin) | GET /api/chamas/:chamaId/loans | ADMIN/TREASURER/CHAIR/AUDITOR; ?status= & userId= |
| Approve Loan | PATCH /api/chamas/:chamaId/loans/:loanId/approve | body: { dueDate? }; status → APPROVED |
| Reject Loan | PATCH /api/chamas/:chamaId/loans/:loanId/reject | status → REJECTED |
| Disburse Loan | POST /api/chamas/:chamaId/loans/:loanId/disburse | ADMIN/TREASURER; body: { phone? }; status → ACTIVE, creates mpesa + transaction |

---

## Repayments
| Button / Action | Endpoint | Notes |
|-----------------|----------|--------|
| Create Repayment | POST /api/chamas/:chamaId/loans/:loanId/repayments | body: { amount, method, reference?, paidAt? } |
| My Repayments | GET /api/chamas/:chamaId/my/repayments | |
| List Repayments (admin) | GET /api/chamas/:chamaId/repayments | |

---

## Contributions
| Button / Action | Endpoint | Notes |
|-----------------|----------|--------|
| Create Contribution | POST /api/chamas/:chamaId/contributions | body: { amount, method, reference?, paidAt? } |
| My Contributions | GET /api/chamas/:chamaId/my/contributions | |
| List Contributions (admin) | GET /api/chamas/:chamaId/contributions | |

---

## Mpesa
| Button / Action | Endpoint | Notes |
|-----------------|----------|--------|
| STK Push | POST /api/mpesa/:chamaId/stkpush | body: { purpose: CONTRIBUTION\|REPAYMENT, amount, phone, loanId? } |
| My Mpesa payments | GET /api/mpesa/:chamaId/my/mpesa | |
| Admin Mpesa list | GET /api/mpesa/:chamaId/mpesa | ADMIN/TREASURER/CHAIR/AUDITOR |
| Simulate callback (dev) | POST /api/mpesa/dev/simulate-callback | NODE_ENV !== production; body: { checkoutRequestId, resultCode, mpesaReceiptNo?, amount? } |

---

## Members & Invites
| Button / Action | Endpoint | Notes |
|-----------------|----------|--------|
| List Members | GET /api/chamas/:chamaId/members | ADMIN/TREASURER/CHAIR |
| Change Role | PATCH /api/chamas/:chamaId/members/:userId/role | body: { role }; ADMIN/CHAIR |
| Invite Member | POST /api/chamas/:chamaId/invites | body: { email, role? }; ADMIN/CHAIR |
| List Invites | GET /api/chamas/:chamaId/invites | |
| Accept Invite | POST /api/invites/accept | body: { token }; from email link |

---

## Settings
| Button / Action | Endpoint | Notes |
|-----------------|----------|--------|
| Update Chama Settings | PATCH /api/chamas/:chamaId/settings | body: { contributionAmount?, cycleDay?, loanInterestRate?, penaltyRate? }; ADMIN/CHAIR |
| Get Chama (for settings form) | GET /api/chamas/:chamaId/context | already returns chama settings |

---

## Super Admin
| Button / Action | Endpoint | Notes |
|-----------------|----------|--------|
| List Chamas | GET /api/super/chamas | |
| List Users | GET /api/super/users | |
| Update User Global Role | PATCH /api/super/users/:userId/global-role | |
| Platform Audit | GET /api/super/audit | |

---

## Response shape
- Success: `{ success: true, data: ... }`
- Error: `{ success: false, message: "...", errors?: ... }` with 4xx/5xx status.
