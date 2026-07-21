from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, HTTPException, Header
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import User, Role
from app.auth import hash_password
from app.routers import auth_router, users_router, sites_router, attendance_router
from app.report_service import generate_and_email_monthly_report
from app.notifier import run_evening_checkout_reminder

# Initialize database schema components
Base.metadata.create_all(bind=engine)

def seed_default_admin():
    db = SessionLocal()
    try:
        exists = db.query(User).filter(User.role == Role.admin).first()
        if not exists:
            admin = User(
                name="Admin",
                username=settings.default_admin_username,
                hashed_password=hash_password(settings.default_admin_password),
                role=Role.admin,
                must_change_password=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()

seed_default_admin()

# 🏢 MAIN INITIALIZATION
app = FastAPI(title="SiteTrack API", version="0.1.0")

# ⚡ THE ACCURATE LIST MATRIX
# Specifying your exact environments allows credentials to pass to the DB securely
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://172.20.10.2:5173",  
    "https://cute-scone-0e71cf.netlify.app",
    "https://sitetrack-app.netlify.app", # <--- ADD THIS ONE!
    "https://site-track-app.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Routers smoothly to the master instance
app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(sites_router.router)
app.include_router(attendance_router.router)
# --- NEW SECURE WEBHOOK ROUTE ---
@app.get("/api/admin/trigger-monthly-report")
def trigger_report(authorization: str = Header(None)):
    # 1. Verify the secret token from the external cron job
    if authorization != f"Bearer {settings.cron_secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    # 2. Open DB and run the report logic
    db = SessionLocal()
    try:
        generate_and_email_monthly_report(db)
        return {"status": "success", "message": "Monthly report triggered and sent!"}
    finally:
        db.close()
@app.get("/health")
def health():
    return {"status": "ok"}
# --- EVENING CHECKOUT REMINDER ROUTE ---

# --- EVENING CHECKOUT REMINDER ROUTE ---
@app.get("/api/admin/trigger-evening-reminder")
def trigger_evening_reminder(authorization: str = Header(None)):
    # 1. Verify secret token
    if authorization != f"Bearer {settings.cron_secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    # 2. Open DB and run reminder
    db = SessionLocal()
    try:
        count = run_evening_checkout_reminder(db)
        # Keep response tiny so cron-job.org doesn't complain about output size
        return {"ok": True, "sent": count}
    finally:
        db.close()
