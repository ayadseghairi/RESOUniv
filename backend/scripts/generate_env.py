#!/usr/bin/env python3
"""
Environment variable generator for the RESOUniv application.
This script generates a .env file with necessary environment variables.
"""
import os
import sys
import argparse
import secrets
from pathlib import Path

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

def generate_env_file(env, output_file):
    """Generate a .env file for the specified environment."""
    # Generate secure keys
    secret_key = secrets.token_hex(32)
    jwt_secret_key = secrets.token_hex(32)
    
    # Create the content of the .env file
    content = [
        f"# Environment variables for {env} environment",
        f"FLASK_ENV={env}",
        f"SECRET_KEY={secret_key}",
        f"JWT_SECRET_KEY={jwt_secret_key}",
        "",
    ]
    
    # Add environment-specific variables
    if env == "development":
        content.extend([
            "# Database configuration",
            "DB_TYPE=sqlite",
            "DB_PATH=database.db",
            "",
            "# Logging configuration",
            "LOG_LEVEL=DEBUG",
            "LOG_FILE=app.log",
            "",
            "# CORS configuration",
            "CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
        ])
    elif env == "testing":
        content.extend([
            "# Database configuration",
            "DB_TYPE=sqlite",
            "DB_PATH=:memory:",
            "",
            "# Logging configuration",
            "LOG_LEVEL=DEBUG",
            "LOG_FILE=test.log",
        ])
    elif env == "production":
        content.extend([
            "# Database configuration",
            "DB_TYPE=postgresql",
            "DB_USER=user",
            "DB_PASSWORD=password",
            "DB_HOST=localhost",
            "DB_PORT=5432",
            "DB_NAME=resouniv",
            "",
            "# Logging configuration",
            "LOG_LEVEL=INFO",
            "LOG_FILE=/var/log/resouniv/app.log",
            "",
            "# CORS configuration",
            "CORS_ORIGINS=https://yourdomain.com",
        ])
    
    # Write the content to the file
    with open(output_file, "w") as f:
        f.write("\n".join(content))
    
    print(f"Environment file created: {output_file}")
    print("\nIMPORTANT: In production, make sure to update the database credentials and other sensitive information.")

def main():
    parser = argparse.ArgumentParser(description="Generate environment variables for RESOUniv application")
    parser.add_argument("--env", choices=["development", "testing", "production"], 
                        default="development", help="Environment to configure")
    parser.add_argument("--output", help="Output file path")
    
    args = parser.parse_args()
    
    # Determine output file path
    if args.output:
        output_file = args.output
    else:
        output_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), f".env.{args.env}")
    
    generate_env_file(args.env, output_file)

if __name__ == "__main__":
    main()
