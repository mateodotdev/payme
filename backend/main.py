from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import PORT
from database import init_db
from routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # initialize database on startup
    init_db()
    yield

app = FastAPI(title="payme", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    print(f"server listening on :{PORT}")
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
