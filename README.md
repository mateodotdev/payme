# payme — p2p payments on tempo

**payme** is an on-chain peer-to-peer payment app built on the **Tempo testnet**. send payment requests, share QR codes, and settle instantly using native stablecoins.

## stack

| layer | tech |
|-------|------|
| **frontend** | react 19, vite, typescript, rainbowkit, wagmi |
| **backend** | python, fastapi, sqlite |
| **chain** | tempo testnet (moderato, chain id 42431) |

## quick start

### 1. backend

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```

the api server starts on `http://localhost:8080`.

### 2. frontend

```bash
cd frontend
npm install
npm run dev
```

opens on `http://localhost:5173`.

## project structure

```
backend/
  config.py        # env vars via .env
  database.py      # sqlite connection + schema
  models.py        # pydantic request models
  routes.py        # fastapi invoice endpoints
  main.py          # app entry point
  .env             # environment config

frontend/
  src/
    App.tsx         # main app with rainbowkit
    main.tsx        # providers (wagmi, rainbowkit, react-query)
    index.css       # black/white/blue design system
    components/
      InvoiceForm.tsx
      InvoiceHistory.tsx
      PaymentPage.tsx
      Contacts.tsx
```

## api endpoints

| method | path | description |
|--------|------|-------------|
| `GET` | `/health` | health check |
| `POST` | `/api/invoices` | create invoice |
| `GET` | `/api/invoices` | list all invoices |
| `GET` | `/api/invoices/:id` | get single invoice |
| `DELETE` | `/api/invoices/:id` | delete invoice |
| `POST` | `/api/invoices/:id/pay` | mark invoice as paid |

## environment variables

defined in `backend/.env`:

```env
DB_PATH=payme.db
FRONTEND_BASE_URL=http://localhost:5173
TEMPO_CHAIN_ID=42431
TEMPO_RPC_URL=https://rpc.moderato.tempo.xyz
PORT=8080
```

---

built for the canteen tempo hackathon 2026 by **MATEOINRL**.
