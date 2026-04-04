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
        hashed_password = Column(String(255), nullable=False)
        kms_client_id_secret_name = Column(String(255), nullable=False)
        kms_client_secret_secret_name = Column(String(255), nullable=False)
        enterprise_name = Column(String(255), nullable=False)
        is_admin = Column(Boolean, default=False)
        created_at = Column(DateTime(timezone=True), server_default=func.now())
        updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    return User
