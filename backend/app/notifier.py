import os
import logging
from datetime import datetime
from zoneinfo import ZoneInfo
import firebase_admin
from firebase_admin import credentials, messaging
from sqlalchemy.orm import Session
from app.models import User, AttendanceRecord, AttendanceType

logger = logging.getLogger(__name__)

# Initialize the Firebase Admin SDK using the secret file uploaded to Render
def init_firebase():
    if not firebase_admin._apps:
        try:
            cred_path = "/etc/secrets/firebase-credentials.json"
            if not os.path.exists(cred_path):
                cred_path = "firebase-credentials.json"
            
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin: {e}")

init_firebase()

def send_push_notification(token: str, title: str, body: str):
    """Sends a single push notification to a specific device."""
    if not token:
        return False
        
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=token,
    )
    
    try:
        response = messaging.send(message)
        logger.info(f"Successfully sent message: {response}")
        return True
    except Exception as e:
        logger.error(f"Error sending message to {token}: {e}")
        return False

def run_evening_checkout_reminder(db: Session):
    """Finds everyone still checked in today and sends them a reminder."""
    tz_kolkata = ZoneInfo("Asia/Kolkata")
    today = datetime.now(tz_kolkata).date()
    
    # 1. Fetch all workers with an FCM token registered
    workers = db.query(User).filter(User.fcm_token.isnot(None)).all()
    
    count = 0
    for worker in workers:
        # Fetch today's attendance records for this worker
        recs = (
            db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.user_id == worker.id,
                AttendanceRecord.record_date == today
            )
            .order_by(AttendanceRecord.timestamp.asc())
            .all()
        )
        
        has_in = any(r.type == AttendanceType.check_in for r in recs)
        has_out = any(r.type == AttendanceType.check_out for r in recs)
        
        # If they checked in but haven't checked out yet
        if has_in and not has_out:
            first_name = worker.name.split(" ")[0] if worker.name else "Worker"
            success = send_push_notification(
                token=worker.fcm_token,
                title="Shift Reminder ⏰",
                body=f"Hey {first_name}, you are still checked in! Don't forget to mark your attendance out."
            )
            if success:
                count += 1
                
    logger.info(f"Evening reminder job complete. Sent {count} notifications.")
    return count
