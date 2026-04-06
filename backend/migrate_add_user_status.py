"""
Database migration script to add new fields to users table:
- is_active (boolean, default False)
- last_login_at (timestamp, nullable)
- must_change_password (boolean, default True)
Also makes hashed_password nullable for unactivated accounts.
"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Run the database migration"""
    
    # Get database URL from environment
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found in .env file")
        return False
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            print("Starting database migration...")
            
            # Check if columns already exist
            columns_check = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('is_active', 'last_login_at', 'must_change_password')
            """)).fetchall()
            
            existing_columns = [row[0] for row in columns_check]
            
            # Add is_active column if it doesn't exist
            if 'is_active' not in existing_columns:
                print("Adding is_active column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN is_active BOOLEAN DEFAULT FALSE
                """))
                print("✓ is_active column added")
            else:
                print("✓ is_active column already exists")
            
            # Add last_login_at column if it doesn't exist
            if 'last_login_at' not in existing_columns:
                print("Adding last_login_at column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE
                """))
                print("✓ last_login_at column added")
            else:
                print("✓ last_login_at column already exists")
            
            # Add must_change_password column if it doesn't exist
            if 'must_change_password' not in existing_columns:
                print("Adding must_change_password column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE
                """))
                print("✓ must_change_password column added")
            else:
                print("✓ must_change_password column already exists")
            
            # Make hashed_password nullable if it isn't already
            print("Making hashed_password nullable...")
            conn.execute(text("""
                ALTER TABLE users 
                ALTER COLUMN hashed_password DROP NOT NULL
            """))
            print("✓ hashed_password is now nullable")
            
            # Commit the changes
            conn.commit()
            
            print("\n✅ Migration completed successfully!")
            print("\nNew fields added:")
            print("  - is_active: Tracks if user has activated their account")
            print("  - last_login_at: Timestamp of last login")
            print("  - must_change_password: Forces password change on first login")
            print("  - hashed_password: Now nullable for unactivated accounts")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)
