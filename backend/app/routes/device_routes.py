from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Device
from app.utils import log_action

device_bp = Blueprint("device_bp", __name__)

# تعديل المسارات لتعمل مع وبدون الشرطة المائلة في النهاية
@device_bp.route("", methods=["POST", "GET", "OPTIONS"])
@device_bp.route("/", methods=["POST", "GET", "OPTIONS"])
@jwt_required(optional=True)
def devices():
    # التعامل مع طلبات OPTIONS بشكل صريح
    if request.method == "OPTIONS":
        return jsonify({"msg": "OK"}), 200
        
    # التحقق من وجود التوكن للطلبات الفعلية
    if not get_jwt_identity():
        return jsonify({"msg": "غير مصرح، يرجى تسجيل الدخول"}), 401
    
    if request.method == "POST":
        data = request.get_json()
        name = data.get("name")
        device_type = data.get("device_type")
        quantity = data.get("quantity")

        if not name or not device_type or quantity is None:
            return jsonify({"msg": "كل الحقول مطلوبة"}), 400

        device = Device(name=name, device_type=device_type, quantity=quantity)
        db.session.add(device)
        db.session.commit()

        log_action("إضافة جهاز", f"تمت إضافة الجهاز: {name} (النوع: {device_type})", get_jwt_identity())

        return jsonify({"msg": "✅ تم إضافة الجهاز بنجاح"})
    
    elif request.method == "GET":
        devices = Device.query.all()
        return jsonify([
            {
                "id": d.id,
                "name": d.name,
                "device_type": d.device_type,
                "quantity": d.quantity
            }
            for d in devices
        ])

@device_bp.route("/<int:device_id>", methods=["PUT", "DELETE", "OPTIONS"])
@jwt_required(optional=True)
def device_operations(device_id):
    # التعامل مع طلبات OPTIONS بشكل صريح
    if request.method == "OPTIONS":
        return jsonify({"msg": "OK"}), 200
        
    # التحقق من وجود التوكن للطلبات الفعلية
    if not get_jwt_identity():
        return jsonify({"msg": "غير مصرح، يرجى تسجيل الدخول"}), 401
    
    device = Device.query.get(device_id)
    if not device:
        return jsonify({"msg": "❌ الجهاز غير موجود"}), 404

    if request.method == "PUT":
        data = request.get_json()
        name = data.get("name")
        quantity = data.get("quantity")

        if name is not None:
            device.name = name
        if quantity is not None:
            device.quantity = quantity

        db.session.commit()
        log_action("تعديل جهاز", f"تم تعديل الجهاز {device.name}", get_jwt_identity())

        return jsonify({"msg": "✅ تم تعديل الجهاز بنجاح"})
    
    elif request.method == "DELETE":
        db.session.delete(device)
        db.session.commit()

        log_action("حذف جهاز", f"تم حذف الجهاز {device.name}", get_jwt_identity())

        return jsonify({"msg": "🗑️ تم حذف الجهاز بنجاح"})
