"""
Script to create database tables, run migrations, and insert initial admin user.
Run this once after setting up the database.
"""
from app.database import engine, Base, User
from app.utils.password import hash_password
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

# Run migrations for new fields
print("\nRunning database migrations...")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Check and add is_online column if it doesn't exist
    columns_check = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_online'
    """)).fetchone()
    
    if not columns_check:
        print("Adding is_online column...")
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN is_online BOOLEAN DEFAULT FALSE
        """))
        db.commit()
        print("✓ is_online column added")
    else:
        print("✓ is_online column already exists")
    
    # Check and add is_active column if it doesn't exist
    columns_check = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_active'
    """)).fetchone()
    
    if not columns_check:
        print("Adding is_active column...")
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN is_active BOOLEAN DEFAULT FALSE
        """))
        db.commit()
        print("✓ is_active column added")
    else:
        print("✓ is_active column already exists")
    
    # Check and add last_login_at column if it doesn't exist
    columns_check = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_login_at'
    """)).fetchone()
    
    if not columns_check:
        print("Adding last_login_at column...")
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE
        """))
        db.commit()
        print("✓ last_login_at column added")
    else:
        print("✓ last_login_at column already exists")
    
    # Check and add must_change_password column if it doesn't exist
    columns_check = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'must_change_password'
    """)).fetchone()
    
    if not columns_check:
        print("Adding must_change_password column...")
        db.execute(text("""
            ALTER TABLE users 
            ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE
        """))
        db.commit()
        print("✓ must_change_password column added")
    else:
        print("✓ must_change_password column already exists")
    
    # Make hashed_password nullable if it isn't already
    try:
        print("Making hashed_password nullable...")
        db.execute(text("""
            ALTER TABLE users 
            ALTER COLUMN hashed_password DROP NOT NULL
        """))
        db.commit()
        print("✓ hashed_password is now nullable")
    except Exception as e:
        print(f"✓ hashed_password is already nullable or error: {e}")
        db.rollback()
    
    print("\n✅ All migrations completed successfully!")
    
    # Reset all is_online flags to False on server startup
    # This ensures accurate online status tracking (customers who closed browser without logout)
    print("\nResetting online status for all users...")
    db.execute(text("""
        UPDATE users 
        SET is_online = FALSE
        WHERE is_online = TRUE
    """))
    db.commit()
    reset_count = db.execute(text("SELECT COUNT(*) FROM users WHERE is_online = FALSE")).scalar()
    print(f"✓ Reset is_online to FALSE for all users")
    
    print("\n✅ All migrations completed successfully!")
    
except Exception as e:
    db.rollback()
    print(f"\n❌ Migration error: {e}")
    raise
finally:
    db.close()

# Create initial admin user
print("\n" + "="*60)
print("Setting up admin user...")
print("="*60)
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
