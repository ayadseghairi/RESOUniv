from getpass import getpass
from app import create_app, db, bcrypt
from app.models import User

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    print("🔐 create admin acount :")
    full_name = input(" your name : ")
    registration_number = input("registration number: ")
    phone = input("your phone number: ")
    password = getpass("password: ")

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    admin = User(
        full_name=full_name,
        registration_number=registration_number,
        phone=phone,
        password=hashed_password,
        role="admin",
    )
    db.session.add(admin)
    db.session.commit()
    print("✅ Done.")
