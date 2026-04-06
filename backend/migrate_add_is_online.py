"""
Database migration script to add is_online field to users table.
This tracks whether a user is currently logged in.
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
            print("Starting database migration to add is_online field...")
            
            # Check if column already exists
            columns_check = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'is_online'
            """)).fetchone()
            
            if columns_check:
                print("✓ is_online column already exists")
            else:
                # Add is_online column
                print("Adding is_online column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN is_online BOOLEAN DEFAULT FALSE
                """))
                print("✓ is_online column added")
            
            # Commit the changes
            conn.commit()
            
            print("\n✅ Migration completed successfully!")
            print("\nNew field added:")
            print("  - is_online: Tracks if user is currently logged in (real-time)")
            print("\nStatus Logic:")
            print("  - Unactivated: User hasn't set password yet")
            print("  - Active: User is currently logged in (is_online = true)")
            print("  - Inactive: User is logged out (is_online = false)")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)
