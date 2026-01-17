"""
ML Engine Singleton for API.
Loads the heavy CascadingRiskEngine once at startup.
"""

from typing import Optional
from model.cascading_engine import CascadingRiskEngine
from pathlib import Path
import os

class MLEngine:
    _instance: Optional[CascadingRiskEngine] = None
    
    @classmethod
    def get_instance(cls) -> CascadingRiskEngine:
        """
        Get or initialize the singleton CascadingRiskEngine instance.
        """
        if cls._instance is None:
            print("Initializing CascadingRiskEngine...")
            
            # Ensure we're in the project root context
            # (path hacks might be needed depending on where api is run from)
            current_dir = Path.cwd()
            
            try:
                cls._instance = CascadingRiskEngine(
                    use_real_data=True,
                    auto_train=True
                )
                print("CascadingRiskEngine initialized successfully.")
            except Exception as e:
                print(f"Error initializing CascadingRiskEngine: {e}")
                # Fallback to no-op or re-raise depending on strictness
                raise e
                
        return cls._instance
    
    @classmethod
    def reload(cls):
        """Force reload of the engine."""
        cls._instance = None
        return cls.get_instance()
