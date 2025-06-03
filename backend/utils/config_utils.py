"""
Configuration utilities for the application.
This module provides helper functions for working with configuration.
"""
import os
import json
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

def load_json_config(file_path: str) -> Dict[str, Any]:
    """
    Load configuration from a JSON file.
    
    Args:
        file_path: Path to the JSON configuration file
        
    Returns:
        Dictionary containing the configuration
        
    Raises:
        FileNotFoundError: If the configuration file doesn't exist
        json.JSONDecodeError: If the file contains invalid JSON
    """
    try:
        with open(file_path, 'r') as f:
            config = json.load(f)
        logger.info(f"Loaded configuration from {file_path}")
        return config
    except FileNotFoundError:
        logger.error(f"Configuration file not found: {file_path}")
        raise
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in configuration file: {file_path}")
        raise

def save_json_config(config: Dict[str, Any], file_path: str) -> None:
    """
    Save configuration to a JSON file.
    
    Args:
        config: Dictionary containing the configuration
        file_path: Path to save the configuration file
    """
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w') as f:
            json.dump(config, f, indent=2)
        logger.info(f"Saved configuration to {file_path}")
    except Exception as e:
        logger.error(f"Failed to save configuration to {file_path}: {str(e)}")
        raise

def get_env_var(name: str, default: Optional[Any] = None, required: bool = False) -> Any:
    """
    Get an environment variable with optional default value.
    
    Args:
        name: Name of the environment variable
        default: Default value if the environment variable is not set
        required: Whether the environment variable is required
        
    Returns:
        Value of the environment variable or default
        
    Raises:
        ValueError: If the environment variable is required but not set
    """
    value = os.environ.get(name)
    
    if value is None:
        if required:
            logger.error(f"Required environment variable {name} is not set")
            raise ValueError(f"Required environment variable {name} is not set")
        logger.debug(f"Using default value for {name}: {default}")
        return default
    
    logger.debug(f"Using environment variable {name}")
    return value

def get_database_url() -> str:
    """
    Construct a database URL from environment variables.
    
    Returns:
        Database URL string
    """
    db_type = get_env_var("DB_TYPE", "sqlite")
    
    if db_type.lower() == "sqlite":
        db_path = get_env_var("DB_PATH", "database.db")
        return f"sqlite:///{db_path}"
    
    elif db_type.lower() in ["mysql", "postgresql", "postgres"]:
        db_user = get_env_var("DB_USER", required=(db_type.lower() != "sqlite"))
        db_password = get_env_var("DB_PASSWORD", required=(db_type.lower() != "sqlite"))
        db_host = get_env_var("DB_HOST", "localhost")
        db_port = get_env_var("DB_PORT", "5432" if db_type.lower() in ["postgresql", "postgres"] else "3306")
        db_name = get_env_var("DB_NAME", required=True)
        
        if db_type.lower() == "mysql":
            return f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        else:  # postgresql
            return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    else:
        logger.error(f"Unsupported database type: {db_type}")
        raise ValueError(f"Unsupported database type: {db_type}")

def parse_list_env_var(name: str, default: Optional[List[str]] = None) -> List[str]:
    """
    Parse a comma-separated environment variable into a list.
    
    Args:
        name: Name of the environment variable
        default: Default value if the environment variable is not set
        
    Returns:
        List of strings
    """
    value = os.environ.get(name)
    
    if not value:
        return default or []
    
    return [item.strip() for item in value.split(',')]

def get_log_level(level_name: Optional[str] = None) -> int:
    """
    Convert a log level name to the corresponding logging level.
    
    Args:
        level_name: Name of the log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        
    Returns:
        Logging level constant
    """
    if not level_name:
        level_name = get_env_var("LOG_LEVEL", "INFO")
        
    level_name = level_name.upper()
    
    levels = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "ERROR": logging.ERROR,
        "CRITICAL": logging.CRITICAL
    }
    
    if level_name not in levels:
        logger.warning(f"Invalid log level: {level_name}. Using INFO.")
        return logging.INFO
    
    return levels[level_name]
