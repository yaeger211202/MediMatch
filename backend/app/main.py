from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import initialize_database
from .routes import router

initialize_database()

app = FastAPI(
    title="MediMatch API",
    description="An educational health companion backend for chronic illness medication and symptom tracking.",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")


@app.get("/", tags=["root"])
async def root():
    return {"message": "MediMatch backend root is available", "status": "ok"}
