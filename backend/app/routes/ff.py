from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, Device
from app.utils import log_action

device_bp = Blueprint("device_bp", __name__)

@device_bp.route("/api/devices/", methods=["POST"])
@jwt_required()
def add_device():
    data = request.get_json()
    name = data.get("name")
    device_type = data.get("type")  # <-- تمت إضافته
    quantity = data.get("quantity")

    if not name or not device_type or quantity is None:
        return jsonify({"msg": "كل الحقول مطلوبة"}), 400

    device = Device(name=name, type=device_type, quantity=quantity)
    db.session.add(device)
    db.session.commit()

    log_action("إضافة جهاز", f"تمت إضافة الجهاز: {name} (النوع: {device_type})", get_jwt_identity())

    return jsonify({"msg": "✅ تم إضافة الجهاز بنجاح"})

@device_bp.route("/api/devices/", methods=["GET"])
@jwt_required()
def get_devices():
    devices = Device.query.all()
    return jsonify([
        {
            "id": d.id,
            "name": d.name,
            "type": d.type,  # <-- عرض النوع
            "quantity": d.quantity
        }
        for d in devices
    ])
