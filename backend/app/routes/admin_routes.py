from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, Borrowing, Device, Log
from app import db
from app.utils import log_action
from datetime import datetime

admin_bp = Blueprint("admin", __name__)

def is_admin():
    current_user = User.query.filter_by(registration_number=get_jwt_identity()).first()
    return current_user and current_user.role == "admin"

# 👥 عرض كل المستخدمين
@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    if not is_admin():
        return jsonify({"msg": "غير مصرح"}), 403

    users = User.query.all()
    return jsonify([
        {
            "id": u.id,
            "full_name": u.full_name,
            "registration_number": u.registration_number,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "academic_year": u.academic_year,
        }
        for u in users
    ])

# ⚙️ تفعيل / تعطيل / حذف مستخدم
@admin_bp.route("/user/<int:user_id>/<action>", methods=["PUT"])
@jwt_required()
def user_action(user_id, action):
    if not is_admin():
        return jsonify({"msg": "غير مصرح"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "المستخدم غير موجود"}), 404

    admin_name = User.query.filter_by(registration_number=get_jwt_identity()).first().full_name

    if action == "activate":
        user.is_active = True
        msg = "تم تفعيل المستخدم"
    elif action == "deactivate":
        user.is_active = False
        msg = "تم تعطيل المستخدم"
    elif action == "delete":
        db.session.delete(user)
        msg = "تم حذف المستخدم"
    else:
        return jsonify({"msg": "عملية غير معروفة"}), 400

    db.session.commit()
    log_action("إجراء على مستخدم", f"{msg}: {user.full_name}", performed_by=admin_name)
    return jsonify({"msg": msg}), 200

# 📋 عرض كل طلبات الاستعارة
@admin_bp.route("/borrowings", methods=["GET"])
@jwt_required()
def get_borrowings():
    if not is_admin():
        return jsonify({"msg": "غير مصرح"}), 403

    borrowings = Borrowing.query.all()
    return jsonify([
        {
            "id": b.id,
            "user": b.user.full_name,
            "device": b.device.name,
            "start_date": b.start_date.isoformat(),
            "end_date": b.end_date.isoformat(),
            "usage_place": b.usage_place,
            "status": b.status
        }
        for b in borrowings
    ])

# ✅ تأكيد / ❌ إلغاء / 🔁 استرجاع
@admin_bp.route("/borrowing/<int:borrow_id>/<action>", methods=["PUT", "OPTIONS"])
@jwt_required(optional=True)
def handle_borrow(borrow_id, action):
    # Handle OPTIONS request explicitly
    if request.method == "OPTIONS":
        return jsonify({"msg": "OK"}), 200
        
    # Check for token for actual requests
    if not get_jwt_identity():
        return jsonify({"msg": "غير مصرح، يرجى تسجيل الدخول"}), 401
        
    if not is_admin():
        return jsonify({"msg": "غير مصرح"}), 403

    borrow = Borrowing.query.get(borrow_id)
    if not borrow:
        return jsonify({"msg": "الطلب غير موجود"}), 404

    admin = User.query.filter_by(registration_number=get_jwt_identity()).first()
    if action == "confirm":
        borrow.status = "confirmed"
        action_text = "تم تأكيد الاستعارة"
    elif action == "cancel":
        borrow.status = "rejected"
        action_text = "تم إلغاء الاستعارة"
    elif action == "return":
        borrow.status = "returned"
        action_text = "تم تسجيل الاسترجاع"
    else:
        return jsonify({"msg": "عملية غير صالحة"}), 400

    db.session.commit()
    log_action("إجراء على استعارة", f"{action_text} - {borrow.device.name} - {borrow.user.full_name}", performed_by=admin.full_name)

    return jsonify({"msg": action_text}), 200

# 🧾 عرض السجل
@admin_bp.route("/logs", methods=["GET"])
@jwt_required()
def get_logs():
    if not is_admin():
        return jsonify({"msg": "غير مصرح"}), 403

    logs = Log.query.order_by(Log.timestamp.desc()).all()
    return jsonify([
        {
            "id": l.id,
            "action": l.action,
            "description": l.description,
            "performed_by": l.performed_by,
            "timestamp": l.timestamp.isoformat()
        }
        for l in logs
    ])
