from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MediMatch API",
    description="An educational health companion backend for chronic illness medication and symptom tracking.",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")


@app.get("/", tags=["root"])
async def root():
    return {"message": "MediMatch backend root is available", "status": "ok"}
