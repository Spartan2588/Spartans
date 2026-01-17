"""
Environmental Risk Synthetic Data Generator

Generates ~1000 samples with realistic correlations for training
the Environmental Risk Model.

Features:
- AQI (0-500): Air Quality Index
- traffic_density (0/1/2): low/medium/high categorical
- temperature (25-45°C): Ambient temperature
- rainfall (0-100mm): Precipitation amount

Correlations modeled:
- Higher traffic → Higher AQI (pollution from vehicles)
- Higher temperature → Slightly higher AQI (ozone formation)
- Higher rainfall → Lower AQI (pollutant washout)

Policy Hook Points:
- Traffic reduction: Modify traffic_density feature
- AQI regulation: Cap AQI values
- Emission control: Scale AQI by reduction factor
"""

import numpy as np
import pandas as pd
from typing import Tuple, Dict, Optional


def generate_environmental_data(
    n_samples: int = 1000,
    random_seed: int = 42,
    # Policy intervention parameters (hooks for simulation)
    traffic_reduction_factor: float = 1.0,  # 0.0-1.0, lower = less traffic
    aqi_cap: Optional[float] = None,  # Max AQI after regulation
    emission_control_factor: float = 1.0,  # 0.0-1.0, lower = less emissions
) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """
    Generate synthetic environmental risk data with policy intervention hooks.
    
    Args:
        n_samples: Number of samples to generate
        random_seed: Seed for reproducibility
        traffic_reduction_factor: Simulates traffic policies (1.0=no change, 0.5=50% reduction)
        aqi_cap: Simulates AQI regulation (e.g., 150 = cap all AQI at 150)
        emission_control_factor: Simulates emission controls (1.0=no change, 0.7=30% reduction)
    
    Returns:
        X: Feature array (n_samples, 4)
        y: Label array (n_samples,) with values 'low', 'medium', 'high'
        df: DataFrame with all features and labels for inspection
    
    Policy Hook Usage Example:
        # Baseline scenario
        X_base, y_base, _ = generate_environmental_data()
        
        # Simulate 30% traffic reduction policy
        X_policy, y_policy, _ = generate_environmental_data(traffic_reduction_factor=0.7)
        
        # Compare model predictions between scenarios
    """
    np.random.seed(random_seed)
    
    # =========================================================================
    # FEATURE GENERATION WITH REALISTIC CORRELATIONS
    # =========================================================================
    
    # Base traffic density (categorical: 0=low, 1=medium, 2=high)
    # Distribution: 30% low, 45% medium, 25% high
    traffic_probs = np.array([0.30, 0.45, 0.25])
    traffic_density = np.random.choice([0, 1, 2], size=n_samples, p=traffic_probs)
    
    # POLICY HOOK: Apply traffic reduction
    # This simulates traffic management policies (e.g., congestion pricing, WFH mandates)
    if traffic_reduction_factor < 1.0:
        # Probabilistically reduce traffic levels
        reduction_mask = np.random.random(n_samples) > traffic_reduction_factor
        traffic_density = np.where(
            reduction_mask & (traffic_density > 0),
            traffic_density - 1,
            traffic_density
        )
    
    # Temperature (25-45°C, normally distributed around 32)
    temperature = np.clip(np.random.normal(32, 5, n_samples), 25, 45)
    
    # Rainfall (0-100mm, right-skewed distribution - most days have low rainfall)
    rainfall = np.clip(np.random.exponential(20, n_samples), 0, 100)
    
    # AQI - correlated with traffic, temperature; inversely with rainfall
    # Base AQI from traffic contribution
    base_aqi = 50 + traffic_density * 40 + np.random.normal(0, 20, n_samples)
    
    # Temperature effect (higher temp = more ozone = higher AQI)
    temp_effect = (temperature - 30) * 2
    
    # Rainfall effect (rain washes out pollutants)
    rain_effect = -rainfall * 0.5
    
    # Combined AQI with noise
    aqi = base_aqi + temp_effect + rain_effect + np.random.normal(0, 30, n_samples)
    
    # POLICY HOOK: Apply emission control factor
    # This simulates emission regulations (e.g., EV mandates, industrial controls)
    aqi = aqi * emission_control_factor
    
    # POLICY HOOK: Apply AQI cap (regulatory ceiling)
    # This simulates air quality emergency measures
    if aqi_cap is not None:
        aqi = np.clip(aqi, 0, aqi_cap)
    
    # Ensure AQI stays in valid range
    aqi = np.clip(aqi, 0, 500)
    
    # =========================================================================
    # RULE-BASED LABELING
    # =========================================================================
    
    labels = []
    for i in range(n_samples):
        # High risk conditions:
        # - Very poor air quality (AQI > 200)
        # - Poor air quality combined with high traffic (AQI > 150 AND traffic == 2)
        if aqi[i] > 200 or (aqi[i] > 150 and traffic_density[i] == 2):
            labels.append('high')
        # Medium risk conditions:
        # - Moderate air quality (AQI > 100)
        # - High traffic regardless of AQI
        elif aqi[i] > 100 or traffic_density[i] == 2:
            labels.append('medium')
        # Low risk: everything else
        else:
            labels.append('low')
    
    # =========================================================================
    # PREPARE OUTPUT
    # =========================================================================
    
    # Feature matrix
    X = np.column_stack([aqi, traffic_density, temperature, rainfall])
    y = np.array(labels)
    
    # DataFrame for inspection
    df = pd.DataFrame({
        'aqi': aqi,
        'traffic_density': traffic_density,
        'temperature': temperature,
        'rainfall': rainfall,
        'risk_label': labels
    })
    
    return X, y, df


def get_feature_names() -> list:
    """Return feature names in order."""
    return ['aqi', 'traffic_density', 'temperature', 'rainfall']


def get_class_names() -> list:
    """Return class names in order."""
    return ['low', 'medium', 'high']


def apply_policy_to_features(
    X: np.ndarray,
    traffic_reduction_factor: float = 1.0,
    aqi_cap: Optional[float] = None,
    emission_control_factor: float = 1.0,
) -> np.ndarray:
    """
    Apply policy interventions to existing feature data.
    
    This is used for scenario analysis - take real/predicted conditions
    and simulate what happens under different policies.
    
    Args:
        X: Feature array (n_samples, 4) with columns [aqi, traffic, temp, rain]
        traffic_reduction_factor: Reduce traffic levels
        aqi_cap: Maximum AQI after regulation
        emission_control_factor: Scale AQI by this factor
    
    Returns:
        X_modified: Feature array with policy effects applied
    """
    X_modified = X.copy()
    
    # Apply traffic reduction
    if traffic_reduction_factor < 1.0:
        # Reduce traffic density probabilistically
        n_samples = X_modified.shape[0]
        reduction_mask = np.random.random(n_samples) > traffic_reduction_factor
        X_modified[:, 1] = np.where(
            reduction_mask & (X_modified[:, 1] > 0),
            X_modified[:, 1] - 1,
            X_modified[:, 1]
        )
        
        # Also reduce AQI proportionally (less traffic = less pollution)
        aqi_reduction = (1 - traffic_reduction_factor) * 0.3  # 30% of traffic effect
        X_modified[:, 0] = X_modified[:, 0] * (1 - aqi_reduction)
    
    # Apply emission controls
    if emission_control_factor < 1.0:
        X_modified[:, 0] = X_modified[:, 0] * emission_control_factor
    
    # Apply AQI cap
    if aqi_cap is not None:
        X_modified[:, 0] = np.clip(X_modified[:, 0], 0, aqi_cap)
    
    return X_modified
