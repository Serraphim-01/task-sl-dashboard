from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func


def register_user_model(Base):
    """
    Register the User model with the Base.
    This avoids circular import issues.
    """
    class User(Base):
        __tablename__ = "users"

        id = Column(Integer, primary_key=True, index=True)
        email = Column(String(255), unique=True, index=True, nullable=False)
        hashed_password = Column(String(255), nullable=True)  # Made nullable for unactivated accounts
        kms_client_id_secret_name = Column(String(255), nullable=True)  # Made nullable for service-line-based auth
        kms_client_secret_secret_name = Column(String(255), nullable=True)  # Made nullable for service-line-based auth
        service_line_number = Column(String(255), nullable=True)  # Service line associated with this customer
        enterprise_name = Column(String(255), nullable=False)
        is_admin = Column(Boolean, default=False)
        is_active = Column(Boolean, default=False)  # Track if user has activated their account (set password)
        is_online = Column(Boolean, default=False)  # Track if user is currently logged in
        last_login_at = Column(DateTime(timezone=True), nullable=True)  # Track last login time
        must_change_password = Column(Boolean, default=True)  # Force password change on first login
        created_at = Column(DateTime(timezone=True), server_default=func.now())
        updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    return User
