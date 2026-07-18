import pandas as pd
import resend
import base64
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# --- FIXED IMPORTS & MODEL NAMES ---
from app.models import User, AttendanceRecord, Site 
from app.config import settings

# Pull the API key securely from your env
resend.api_key = settings.resend_api_key

def generate_and_email_monthly_report(db: Session):
    print("Generating monthly attendance spreadsheet...")
    
    # 1. Calculate date range (Last 30 days)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    # 2. Query attendance data using AttendanceRecord
    logs = db.query(AttendanceRecord, User, Site).join(
        User, AttendanceRecord.user_id == User.id
    ).join(
        Site, AttendanceRecord.site_id == Site.id
    ).filter(
        AttendanceRecord.timestamp >= start_date,
        AttendanceRecord.timestamp <= end_date
    ).all()
    
    if not logs:
        print("No attendance data for this month. Skipping report.")
        return

    # 3. Format data for the spreadsheet
    report_data = []
    for attendance, user, site in logs:
        # Extract the enum value if 'type' is stored as an Enum
        action_type = attendance.type.value if hasattr(attendance.type, 'value') else attendance.type
        
        report_data.append({
            "Date": attendance.timestamp.strftime("%Y-%m-%d"),
            "Time": attendance.timestamp.strftime("%H:%M:%S"),
            "Worker Name": user.name,
            "Worker Username": user.username,
            "Job Site": site.name,
            "Action": action_type, 
            "Distance from Center (m)": getattr(attendance, 'distance_m', 'N/A') # Fixed to distance_m
        })
        
    # 4. Generate Spreadsheet (CSV)
    df = pd.DataFrame(report_data)
    csv_string = df.to_csv(index=False)
    
    # 5. Base64 Encode the file for email attachment
    b64_content = base64.b64encode(csv_string.encode('utf-8')).decode('utf-8')
    
    # 6. Dispatch the Email via Resend
    month_name = start_date.strftime("%B %Y")
    
    params = {
        "from": "SiteTrack Reports <onboarding@resend.dev>",
        "to": ["aswin.kss2005@gmail.com"], 
        "subject": f"AA&S Constructions - Monthly Attendance Report ({month_name})",
        "html": f"<h3>Monthly SiteTrack Report</h3><p>Attached is the automated worker attendance spreadsheet for {month_name}.</p>",
        "attachments": [
            {
                "filename": f"Attendance_Report_{month_name}.csv",
                "content": b64_content
            }
        ]
    }
    
    try:
        email_response = resend.Emails.send(params)
        print(f"Monthly report emailed successfully! ID: {email_response.get('id')}")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
