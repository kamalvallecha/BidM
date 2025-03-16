import os
from datetime import timedelta

class Config:
    # Database configuration
    POSTGRES_DB = "BidM"
    POSTGRES_USER = "postgres"
    POSTGRES_PASSWORD = "admin123"
    POSTGRES_HOST = "localhost"
    POSTGRES_PORT = "5432"

    # JWT configuration
    SECRET_KEY = "your-secret-key-here"
    JWT_SECRET_KEY = "your-jwt-secret-key"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # Other configuration
    DEBUG = True
    CORS_HEADERS = 'Content-Type' 