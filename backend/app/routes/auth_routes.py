from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import User
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from app.utils import log_action

auth_bp = Blueprint("auth", __name__)

# 🔐 تسجيل الدخول
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    registration_number = data.get("registration_number")
    password = data.get("password")

    if not registration_number or not password:
        return jsonify({"error": "يرجى إدخال رقم التسجيل وكلمة المرور"}), 400

    user = User.query.filter_by(registration_number=registration_number).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "رقم التسجيل أو كلمة المرور غير صحيحة"}), 401

    if not user.is_active:
        return jsonify({"error": "هذا الحساب غير مفعل، يرجى التواصل مع المسؤول"}), 403

    access_token = create_access_token(identity=user.registration_number)
    log_action("تسجيل دخول", f"تم تسجيل الدخول: {user.full_name}", performed_by=user.full_name)
    
    return jsonify({
        "token": access_token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "registration_number": user.registration_number,
            "role": user.role,
            "academic_year": user.academic_year
        }
    })

# 📝 تسجيل مستخدم جديد
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    
    # التحقق من البيانات المطلوبة
    required_fields = ["full_name", "registration_number", "password", "role", "phone"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"حقل {field} مطلوب"}), 400
    
    # التحقق من عدم وجود مستخدم بنفس رقم التسجيل
    if User.query.filter_by(registration_number=data["registration_number"]).first():
        return jsonify({"error": "رقم التسجيل مستخدم بالفعل"}), 400
    
    # إنشاء مستخدم جديد
    new_user = User(
        full_name=data["full_name"],
        registration_number=data["registration_number"],
        password=generate_password_hash(data["password"]),
        role=data["role"],
        phone=data["phone"],
        academic_year=data.get("academic_year"),
        is_active=True if data["role"] == "admin" else False  # تفعيل المسؤولين تلقائيًا
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    log_action("تسجيل مستخدم جديد", f"تم تسجيل مستخدم جديد: {new_user.full_name}", performed_by="النظام")
    
    return jsonify({"msg": "تم تسجيل المستخدم بنجاح، انتظر تفعيل الحساب من قبل المسؤول"}), 201

# 👤 الحصول على بيانات المستخدم الحالي
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    current_user = User.query.filter_by(registration_number=get_jwt_identity()).first()
    
    if not current_user:
        return jsonify({"error": "المستخدم غير موجود"}), 404
    
    return jsonify({
        "id": current_user.id,
        "full_name": current_user.full_name,
        "registration_number": current_user.registration_number,
        "role": current_user.role,
        "phone": current_user.phone,
        "academic_year": current_user.academic_year,
        "is_active": current_user.is_active
    })

# 🔄 تغيير كلمة المرور
@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        return jsonify({"error": "يرجى إدخال كلمة المرور الحالية والجديدة"}), 400
    
    current_user = User.query.filter_by(registration_number=get_jwt_identity()).first()
    
    if not check_password_hash(current_user.password, current_password):
        return jsonify({"error": "كلمة المرور الحالية غير صحيحة"}), 401
    
    current_user.password = generate_password_hash(new_password)
    db.session.commit()
    
    log_action("تغيير كلمة المرور", f"تم تغيير كلمة المرور: {current_user.full_name}", performed_by=current_user.full_name)
    
    return jsonify({"msg": "تم تغيير كلمة المرور بنجاح"}), 200
