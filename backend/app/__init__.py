from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from config import get_config, configure_logging, ensure_directories_exist

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app(config_name='default'):
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)
    
    # Configure logging
    configure_logging(app)
    
    # Ensure necessary directories exist
    ensure_directories_exist(app)
    
    # تعطيل إعادة التوجيه التلقائي للمسارات بدون الشرطة المائلة في النهاية
    app.url_map.strict_slashes = False

    # تكوين CORS بشكل أكثر تفصيلاً للتعامل مع طلبات من مصادر مختلفة
    CORS(app, 
         resources={r"/api/*": {
             "origins": app.config.get('CORS_ORIGINS', ["http://localhost:5173"]),
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 3600
         }}
    )

    # بقية التهيئة كما هي
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    from app.routes.auth_routes import auth_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.borrow_routes import borrow_bp
    from app.routes.device_routes import device_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(borrow_bp, url_prefix='/api/borrow')
    app.register_blueprint(device_bp, url_prefix='/api/devices')

    # Add explicit OPTIONS route handler for the problematic endpoint
    @app.route('/api/admin/borrowing/<int:borrow_id>/<action>', methods=['OPTIONS'])
    def handle_options(borrow_id, action):
        response = app.make_default_options_response()
        return response
        
    # Log application startup
    app.logger.info("Application initialized successfully")

    return app
