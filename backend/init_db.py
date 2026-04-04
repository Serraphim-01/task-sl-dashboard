"""
Script to create database tables and insert initial admin user.
Run this once after setting up the database.
"""
from app.database import engine, Base, User
from app.utils.password import hash_password
from sqlalchemy.orm import sessionmaker

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

# Create initial admin user
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == "admin@tasksystems.com").first()
    
    if existing_admin:
        print("Admin user already exists!")
    else:
        print("Creating initial admin user...")
        
        # Generate Key Vault secret names for admin (these won't be used but are required)
        admin_client_id_secret = "admin-starlink-client-id"
        admin_client_secret_secret = "admin-starlink-client-secret"
        
        # Hash the password
        hashed_pwd = hash_password("Admin@123456")  # Change this password!
        
        # Create admin user
        admin_user = User(
            email="admin@tasksystems.com",
            hashed_password=hashed_pwd,
            kms_client_id_secret_name=admin_client_id_secret,
            kms_client_secret_secret_name=admin_client_secret_secret,
            enterprise_name="Task Systems Admin",
            is_admin=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"Admin user created successfully!")
        print(f"Email: admin@tasksystems.com")
        print(f"Password: Admin@123456")
        print(f"\n⚠️  IMPORTANT: Change the password immediately after first login!")
        print(f"⚠️  IMPORTANT: Update the Key Vault secrets for this admin user if needed!")

except Exception as e:
    db.rollback()
    print(f"Error creating admin user: {e}")
    raise
finally:
    db.close()
