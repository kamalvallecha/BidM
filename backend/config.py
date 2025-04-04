import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database configuration
    POSTGRES_DB = os.getenv('POSTGRES_DB', 'BidM')
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'admin123')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')

    # JWT configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # CORS configuration
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://bidm-smartprocure.replit.app')
    
    # Other configuration
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    CORS_HEADERS = 'Content-Type' 