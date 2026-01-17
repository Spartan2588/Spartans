"""
Synthetic Data Generators for Risk Models

Each generator produces reproducible, rule-based labeled data
with realistic correlations between features.

Also includes real data loaders for training on actual datasets.
"""

from .environmental_data import generate_environmental_data
from .health_data import generate_health_data
from .food_security_data import generate_food_security_data
from .real_data_loaders import (
    load_environmental_data,
    load_health_data,
    load_food_security_data,
    load_all_real_data
)

__all__ = [
    'generate_environmental_data',
    'generate_health_data', 
    'generate_food_security_data',
    'load_environmental_data',
    'load_health_data',
    'load_food_security_data',
    'load_all_real_data'
]
