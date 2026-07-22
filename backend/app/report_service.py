import pandas as pd
import resend
import base64
from datetime import datetime, timedelta, date
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session

# --- NEW: Import Holiday and LeaveRequest models ---
from app.models import User, AttendanceRecord, Role, Holiday, LeaveRequest
from app.config import settings

# Pull the API key securely from your env
resend.api_key = settings.resend_api_key

def generate_and_email_monthly_report(db: Session):
    print("Generating smart monthly payroll summary spreadsheet...")
    
    # 1. Date Range: 1st of the current month to Today (in IST)
    tz_kolkata = ZoneInfo("Asia/Kolkata")
    today = datetime.now(tz_kolkata).date()
    start_date = today.replace(day=1) # The 1st of the current month
    
    # Generate a list of all dates from the 1st to today
    delta = today - start_date
    all_dates = [start_date + timedelta(days=i) for i in range(delta.days + 1)]
    
    # 2. Get ALL workers
    workers = db.query(User).filter(User.role == Role.worker).all()
    if not workers:
        print("No workers found. Skipping report.")
        return

    # 3. Pre-fetch Data: Attendance, Holidays, and Leaves
    attendances = db.query(AttendanceRecord).filter(
        AttendanceRecord.record_date >= start_date,
        AttendanceRecord.record_date <= today
    ).all()
    
    # Fast lookup for attendance: Set of (user_id, date)
    presence_map = set((a.user_id, a.record_date) for a in attendances)
    
    holidays = db.query(Holiday).filter(
        Holiday.holiday_date >= start_date,
        Holiday.holiday_date <= today
    ).all()

    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= start_date
    ).all()
    
    # 4. Build the Payroll Grid
    report_data = []
    for w in workers:
        row = {
            "Worker Name": w.name,
            "Username": w.username,
        }
        
        # Track counters for payroll math
        p_count = 0  # Present
        wo_count = 0 # Weekly Off (Sundays)
        h_count = 0  # Holidays
        l_count = 0  # Leaves
        a_count = 0  # Absents
        
        worker_site_ids = [s.id for s in w.sites]
        
        # Check every day of the month so far
        for d in all_dates:
            date_label = d.strftime("%d %b") # Format like "01 Jul"
            
            # Condition 1: Did they physically show up? (Overrules everything, even working on a Sunday)
            if (w.id, d) in presence_map:
                row[date_label] = "P"
                p_count += 1
                continue
            
            # Condition 2: Is it a Sunday? (weekday() returns 6 for Sunday)
            if d.weekday() == 6:
                row[date_label] = "WO"
                wo_count += 1
                continue
                
            # Condition 3: Is it a Declared Holiday for this worker?
            is_holiday = any(
                h.holiday_date == d and (h.site_id is None or h.site_id in worker_site_ids)
                for h in holidays
            )
            if is_holiday:
                row[date_label] = "H"
                h_count += 1
                continue
                
            # Condition 4: Is the worker on Approved Leave?
            is_on_leave = any(
                l.user_id == w.id and l.start_date <= d <= l.end_date
                for l in leaves
            )
            if is_on_leave:
                row[date_label] = "L"
                l_count += 1
                continue
            
            # Default: If they didn't check in and have no excuse, they are Absent
            row[date_label] = "A" 
            a_count += 1
            
        # Add the totals at the end of the row for easy salary calculation
        row["Total Present (P)"] = p_count
        row["Total Sundays (WO)"] = wo_count
        row["Total Holidays (H)"] = h_count
        row["Total Leaves (L)"] = l_count
        row["Total Unpaid Absents (A)"] = a_count
        
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
        "html": f"<h3>Monthly Payroll & Leave Summary</h3><p>Attached is the smart attendance breakdown for {month_name}, up to {today.strftime('%d %b')}.</p>",
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
