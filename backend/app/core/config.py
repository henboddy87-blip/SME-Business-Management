from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Cambodian SME Business SaaS"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./pos_saas.db"
    
    # Security
    SECRET_KEY: str = "cambodia_sme_saas_production_super_secret_key_2026_change_in_prod"
    JWT_SECRET: str = "cambodia_sme_saas_jwt_secret_key_987654321"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # Cambodian Business & Payment Defaults
    DEFAULT_CURRENCY: str = "USD"
    DEFAULT_LANGUAGE: str = "en"
    KHR_EXCHANGE_RATE: float = 4100.0  # 1 USD = 4,100 KHR default
    KHQR_API_URL: str = "https://api-bakong.nbc.org.kh/v1/mock"
    KHQR_API_KEY: str = "mock_khqr_api_key_khmer_sme"
    KHQR_MERCHANT_NAME: str = "Khmer Style Fashion"
    KHQR_MERCHANT_CITY: str = "Phnom Penh"
    KHQR_MERCHANT_ID: str = "khmer_fashion@acleda"
    
    # Telegram Notifications
    TELEGRAM_BOT_TOKEN: Optional[str] = "mock_telegram_bot_token"
    TELEGRAM_CHAT_ID: Optional[str] = "mock_chat_id"
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
