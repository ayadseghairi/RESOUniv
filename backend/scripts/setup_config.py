#!/usr/bin/env python3
"""
Configuration setup script for the RESOUniv application.
This script helps set up the initial configuration for different environments.
"""
import os
import sys
import argparse
import secrets
import json
from pathlib import Path

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from utils.config_utils import save_json_config

def generate_secret_key():
    """Generate a secure random secret key."""
    return secrets.token_hex(32)

def create_config_file(env, output_file):
    """Create a configuration file for the specified environment."""
    # Base configuration
    config = {
        "ENVIRONMENT": env,
        "SECRET_KEY": generate_secret_key(),
        "JWT_SECRET_KEY": generate_secret_key(),
    }
    
    # Environment-specific configurations
    if env == "development":
        config.update({
            "DEBUG": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///database.db",
            "SQLALCHEMY_ECHO": True,
            "LOG_LEVEL": "DEBUG",
        })
    elif env == "testing":
        config.update({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "WTF_CSRF_ENABLED": False,
            "LOG_LEVEL": "DEBUG",
        })
    elif env == "production":
        config.update({
            "DEBUG": False,
            "SQLALCHEMY_DATABASE_URI": "postgresql://user:password@localhost:5432/resouniv",
            "JWT_COOKIE_SECURE": True,
            "LOG_LEVEL": "INFO",
        })
    
    # Save the configuration
    save_json_config(config, output_file)
    print(f"Configuration file created: {output_file}")
    
    # Create a sample .env file
    env_file = os.path.join(os.path.dirname(output_file), ".env.sample")
    with open(env_file, "w") as f:
        f.write(f"# Sample environment variables for {env} environment\n")
        f.write(f"FLASK_ENV={env}\n")
        f.write(f"SECRET_KEY={config['SECRET_KEY']}\n")
        f.write(f"JWT_SECRET_KEY={config['JWT_SECRET_KEY']}\n")
        
        if env == "production":
            f.write("# Database configuration\n")
            f.write("DB_TYPE=postgresql\n")
            f.write("DB_USER=user\n")
            f.write("DB_PASSWORD=password\n")
            f.write("DB_HOST=localhost\n")
            f.write("DB_PORT=5432\n")
            f.write("DB_NAME=resouniv\n")
            
    print(f"Sample .env file created: {env_file}")

def main():
    parser = argparse.ArgumentParser(description="Set up configuration for RESOUniv application")
    parser.add_argument("--env", choices=["development", "testing", "production"], 
                        default="development", help="Environment to configure")
    parser.add_argument("--output", help="Output file path")
    
    args = parser.parse_args()
    
    # Determine output file path
    if args.output:
        output_file = args.output
    else:
        config_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config")
        os.makedirs(config_dir, exist_ok=True)
        output_file = os.path.join(config_dir, f"{args.env}_config.json")
    
    create_config_file(args.env, output_file)

if __name__ == "__main__":
    main()
