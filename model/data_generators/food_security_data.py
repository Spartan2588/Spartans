"""
Food Security Risk Synthetic Data Generator

Generates ~1000 samples for training the Food Security Risk Model.

Features:
- crop_supply_index (40-100): Index of crop availability (100=full supply)
- food_price_index (80-150): Food price relative to baseline (100=normal)
- rainfall (0-100mm): Precipitation (affects agriculture)
- temperature (25-45°C): Temperature (extreme temps hurt crops)
- supply_disruption_events (0-5): Count of supply chain disruptions

Correlations modeled:
- Low rainfall → Lower crop supply
- Extreme temperatures → Lower crop supply
- Low crop supply → Higher food prices
- Supply disruptions → Higher prices and lower supply
"""

import numpy as np
import pandas as pd
from typing import Tuple


def generate_food_security_data(
    n_samples: int = 1000,
    random_seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """
    Generate synthetic food security risk data.
    
    Args:
        n_samples: Number of samples to generate
        random_seed: Seed for reproducibility
    
    Returns:
        X: Feature array (n_samples, 5)
        y: Label array (n_samples,) with values 'low', 'medium', 'high'
        df: DataFrame with all features and labels for inspection
    """
    np.random.seed(random_seed)
    
    # =========================================================================
    # FEATURE GENERATION WITH AGRICULTURAL CORRELATIONS
    # =========================================================================
    
    # Rainfall (0-100mm) - affects crop production
    rainfall = np.clip(np.random.exponential(30, n_samples), 0, 100)
    
    # Temperature (25-45°C)
    temperature = np.clip(np.random.normal(32, 5, n_samples), 25, 45)
    
    # Supply disruption events (0-5) - Poisson distributed
    supply_disruptions = np.clip(np.random.poisson(1.5, n_samples), 0, 5)
    
    # Crop supply index - affected by rainfall, temperature, disruptions
    # Optimal conditions: moderate rainfall (40-60mm), moderate temp (28-35°C)
    base_supply = 80
    
    # Rainfall effect (drought or flood hurts crops)
    rainfall_optimal = 50
    rainfall_effect = -np.abs(rainfall - rainfall_optimal) * 0.3
    
    # Temperature effect (extreme temps hurt crops)
    temp_optimal = 30
    temp_effect = -np.abs(temperature - temp_optimal) * 0.8
    
    # Disruption effect (each event reduces supply)
    disruption_effect = -supply_disruptions * 5
    
    crop_supply = np.clip(
        base_supply + rainfall_effect + temp_effect + disruption_effect + 
        np.random.normal(0, 10, n_samples),
        40, 100
    )
    
    # Food price index - inversely related to supply, affected by disruptions
    # Low supply → High prices (supply/demand)
    base_price = 100
    supply_price_effect = (80 - crop_supply) * 0.8  # Lower supply = higher price
    disruption_price_effect = supply_disruptions * 8  # Disruptions spike prices
    
    food_price = np.clip(
        base_price + supply_price_effect + disruption_price_effect +
        np.random.normal(0, 10, n_samples),
        80, 150
    )
    
    # =========================================================================
    # RULE-BASED LABELING
    # =========================================================================
    
    labels = []
    for i in range(n_samples):
        # High risk conditions:
        # - Very low crop supply
        # - Very high food prices
        # - Multiple supply disruptions
        if crop_supply[i] < 60 or food_price[i] > 130 or supply_disruptions[i] > 3:
            labels.append('high')
        # Medium risk conditions:
        # - Moderately low supply
        # - Moderately high prices
        elif crop_supply[i] < 75 or food_price[i] > 110:
            labels.append('medium')
        # Low risk
        else:
            labels.append('low')
    
    # =========================================================================
    # PREPARE OUTPUT
    # =========================================================================
    
    X = np.column_stack([
        crop_supply, food_price, rainfall, temperature, supply_disruptions
    ])
    y = np.array(labels)
    
    df = pd.DataFrame({
        'crop_supply_index': crop_supply,
        'food_price_index': food_price,
        'rainfall': rainfall,
        'temperature': temperature,
        'supply_disruption_events': supply_disruptions,
        'risk_label': labels
    })
    
    return X, y, df


def get_feature_names() -> list:
    """Return feature names in order."""
    return ['crop_supply_index', 'food_price_index', 'rainfall', 'temperature', 'supply_disruption_events']


def get_class_names() -> list:
    """Return class names in order."""
    return ['low', 'medium', 'high']
