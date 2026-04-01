from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache
import os


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    # Database - reads from DATABASE_URL env var
    database_url: str = ""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # If DATABASE_URL is empty, try to read from env
        if not self.database_url:
            db_url = os.getenv("DATABASE_URL", "").strip()
            if db_url:
                self.database_url = db_url
        
        # Strip quotes if present (can come from .env files)
        if self.database_url:
            self.database_url = self.database_url.strip('\'"')
        
        # Fail loudly if no database URL is set
        if not self.database_url:
            print("[CRITICAL] DATABASE_URL environment variable is not set!")
            print("[CRITICAL] Please set DATABASE_URL in .env file or Vercel")
            # For local dev, use default
            self.database_url = "postgresql+asyncpg://postgres:sriram@localhost:5432/leaveflow"
        
        # Clean up DATABASE_URL if it has the variable name prefix
        if self.database_url.startswith("DATABASE_URL="):
            self.database_url = self.database_url.replace("DATABASE_URL=", "", 1).strip()
        
        # Convert postgres:// to postgresql+asyncpg://
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif self.database_url.startswith("postgresql://") and "asyncpg" not in self.database_url:
            self.database_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Normalize WhatsApp tokens and phone ID (strip quotes & whitespace)
        # This prevents mismatches if env vars are set with quotes or surrounding whitespace
        if getattr(self, "whatsapp_verify_token", None):
            self.whatsapp_verify_token = self.whatsapp_verify_token.strip().strip('\'"')
        if getattr(self, "whatsapp_token", None):
            self.whatsapp_token = self.whatsapp_token.strip().strip('\'"')
        if getattr(self, "whatsapp_phone_number_id", None):
            self.whatsapp_phone_number_id = self.whatsapp_phone_number_id.strip().strip('\'"')
    
    # JWT Auth
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days
    
    # WhatsApp
    whatsapp_token: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_verify_token: str = ""
    
    # Storage (optional)
    supabase_url: str = ""
    supabase_service_key: str = ""
    
    # App Config
    cors_origins: str = "http://localhost:3000"
    escalation_hours: int = 24
    
    # AI Service (OpenRouter - Free models available)
    openrouter_api_key: str = ""


@lru_cache()
def get_settings() -> Settings:
    return Settings()
