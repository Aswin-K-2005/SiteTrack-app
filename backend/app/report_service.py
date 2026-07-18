import pandas as pd
import resend
import base64
from datetime import datetime, timedelta, date
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session

from app.models import User, AttendanceRecord, Role 
from app.config import settings

# Pull the API key securely from your env
resend.api_key = settings.resend_api_key

def generate_and_email_monthly_report(db: Session):
    print("Generating monthly payroll summary spreadsheet...")
    
    # 1. Date Range: 1st of the current month to Today (in IST)
    tz_kolkata = ZoneInfo("Asia/Kolkata")
    today = datetime.now(tz_kolkata).date()
    start_date = today.replace(day=1) # The 1st of the current month
    
    # Generate a list of all dates from the 1st to today
    delta = today - start_date
    all_dates = [start_date + timedelta(days=i) for i in range(delta.days + 1)]
    
    # 2. Get ALL workers (so we don't miss anyone who was absent all month)
    workers = db.query(User).filter(User.role == Role.worker).all()
    
    if not workers:
        print("No workers found. Skipping report.")
        return

    # 3. Get all attendance records for this month
    attendances = db.query(AttendanceRecord).filter(
        AttendanceRecord.record_date >= start_date,
        AttendanceRecord.record_date <= today
    ).all()
    
    # Create a fast lookup set of (user_id, date) who showed up
    # Using a set handles multiple check-ins automatically (they just count as 1 Present)
    presence_map = set((a.user_id, a.record_date) for a in attendances)
    
    # 4. Build the Payroll Grid
    report_data = []
    for w in workers:
        row = {
            "Worker Name": w.name,
            "Username": w.username,
        }
        
        present_count = 0
        absent_count = 0
        
        # Check every day of the month so far
        for d in all_dates:
            date_label = d.strftime("%d %b") # Format like "01 Jul", "02 Jul"
            if (w.id, d) in presence_map:
                row[date_label] = "P"  # Present
                present_count += 1
            else:
                row[date_label] = "A"  # Absent
                absent_count += 1
        
        # Add the totals at the end of the row for easy salary calculation
        row["Total Present"] = present_count
        row["Total Leaves (Absent)"] = absent_count
        
        report_data.append(row)
        
    # 5. Generate Spreadsheet (CSV)
    df = pd.DataFrame(report_data)
    csv_string = df.to_csv(index=False)
    
    # 6. Base64 Encode the file for email attachment
    b64_content = base64.b64encode(csv_string.encode('utf-8')).decode('utf-8')
    
    # 7. Dispatch the Email via Resend
    month_name = start_date.strftime("%B %Y")
    
    params = {
        "from": "SiteTrack Reports <onboarding@resend.dev>",
        "to": ["aswin.kss2005@gmail.com"], 
        "subject": f"AA&S Constructions - Payroll & Leave Summary ({month_name})",
        "html": f"<h3>Monthly Payroll & Leave Summary</h3><p>Attached is the daily attendance breakdown and leave calculation for {month_name}, up to {today.strftime('%d %b')}.</p>",
        "attachments": [
            {
                "filename": f"Payroll_Summary_{month_name}.csv",
                "content": b64_content
            }
        ]
    }
    
    try:
        email_response = resend.Emails.send(params)
        print(f"Monthly report emailed successfully! ID: {email_response.get('id')}")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
