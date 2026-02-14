# payme 💸

> send money to anyone on tempo — no wallet address needed.

**payme** is a peer-to-peer payment app built on the **Tempo testnet**. it solves a real problem: sending crypto to someone shouldn't require copying a 42-character hex string. with payme, you can look up a friend by email or phone, generate a shareable payment link, or blast payments to multiple people at once.

we built this for the **Canteen x Tempo Hackathon 2026**.

## the problem

sending crypto today sucks for normal people. you need to:
- ask someone for their wallet address
- copy-paste a long hex string and pray you didn't miss a character
- send one transaction at a time, waiting for each to confirm
- pay gas fees even when someone owes *you*

## what payme does

- **send to email or phone** — look up contacts by email/phone number. if they're in your address book, it resolves to their wallet. if not, it generates a shareable payment link they can open in any browser.
- **payment links + QR codes** — create an invoice, share the link or scan the QR. the payer connects their wallet and pays in one tap.
- **multi-send** — pay multiple people at once. each transfer fires in parallel, with per-recipient status tracking (✓ confirmed, ✗ failed).
- **batch send** — bundle multiple transfers into a single atomic transaction using Multicall3. all succeed or all fail. if Multicall3 isn't deployed, it gracefully falls back to parallel sends.
- **address book** — save contacts with name, wallet, email, and phone. quick-select from your contacts when creating invoices.
- **memos** — add a note to any payment. quick-tap emoji shortcuts (🍕 dinner, ☕ coffee, 🏠 rent) for common use cases.

## security

this isn't a toy demo. we added real security patterns:

- **wallet auth** — every mutating API call requires your wallet address in the `X-Wallet-Address` header. the backend validates it's a real ethereum-format address.
- **ownership checks** — you can only delete your own invoices and contacts. trying to delete someone else's returns a 403.
- **rate limiting** — 60 requests per minute per IP. prevents spam and abuse.
- **input sanitization** — all wallet addresses are validated client-side (with live UI feedback) and server-side before any database or blockchain interaction.
- **transaction simulation** — transfers are simulated before sending to catch reverts early.

## tech stack

| layer | tech |
|-------|------|
| **frontend** | react 19, vite, typescript, rainbowkit, wagmi, viem |
| **backend** | python 3, fastapi, pydantic |
| **database** | sqlite (local), postgresql/supabase (production) |
| **chain** | tempo testnet — moderato (chain id `42431`) |
| **deploy** | vercel (frontend static + python serverless) |

## running locally

**backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
# → http://localhost:8080
```

**frontend:**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## project layout

```
backend/
  main.py          # fastapi app + middleware wiring
  routes.py        # invoice + contact CRUD with auth
  middleware.py     # rate limiter + wallet auth
  database.py      # sqlite/postgres with auto-migrations
  models.py        # pydantic request validation
  config.py        # env vars

frontend/src/
  App.tsx           # main app shell + routing
  api.ts            # shared axios auth + address validation
  components/
    InvoiceForm.tsx     # create invoices (wallet/email/phone)
    PaymentPage.tsx     # pay an invoice on-chain
    InvoiceHistory.tsx  # view + search past invoices
    Contacts.tsx        # address book management
    MultiSend.tsx       # parallel multi-recipient transfers
    BatchSend.tsx       # atomic batch via multicall3
    Receipt.tsx         # post-payment confirmation
```

## api

| method | endpoint | auth | description |
|--------|----------|------|-------------|
| `POST` | `/api/invoices` | ✅ | create a new invoice |
| `GET` | `/api/invoices` | — | list invoices (filter by wallet) |
| `GET` | `/api/invoices/:id` | — | get invoice details |
| `DELETE` | `/api/invoices/:id` | ✅ | delete invoice (owner only) |
| `POST` | `/api/invoices/:id/pay` | ✅ | mark invoice as paid |
| `GET` | `/api/contacts` | — | list contacts |
| `GET` | `/api/contacts/lookup` | — | find contact by email/phone |
| `POST` | `/api/contacts` | ✅ | add a contact |
| `DELETE` | `/api/contacts/:id` | ✅ | delete contact (owner only) |

## env vars

create `backend/.env`:
```env
DB_PATH=payme.db
FRONTEND_BASE_URL=http://localhost:5173
TEMPO_CHAIN_ID=42431
TEMPO_RPC_URL=https://rpc.moderato.tempo.xyz
PORT=8080
# for production:
# DATABASE_URL=postgresql://...
```

---

built for the **canteen x tempo hackathon 2026** by **MATEOINRL** ✌️
