import os
import firebase_admin
from firebase_admin import credentials, messaging
from sqlalchemy.orm import Session
from .models import User
import datetime
import logging

logger = logging.getLogger(__name__)

# Initialize the Firebase Admin SDK using the secret file you uploaded to Render
def init_firebase():
    if not firebase_admin._apps:
        try:
            # We look for the file exactly where Render stores "Secret Files"
            cred_path = "/etc/secrets/firebase-credentials.json"
            if not os.path.exists(cred_path):
                # Fallback for local development if you have it in your root folder
                cred_path = "firebase-credentials.json"
            
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin: {e}")

# Call it immediately when this file is imported
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
    """Finds everyone still checked in and sends them a reminder."""
    # Find all users who are currently checked in and HAVE an fcm_token
    active_workers = db.query(User).filter(
        User.status == "checked_in",
        User.fcm_token.isnot(None)
    ).all()
    
    count = 0
    for worker in active_workers:
        success = send_push_notification(
            token=worker.fcm_token,
            title="Shift Reminder \u23f0", # Clock emoji
            body=f"Hey {worker.name.split(' ')[0]}, you are still checked in! Don't forget to mark your attendance out."
        )
        if success:
            count += 1
            
    logger.info(f"Evening reminder job complete. Sent {count} notifications.")
    return count
