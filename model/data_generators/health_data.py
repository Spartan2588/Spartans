"""
Health Risk Synthetic Data Generator

Generates ~1000 samples for training the Health Risk Model.
Key feature: Includes environmental_risk_prob as input for cascading logic.

Features:
- AQI (0-500): Air Quality Index (same as environmental)
- hospital_load (0.4-0.95): Hospital capacity utilization
- respiratory_cases (50-400): Daily respiratory case count
- temperature (25-45°C): Ambient temperature
- environmental_risk_prob (0-1): Probability from environmental model (cascading!)

Correlations modeled:
- Higher AQI → More respiratory cases
- Higher env_risk_prob → Higher health risk (cascading effect)
- Higher hospital load → Amplifies risk from other factors
"""

import numpy as np
import pandas as pd
from typing import Tuple, Optional


def generate_health_data(
    n_samples: int = 1000,
    random_seed: int = 42,
    # These parameters simulate cascading from environmental model
    base_env_risk_prob: Optional[np.ndarray] = None,
) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """
    Generate synthetic health risk data with cascading environmental input.
    
    Args:
        n_samples: Number of samples to generate
        random_seed: Seed for reproducibility
        base_env_risk_prob: Pre-computed environmental risk probabilities.
                           If None, generates synthetic probabilities.
    
    Returns:
        X: Feature array (n_samples, 5)
        y: Label array (n_samples,) with values 'low', 'medium', 'high'
        df: DataFrame with all features and labels for inspection
    
    Cascading Logic:
        The environmental_risk_prob feature creates a causal link between
        environmental conditions and health outcomes. When the environmental
        model predicts high risk, this propagates to increase health risk.
    """
    np.random.seed(random_seed)
    
    # =========================================================================
    # FEATURE GENERATION
    # =========================================================================
    
    # AQI - similar distribution to environmental data
    aqi = np.clip(np.random.normal(120, 60, n_samples), 0, 500)
    
    # Hospital load (0.4-0.95) - tends toward higher values
    hospital_load = np.clip(np.random.beta(5, 3, n_samples) * 0.6 + 0.35, 0.4, 0.95)
    
    # Temperature
    temperature = np.clip(np.random.normal(32, 5, n_samples), 25, 45)
    
    # Respiratory cases - correlated with AQI
    # Base cases + AQI effect + random noise
    base_cases = 100
    aqi_effect = aqi * 0.5  # Higher AQI = more cases
    respiratory_cases = np.clip(
        base_cases + aqi_effect + np.random.normal(0, 50, n_samples),
        50, 400
    ).astype(int)
    
    # Environmental risk probability (CASCADING INPUT)
    if base_env_risk_prob is not None:
        # Use provided probabilities (from actual environmental model)
        env_risk_prob = base_env_risk_prob
    else:
        # Generate synthetic probabilities correlated with AQI
        # This simulates what the environmental model would output
        env_risk_prob = np.clip(
            (aqi - 50) / 300 + np.random.normal(0, 0.1, n_samples),
            0, 1
        )
    
    # =========================================================================
    # RULE-BASED LABELING WITH CASCADING LOGIC
    # =========================================================================
    
    labels = []
    for i in range(n_samples):
        # High risk conditions (CASCADING EFFECT):
        # - High environmental risk AND stressed hospital system
        # - Very high hospital load alone
        # - Extreme respiratory case count
        if (env_risk_prob[i] > 0.7 and hospital_load[i] > 0.75) or \
           hospital_load[i] > 0.90 or \
           respiratory_cases[i] > 350:
            labels.append('high')
        # Medium risk conditions:
        # - Moderate environmental risk
        # - Moderate hospital load
        # - Elevated respiratory cases
        elif env_risk_prob[i] > 0.5 or \
             hospital_load[i] > 0.65 or \
             respiratory_cases[i] > 250:
            labels.append('medium')
        # Low risk
        else:
            labels.append('low')
    
    # =========================================================================
    # PREPARE OUTPUT
    # =========================================================================
    
    X = np.column_stack([
        aqi, hospital_load, respiratory_cases, temperature, env_risk_prob
    ])
    y = np.array(labels)
    
    df = pd.DataFrame({
        'aqi': aqi,
        'hospital_load': hospital_load,
        'respiratory_cases': respiratory_cases,
        'temperature': temperature,
        'environmental_risk_prob': env_risk_prob,
        'risk_label': labels
    })
    
    return X, y, df


def get_feature_names() -> list:
    """Return feature names in order."""
    return ['aqi', 'hospital_load', 'respiratory_cases', 'temperature', 'environmental_risk_prob']


def get_class_names() -> list:
    """Return class names in order."""
    return ['low', 'medium', 'high']
