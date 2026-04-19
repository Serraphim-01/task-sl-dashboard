"""
Script to completely drop and recreate the database with latest schema.
WARNING: This will delete ALL data!
"""
from app.database import engine, Base, User
from app.utils.password import hash_password
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import sys

print("="*70)
print("⚠️  WARNING: This will DELETE ALL DATA in the database!")
print("="*70)

# Ask for confirmation
confirm = input("\nAre you sure you want to continue? (yes/no): ").strip().lower()

if confirm not in ['yes', 'y']:
    print("\n❌ Operation cancelled. Database unchanged.")
    sys.exit(0)

print("\n🗑️  Dropping all existing tables...")
try:
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    print("✓ All tables dropped successfully!")
except Exception as e:
    print(f"\n❌ Error dropping tables: {e}")
    sys.exit(1)

print("\n📦 Creating fresh database schema...")
try:
    # Create all tables with latest schema
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully!")
except Exception as e:
    print(f"\n❌ Error creating tables: {e}")
    sys.exit(1)

print("\n🔧 Running database setup...")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    print("\n✅ Database schema created with latest structure:")
    print("   - id (Primary Key)")
    print("   - email (Unique, Indexed)")
    print("   - hashed_password (Nullable - for unactivated accounts)")
    print("   - kms_client_id_secret_name (Nullable)")
    print("   - kms_client_secret_secret_name (Nullable)")
    print("   - service_line_number (NEW - for customer association)")
    print("   - enterprise_name")
    print("   - is_admin")
    print("   - is_active (for activation status)")
    print("   - is_online (for login status)")
    print("   - must_change_password (for first-time login)")
    print("   - last_login_at")
    print("   - created_at")
    print("   - updated_at")
    
    # Reset all online status
    print("\n🔄 Resetting online status for all users...")
    db.execute(text("""
        UPDATE users 
        SET is_online = FALSE
        WHERE is_online = TRUE
    """))
    db.commit()
    print("✓ Online status reset complete")
    
    print("\n" + "="*60)
    print("👤 Setting up initial admin user...")
    print("="*60)
    
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == "admin@tasksystems.com").first()
    
    if existing_admin:
        print("\n⚠️  Admin user already exists! Skipping creation.")
        print("   Email: admin@tasksystems.com")
    else:
        print("\nCreating initial admin user...")
        
        # Generate Key Vault secret names for admin
        admin_client_id_secret = "starlink-provider-client-id"
        admin_client_secret_secret = "starlink-provider-client-secret"
        
        # Hash the password
        hashed_pwd = hash_password("Admin@123456")
        
        # Create admin user
        admin_user = User(
            email="admin@tasksystems.com",
            hashed_password=hashed_pwd,
            kms_client_id_secret_name=admin_client_id_secret,
            kms_client_secret_secret_name=admin_client_secret_secret,
            enterprise_name="Task Systems Admin",
            is_admin=True,
            is_active=True,
            is_online=False,
            must_change_password=False
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"\n✅ Admin user created successfully!")
        print(f"   Email: admin@tasksystems.com")
        print(f"   Password: Admin@123456")
        print(f"\n⚠️  IMPORTANT: Change the password immediately after first login!")
        print(f"⚠️  REMEMBER: Configure Starlink credentials in Key Vault!")

except Exception as e:
    db.rollback()
    print(f"\n❌ Error during setup: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    db.close()

print("\n" + "="*70)
print("🎉 DATABASE RESET COMPLETE!")
print("="*70)
print("\nNext steps:")
print("1. Start the backend server: cd backend && uvicorn app.main:app --reload")
print("2. Login as admin: admin@tasksystems.com / Admin@123456")
print("3. Configure admin's Starlink credentials in Key Vault")
print("4. Create customers with service line numbers")
print("\n" + "="*70)
