#!/usr/bin/env python3
"""
Configuration checker for the RESOUniv application.
This script validates the current configuration and environment variables.
"""
import os
import sys
import argparse
from pathlib import Path

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from utils.config_utils import get_env_var, get_database_url, parse_list_env_var, get_log_level

def check_environment():
    """Check the current environment configuration."""
    env = get_env_var("FLASK_ENV", "development")
    print(f"Current environment: {env}")
    
    # Check essential environment variables
    secret_key = get_env_var("SECRET_KEY")
    jwt_secret_key = get_env_var("JWT_SECRET_KEY")
    
    if not secret_key:
        print("⚠️ WARNING: SECRET_KEY is not set. Using a default value in production is insecure.")
    else:
        print("✅ SECRET_KEY is set.")
        
    if not jwt_secret_key:
        print("⚠️ WARNING: JWT_SECRET_KEY is not set. Using a default value in production is insecure.")
    else:
        print("✅ JWT_SECRET_KEY is set.")
    
    # Check database configuration
    try:
        db_url = get_database_url()
        print(f"✅ Database URL: {db_url}")
    except ValueError as e:
        print(f"❌ Database configuration error: {str(e)}")
    
    # Check logging configuration
    log_level = get_env_var("LOG_LEVEL", "INFO")
    log_file = get_env_var("LOG_FILE", "app.log")
    
    print(f"✅ Log level: {log_level}")
    print(f"✅ Log file: {log_file}")
    
    # Check CORS configuration
    cors_origins = parse_list_env_var("CORS_ORIGINS", ["http://localhost:5173"])
    print(f"✅ CORS origins: {', '.join(cors_origins)}")
    
    # Production-specific checks
    if env == "production":
        if not secret_key or secret_key == "super-secret-key":
            print("❌ CRITICAL: Using default SECRET_KEY in production is insecure!")
        
        if not jwt_secret_key or jwt_secret_key == "jwt-secret-key":
            print("❌ CRITICAL: Using default JWT_SECRET_KEY in production is insecure!")
        
        if db_url.startswith("sqlite"):
            print("⚠️ WARNING: Using SQLite in production is not recommended for high-traffic applications.")

def main():
    parser = argparse.ArgumentParser(description="Check configuration for RESOUniv application")
    parser.add_argument("--env-file", help="Path to .env file to load")
    
    args = parser.parse_args()
    
    # Load environment variables from file if specified
    if args.env_file:
        if not os.path.exists(args.env_file):
            print(f"Error: Environment file not found: {args.env_file}")
            sys.exit(1)
            
        print(f"Loading environment variables from {args.env_file}")
        with open(args.env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    os.environ[key] = value
    
    check_environment()

if __name__ == "__main__":
    main()
