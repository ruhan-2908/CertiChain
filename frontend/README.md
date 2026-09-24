# CertiChain — Frontend

Owner: 1 person. Stack: **React + TypeScript + Vite, Tailwind CSS + shadcn/ui**.

## Setup

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init
npm run dev
```

Dev server runs on `http://localhost:5173` by default — the backend's CORS
config already allows requests from this origin, no changes needed there.

## What to build

### 1. Public Verification Page (no login — this is the most important page)
- Input for Certificate ID, plus a "scan QR" option (QR just encodes a URL to
  this page with the ID pre-filled, e.g. `/verify/CERT-1234`)
- Optional: let the user upload a PDF to check its hash against the
  registered one
- Clearly show one of four states: **AUTHENTIC / TAMPERED / REVOKED / NOT
  FOUND** — make these visually distinct (color-coded), this is the payoff
  moment of the whole demo

### 2. Admin Dashboard (requires login, `ADMIN` role)
- Login form (calls `/api/auth/login`)
- Form to issue a new certificate (student details + certificate details)
- Table of issued certificates with a revoke action
- View of verification/audit logs

### 3. Student View (requires login, `STUDENT` role)
- List of the student's own certificates
- Download PDF button for each

## Talk to the backend

- All endpoints and exact request/response JSON are in `../docs/api-contract.md`.
- Auth: on login you get back a JWT (`token` field). Store it (e.g. in memory
  or a secure cookie — avoid localStorage if you can, but for a college demo
  it's an acceptable simplification) and send it as
  `Authorization: Bearer <token>` on every protected request.
- The `/api/auth/register`, `/api/auth/login`, and `/api/verify/**` type
  routes work without a token. Everything else needs one.

## Don't wait on backend to be fully done

Backend Person A/B are building in parallel. Build your UI against the
documented API contract with mock/hardcoded data first, then swap in real
`fetch`/`axios` calls once an endpoint is live. Ping the backend team in the
group chat when you're blocked on a specific endpoint.
