"""Middleware for wallet-based auth and rate limiting."""
import time
import re
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

# ── Address validation ──────────────────────────────────────
ETH_ADDRESS_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")

def is_valid_address(addr: str) -> bool:
    """Check if a string is a valid Ethereum-style hex address."""
    return bool(ETH_ADDRESS_RE.match(addr))


# ── Rate limiter ────────────────────────────────────────────
class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple sliding-window rate limiter.
    Limits each IP to `max_requests` per `window_seconds`.
    In serverless (Vercel), the window resets on cold starts,
    but still prevents burst abuse within a single instance.
    """

    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        cutoff = now - self.window_seconds

        # Prune old entries
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if t > cutoff
        ]

        if len(self.requests[client_ip]) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail="rate limit exceeded — try again later",
            )

        self.requests[client_ip].append(now)
        return await call_next(request)


# ── Wallet auth ─────────────────────────────────────────────
# Mutating endpoints require X-Wallet-Address header.
# We verify the caller owns the resource they're modifying.

PROTECTED_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
PUBLIC_PATHS = {"/health", "/api/health", "/api/invoices"}  # GET invoices is public

class WalletAuthMiddleware(BaseHTTPMiddleware):
    """
    Requires X-Wallet-Address header on mutating requests.
    Validates the header is a proper Ethereum address.
    Individual route handlers check ownership against this value.
    """

    async def dispatch(self, request: Request, call_next):
        # Only protect mutating methods
        if request.method in PROTECTED_METHODS:
            wallet = request.headers.get("x-wallet-address", "")
            if not wallet:
                raise HTTPException(
                    status_code=401,
                    detail="X-Wallet-Address header required",
                )
            if not is_valid_address(wallet):
                raise HTTPException(
                    status_code=400,
                    detail="invalid wallet address format",
                )
            # Store for route handlers to use
            request.state.wallet = wallet.lower()
        else:
            request.state.wallet = None

        return await call_next(request)
