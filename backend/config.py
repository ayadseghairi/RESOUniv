import os
import logging
from datetime import timedelta

class Config:
    """Base configuration class with common settings."""
    # Basic application settings
    SECRET_KEY = os.environ.get("SECRET_KEY") or "super-secret-key"
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or "jwt-secret-key"
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URI") or "sqlite:///database.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT settings
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS settings
    CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    # Logging configuration
    LOG_LEVEL = logging.INFO
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = "app.log"
    
    # Upload settings
    UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size

class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True
    LOG_LEVEL = logging.DEBUG
    SQLALCHEMY_ECHO = True  # Log SQL queries

class TestingConfig(Config):
    """Testing environment configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False

class ProductionConfig(Config):
    """Production environment configuration."""
    DEBUG = False
    
    # In production, ensure these are set as environment variables
    SECRET_KEY = os.environ.get("SECRET_KEY")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    
    # Use a more robust database in production
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URI")
    
    # More secure JWT settings for production
    JWT_COOKIE_SECURE = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)

# Configuration dictionary to easily select environment
config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """
    Get the appropriate configuration based on the FLASK_ENV environment variable.
    Returns the configuration class.
    """
    env = os.environ.get('FLASK_ENV', 'default')
    return config_by_name[env]

def configure_logging(app):
    """
    Configure logging for the application.
    
    Args:
        app: Flask application instance
    """
    log_level = app.config.get('LOG_LEVEL', logging.INFO)
    log_format = app.config.get('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    log_file = app.config.get('LOG_FILE', 'app.log')
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    # Set Flask logger to use the same level
    app.logger.setLevel(log_level)
    
    app.logger.info(f"Logging configured with level: {logging.getLevelName(log_level)}")

def ensure_directories_exist(app):
    """
    Ensure that necessary directories exist.
    
    Args:
        app: Flask application instance
    """
    upload_folder = app.config.get('UPLOAD_FOLDER')
    if upload_folder and not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
        app.logger.info(f"Created upload directory: {upload_folder}")
