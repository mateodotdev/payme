from typing import Optional
from pydantic import BaseModel


class CreateInvoiceRequest(BaseModel):
    merchantAddress: str
    customerEmail: Optional[str] = ""
    amount: float
    tokenAddress: str
    memo: Optional[str] = ""


class MarkPaidRequest(BaseModel):
    txHash: Optional[str] = ""
    payerAddress: Optional[str] = ""


class CreateContactRequest(BaseModel):
    ownerWallet: str
    name: str
    walletAddress: str
    email: Optional[str] = ""
