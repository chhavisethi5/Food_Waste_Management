import os
from pydantic_settings import BaseSettings

class Settings:
    PROJECT_NAME: str = "Food Waste Management API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = ""
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-food-waste-management-app-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./food_waste.db")

settings = Settings()
