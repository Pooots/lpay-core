# LPay frontend (`lpay-core`)

React + Vite UI for LPay. Foundation mirrors Chog (`chog-core`).

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000 — the home page shows frontend status and polls `/api/health` via the Vite proxy (`VITE_APP_URL` → Laravel).
