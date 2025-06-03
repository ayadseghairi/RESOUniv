from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity , verify_jwt_in_request
from app.models import Borrowing, User, Device
from app import db
from app.utils import log_action, is_device_available
from datetime import datetime

borrow_bp = Blueprint("borrow", __name__)

# 📝 تقديم طلب استعارة - تعديل المسار ليعمل مع وبدون الشرطة المائلة ف�� النهاية
@borrow_bp.route("", methods=["POST", "OPTIONS"])
@borrow_bp.route("/", methods=["POST", "OPTIONS"])
@jwt_required(optional=True)
def request_borrow():
    # التعامل مع طلبات OPTIONS بشكل صريح
    if request.method == "OPTIONS":
        return jsonify({"msg": "OK"}), 200
        
    # التحقق من وجود التوكن للطلبات الفعلية
    if not get_jwt_identity():
        return jsonify({"msg": "غير مصرح، يرجى تسجيل الدخول"}), 401
        
    current_user = User.query.filter_by(registration_number=get_jwt_identity()).first()
    
    if not current_user:
        return jsonify({"msg": "المستخدم غير موجود"}), 404

    data = request.get_json()
    
    # التحقق من وجود البيانات المطلوبة
    device_id = data.get("device_id")
    usage_place = data.get("usage_place")
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    if not all([device_id, usage_place, start_date, end_date]):
        return jsonify({"msg": "الرجاء إدخال جميع البيانات"}), 400

    # التحقق من وجود الجهاز في قاعدة البيانات
    device = Device.query.get(device_id)
    if not device:
        return jsonify({"msg": "الجهاز غير موجود"}), 404

    # تحويل التواريخ إلى datetime
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
    except ValueError:
        return jsonify({"msg": "تنسيق التاريخ غير صالح"}), 400

    # التحقق من أن تاريخ البداية لا يأتي بعد تاريخ النهاية
    if start >= end:
        return jsonify({"msg": "تاريخ البداية يجب أن يكون قبل تاريخ النهاية"}), 400

    # التحقق من توفر الجهاز في الفترة المحددة
    if not is_device_available(device, start, end):
        return jsonify({"msg": "الجهاز غير متوفر في هذه الفترة"}), 409

    # إنشاء طلب الاستعارة
    borrowing = Borrowing(
        user_id=current_user.id,
        device_id=device.id,
        start_date=start,
        end_date=end,
        usage_place=usage_place,
        status="pending"
    )
    db.session.add(borrowing)
    db.session.commit()

    log_action("طلب استعارة", f"{current_user.full_name} طلب استعارة الجهاز '{device.name}'", performed_by=current_user.full_name)

    return jsonify({"msg": "تم إرسال الطلب بنجاح"}), 201


# 📋 عرض طلبات المستخدم الحالي - تعديل المسار ليعمل مع وبدون الشرطة المائلة في النهاية
@borrow_bp.route("/my", methods=["GET", "OPTIONS"])
@borrow_bp.route("my", methods=["GET", "OPTIONS"])
@jwt_required(optional=True)
def my_borrowings():
    # التعامل مع طلبات OPTIONS بشكل صريح
    if request.method == "OPTIONS":
        return jsonify({"msg": "OK"}), 200
        
    # التحقق من وجود التوكن للطلبات الفعلية
    if not get_jwt_identity():
        return jsonify({"msg": "غير مصرح، يرجى تسجيل الدخول"}), 401
        
    current_user = User.query.filter_by(registration_number=get_jwt_identity()).first()
    
    if not current_user:
        return jsonify({"msg": "المستخدم غير موجود"}), 404

    borrowings = Borrowing.query.filter_by(user_id=current_user.id).all()

    # تعديل: إرجاع مصفوفة فارغة بدلاً من خطأ 404 عندما لا توجد استعارات
    result = []
    if borrowings:
        for b in borrowings:
            result.append({
                "id": b.id,
                "device": b.device.name,
                "start_date": b.start_date.isoformat(),
                "end_date": b.end_date.isoformat(),
                "usage_place": b.usage_place,
                "status": b.status,
            })

    # إرجاع النتيجة دائمًا بكود حالة 200 حتى لو كانت المصفوفة فارغة
    return jsonify(result), 200
