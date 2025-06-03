# fix_passwords.py
from app import create_app, db
from app.models import User, Log
from werkzeug.security import generate_password_hash
import os

def fix_invalid_password_hashes():
    """Script to fix invalid password hashes in the database"""
    app = create_app()
    
    with app.app_context():
        # Check if database exists
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        if db_path.startswith('/'):
            # Absolute path
            db_file_path = db_path
        else:
            # Relative path
            db_file_path = os.path.join(app.instance_path, db_path)
            
        if not os.path.exists(db_file_path):
            print(f"Database file not found at {db_file_path}")
            print("Please run 'uv run init_db.py' first to initialize the database.")
            return
            
        # Check if tables exist by trying to query one record
        try:
            User.query.first()
        except Exception as e:
            print(f"Error accessing User table: {e}")
            print("Please run 'uv run init_db.py' first to initialize the database.")
            return
            
        # Continue with fixing passwords
        users = User.query.all()
        fixed_count = 0
        
        for user in users:
            if not user.password or not any(user.password.startswith(prefix) for prefix in ['pbkdf2:', 'sha256:', 'sha512:', 'scrypt:']):
                # Reset to a default password (e.g., their registration number)
                default_password = user.registration_number
                user.password = generate_password_hash(default_password, method='pbkdf2:sha256')
                
                # Log the password reset
                log_entry = Log(
                    action="إعادة تعيين كلمة المرور تلقائيًا",
                    description=f"تم إعادة تعيين كلمة المرور للمستخدم: {user.full_name} ({user.registration_number}) بسبب تنسيق تشفير غير صالح",
                    performed_by="النظام"
                )
                db.session.add(log_entry)
                
                fixed_count += 1
        
        if fixed_count > 0:
            db.session.commit()
            print(f"Fixed {fixed_count} invalid password hashes")
        else:
            print("No invalid password hashes found")

if __name__ == "__main__":
    fix_invalid_password_hashes()
