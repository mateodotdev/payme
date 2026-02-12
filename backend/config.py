import os
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DB_PATH", "payme.db")
DATABASE_URL = os.getenv("DATABASE_URL") # Supabase connection string
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
TEMPO_CHAIN_ID = os.getenv("TEMPO_CHAIN_ID", "42431")
TEMPO_RPC_URL = os.getenv("TEMPO_RPC_URL", "https://rpc.moderato.tempo.xyz")
PORT = int(os.getenv("PORT", "8080"))
