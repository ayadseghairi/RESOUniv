from app import db
from app.models import Log
from flask_jwt_extended import get_jwt_identity
from app.models import Borrowing
def log_action(action, description, performed_by=None):
    if not performed_by:
        performed_by = get_jwt_identity() or "نظام"

    log = Log(action=action, description=description, performed_by=performed_by)
    db.session.add(log)
    db.session.commit()
def is_device_available(device, start_date, end_date):
    active_borrowings = Borrowing.query.filter(
        Borrowing.device_id == device.id,
        Borrowing.status.in_(["معلق", "مؤكد"]),
        Borrowing.end_date >= start_date,
        Borrowing.start_date <= end_date
    ).count()

    return active_borrowings < device.quantity