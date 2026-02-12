import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException

from config import FRONTEND_BASE_URL, TEMPO_CHAIN_ID, TEMPO_RPC_URL
from database import get_db, row_to_dict, get_placeholder, DATABASE_URL
from models import CreateInvoiceRequest, MarkPaidRequest, CreateContactRequest
import psycopg2.extras

router = APIRouter(prefix="/api")


def get_cursor(conn):
    if DATABASE_URL:
        return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    return conn.cursor()


@router.post("/invoices", status_code=201)
def create_invoice(req: CreateInvoiceRequest):
    inv_id = str(uuid.uuid4())
    memo = req.memo or f"INV-{inv_id[:8]}"
    payment_link = f"{FRONTEND_BASE_URL}/?invoiceId={inv_id}"
    now = datetime.utcnow().isoformat() + "Z"
    p = get_placeholder()

    with get_db() as conn:
        cursor = get_cursor(conn)
        cursor.execute(
            f"""INSERT INTO invoices 
               (id, merchant_address, customer_email, amount, token_address, memo, status, created_at, payment_link, tempo_chain_id, tempo_rpc)
               VALUES ({p}, {p}, {p}, {p}, {p}, {p}, 'PENDING', {p}, {p}, {p}, {p})""",
            (inv_id, req.merchantAddress, req.customerEmail, str(req.amount), req.tokenAddress, memo, now, payment_link, TEMPO_CHAIN_ID, TEMPO_RPC_URL),
        )
        conn.commit()
        cursor.execute(f"SELECT * FROM invoices WHERE id = {p}", (inv_id,))
        row = cursor.fetchone()

    return row_to_dict(row)


@router.get("/invoices")
def list_invoices(wallet: str = ""):
    p = get_placeholder()
    with get_db() as conn:
        cursor = get_cursor(conn)
        if wallet:
            cursor.execute(
                f"SELECT * FROM invoices WHERE LOWER(merchant_address) = LOWER({p}) OR LOWER(payer_address) = LOWER({p}) ORDER BY created_at DESC",
                (wallet, wallet),
            )
        else:
            cursor.execute("SELECT * FROM invoices ORDER BY created_at DESC")
        rows = cursor.fetchall()
    return [row_to_dict(r) for r in rows]


@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: str):
    p = get_placeholder()
    with get_db() as conn:
        cursor = get_cursor(conn)
        cursor.execute(f"SELECT * FROM invoices WHERE id = {p}", (invoice_id,))
        row = cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="invoice not found")
    return row_to_dict(row)


@router.delete("/invoices/{invoice_id}", status_code=204)
def delete_invoice(invoice_id: str):
    p = get_placeholder()
    with get_db() as conn:
        cursor = get_cursor(conn)
        cursor.execute(f"DELETE FROM invoices WHERE id = {p}", (invoice_id,))
        conn.commit()
    return None


@router.post("/invoices/{invoice_id}/pay")
def mark_paid(invoice_id: str, req: MarkPaidRequest):
    now = datetime.utcnow().isoformat() + "Z"
    p = get_placeholder()
    with get_db() as conn:
        cursor = get_cursor(conn)
        cursor.execute(
            f"UPDATE invoices SET status = 'PAID', paid_at = {p}, tempo_tx_hash = {p}, payer_address = {p} WHERE id = {p}",
            (now, req.txHash, req.payerAddress, invoice_id),
        )
        conn.commit()
        cursor.execute(f"SELECT * FROM invoices WHERE id = {p}", (invoice_id,))
        row = cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="invoice not found")
    return row_to_dict(row)


# ── contacts ──────────────────────────────────────────────

@router.get("/contacts")
def list_contacts(wallet: str = ""):
    p = get_placeholder()
    with get_db() as conn:
        cursor = get_cursor(conn)
        if wallet:
            cursor.execute(
                f"SELECT * FROM contacts WHERE LOWER(owner_wallet) = LOWER({p})",
                (wallet,),
            )
        else:
            cursor.execute("SELECT * FROM contacts")
        rows = cursor.fetchall()
    return [
        {
            "id": r["id"],
            "ownerWallet": r["owner_wallet"],
            "name": r["name"],
            "address": r["wallet_address"],
            "email": r["email"] or "",
        }
        for r in rows
    ]


@router.post("/contacts", status_code=201)
def create_contact(req: CreateContactRequest):
    contact_id = str(uuid.uuid4())
    p = get_placeholder()
    with get_db() as conn:
        cursor = get_cursor(conn)
        cursor.execute(
            f"INSERT INTO contacts (id, owner_wallet, name, wallet_address, email) VALUES ({p}, {p}, {p}, {p}, {p})",
            (contact_id, req.ownerWallet, req.name, req.walletAddress, req.email),
        )
        conn.commit()
        cursor.execute(f"SELECT * FROM contacts WHERE id = {p}", (contact_id,))
        row = cursor.fetchone()
    return {
        "id": row["id"],
        "ownerWallet": row["owner_wallet"],
        "name": row["name"],
        "address": row["wallet_address"],
        "email": row["email"] or "",
    }


@router.delete("/contacts/{contact_id}", status_code=204)
def delete_contact(contact_id: str):
    p = get_placeholder()
    with get_db() as conn:
        cursor = get_cursor(conn)
        cursor.execute(f"DELETE FROM contacts WHERE id = {p}", (contact_id,))
        conn.commit()
    return None

