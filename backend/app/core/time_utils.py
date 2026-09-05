from datetime import datetime, timezone, timedelta

try:
    from zoneinfo import ZoneInfo
    IST = ZoneInfo("Asia/Kolkata")
except Exception:
    IST = timezone(timedelta(hours=5, minutes=30))

def get_now_ist() -> datetime:
    """Returns current datetime in Indian Standard Time (Asia/Kolkata, UTC+5:30)."""
    return datetime.now(IST)

def ensure_ist(dt: datetime) -> datetime:
    """Ensures a datetime object has IST timezone attached."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=IST)
    return dt.astimezone(IST)
