from datetime import datetime
from sqlalchemy import Enum
from . import db

# نموذج المستخدم User
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    registration_number = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    role = db.Column(Enum('student', 'teacher', 'admin', 'worker', name='user_role'), nullable=False)  # إضافة 'worker' (عامل)
    is_active = db.Column(db.Boolean, default=True)
    academic_year = db.Column(db.String(20))  # فقط للطلبة

    borrowings = db.relationship("Borrowing", backref="user", lazy=True)

# نموذج الجهاز Device
class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    device_type = db.Column(db.String(50), nullable=False)  # تغيير من "type" إلى "device_type"
    quantity = db.Column(db.Integer, nullable=False)
    status = db.Column(Enum('available', 'borrowed', 'under_repair', name='device_status'), default='available')

    borrowings = db.relationship("Borrowing", backref="device", lazy=True)

# نموذج الاستعارة Borrowing
class Borrowing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    device_id = db.Column(db.Integer, db.ForeignKey("device.id"), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    usage_place = db.Column(db.String(255), nullable=False)
    status = db.Column(Enum('pending', 'confirmed', 'rejected', 'returned', name='borrowing_status'), default='pending')  # Enum for status
    extended = db.Column(db.Boolean, default=False)  # Track if borrowing is extended

# نموذج السجل Log
class Log(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    performed_by = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
