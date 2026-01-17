"""
Input Preprocessing Module

Robust preprocessing for risk model inputs:
- Missing value handling with sensible defaults
- Outlier clipping to valid ranges
- Graceful degradation on errors
- Assumption logging
"""

import numpy as np
from typing import Dict, Any, Optional, List, Tuple
import warnings


# =============================================================================
# DEFAULT VALUES AND VALID RANGES
# =============================================================================

ENVIRONMENTAL_DEFAULTS = {
    'aqi': 100.0,           # Moderate air quality
    'traffic_density': 1,   # Medium traffic
    'temperature': 30.0,    # 30°C
    'rainfall': 20.0        # 20mm
}

ENVIRONMENTAL_RANGES = {
    'aqi': (0, 500),
    'traffic_density': (0, 2),
    'temperature': (0, 50),
    'rainfall': (0, 200)
}

HEALTH_DEFAULTS = {
    'aqi': 100.0,
    'hospital_load': 0.65,          # 65% occupancy
    'respiratory_cases': 200,
    'temperature': 30.0,
    'environmental_risk_prob': 0.5  # Medium env risk
}

HEALTH_RANGES = {
    'aqi': (0, 500),
    'hospital_load': (0.0, 1.0),
    'respiratory_cases': (0, 10000),
    'temperature': (0, 50),
    'environmental_risk_prob': (0.0, 1.0)
}

FOOD_DEFAULTS = {
    'crop_supply_index': 75.0,      # Good supply
    'food_price_index': 100.0,      # Normal prices
    'rainfall': 40.0,
    'temperature': 30.0,
    'supply_disruption_events': 1
}

FOOD_RANGES = {
    'crop_supply_index': (0, 100),
    'food_price_index': (50, 200),
    'rainfall': (0, 200),
    'temperature': (0, 50),
    'supply_disruption_events': (0, 10)
}


# =============================================================================
# PREPROCESSING FUNCTIONS
# =============================================================================

def clip_to_range(value: float, min_val: float, max_val: float) -> float:
    """Clip value to valid range."""
    return max(min_val, min(max_val, value))


def handle_missing(
    value: Any,
    default: Any,
    field_name: str,
    log_warnings: bool = True
) -> Any:
    """Handle missing or None values with defaults."""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        if log_warnings:
            warnings.warn(f"Missing value for '{field_name}', using default: {default}")
        return default
    return value


def preprocess_environmental_metrics(
    metrics: Dict[str, Any],
    log_assumptions: bool = True
) -> Dict[str, float]:
    """
    Preprocess environmental input metrics.
    
    Args:
        metrics: Raw input metrics dictionary
        log_assumptions: Whether to log when defaults are used
    
    Returns:
        Cleaned metrics with valid values
    
    Handles:
        - Missing values → sensible defaults
        - Out-of-range values → clipped to valid range
        - Type conversion errors → defaults
    """
    processed = {}
    assumptions = []
    
    # AQI
    try:
        aqi = handle_missing(
            metrics.get('aqi'), 
            ENVIRONMENTAL_DEFAULTS['aqi'], 
            'aqi',
            log_warnings=False
        )
        aqi = float(aqi)
        aqi = clip_to_range(aqi, *ENVIRONMENTAL_RANGES['aqi'])
        if aqi != metrics.get('aqi'):
            assumptions.append(f"AQI adjusted from {metrics.get('aqi')} to {aqi}")
    except (TypeError, ValueError):
        aqi = ENVIRONMENTAL_DEFAULTS['aqi']
        assumptions.append(f"AQI invalid, using default: {aqi}")
    processed['aqi'] = aqi
    
    # Traffic Density
    try:
        traffic = handle_missing(
            metrics.get('traffic_density'),
            ENVIRONMENTAL_DEFAULTS['traffic_density'],
            'traffic_density',
            log_warnings=False
        )
        traffic = int(round(float(traffic)))
        traffic = clip_to_range(traffic, *ENVIRONMENTAL_RANGES['traffic_density'])
    except (TypeError, ValueError):
        traffic = ENVIRONMENTAL_DEFAULTS['traffic_density']
        assumptions.append(f"Traffic density invalid, using default: {traffic}")
    processed['traffic_density'] = traffic
    
    # Temperature
    try:
        temp = handle_missing(
            metrics.get('temperature'),
            ENVIRONMENTAL_DEFAULTS['temperature'],
            'temperature',
            log_warnings=False
        )
        temp = float(temp)
        # Convert Kelvin to Celsius if needed
        if temp > 200:
            temp = temp - 273.15
            assumptions.append(f"Temperature converted from Kelvin to Celsius: {temp:.1f}°C")
        temp = clip_to_range(temp, *ENVIRONMENTAL_RANGES['temperature'])
    except (TypeError, ValueError):
        temp = ENVIRONMENTAL_DEFAULTS['temperature']
        assumptions.append(f"Temperature invalid, using default: {temp}")
    processed['temperature'] = temp
    
    # Rainfall
    try:
        rain = handle_missing(
            metrics.get('rainfall'),
            ENVIRONMENTAL_DEFAULTS['rainfall'],
            'rainfall',
            log_warnings=False
        )
        rain = float(rain)
        rain = clip_to_range(rain, *ENVIRONMENTAL_RANGES['rainfall'])
    except (TypeError, ValueError):
        rain = ENVIRONMENTAL_DEFAULTS['rainfall']
        assumptions.append(f"Rainfall invalid, using default: {rain}")
    processed['rainfall'] = rain
    
    if log_assumptions and assumptions:
        processed['_assumptions'] = assumptions
    
    return processed


def preprocess_health_metrics(
    metrics: Dict[str, Any],
    env_risk_prob: Optional[float] = None,
    log_assumptions: bool = True
) -> Dict[str, float]:
    """
    Preprocess health input metrics.
    
    Args:
        metrics: Raw input metrics dictionary
        env_risk_prob: Environmental risk probability (cascading input)
        log_assumptions: Whether to log when defaults are used
    
    Returns:
        Cleaned metrics with valid values
    """
    processed = {}
    assumptions = []
    
    # AQI
    try:
        aqi = handle_missing(metrics.get('aqi'), HEALTH_DEFAULTS['aqi'], 'aqi', False)
        aqi = float(aqi)
        aqi = clip_to_range(aqi, *HEALTH_RANGES['aqi'])
    except (TypeError, ValueError):
        aqi = HEALTH_DEFAULTS['aqi']
        assumptions.append(f"AQI invalid, using default: {aqi}")
    processed['aqi'] = aqi
    
    # Hospital Load
    try:
        load = handle_missing(metrics.get('hospital_load'), HEALTH_DEFAULTS['hospital_load'], 'hospital_load', False)
        load = float(load)
        # Convert percentage to decimal if > 1
        if load > 1:
            load = load / 100
            assumptions.append(f"Hospital load converted from percentage: {load:.2f}")
        load = clip_to_range(load, *HEALTH_RANGES['hospital_load'])
    except (TypeError, ValueError):
        load = HEALTH_DEFAULTS['hospital_load']
        assumptions.append(f"Hospital load invalid, using default: {load}")
    processed['hospital_load'] = load
    
    # Respiratory Cases
    try:
        cases = handle_missing(metrics.get('respiratory_cases'), HEALTH_DEFAULTS['respiratory_cases'], 'respiratory_cases', False)
        cases = int(float(cases))
        cases = clip_to_range(cases, *HEALTH_RANGES['respiratory_cases'])
    except (TypeError, ValueError):
        cases = HEALTH_DEFAULTS['respiratory_cases']
        assumptions.append(f"Respiratory cases invalid, using default: {cases}")
    processed['respiratory_cases'] = cases
    
    # Temperature
    try:
        temp = handle_missing(metrics.get('temperature'), HEALTH_DEFAULTS['temperature'], 'temperature', False)
        temp = float(temp)
        if temp > 200:
            temp = temp - 273.15
        temp = clip_to_range(temp, *HEALTH_RANGES['temperature'])
    except (TypeError, ValueError):
        temp = HEALTH_DEFAULTS['temperature']
        assumptions.append(f"Temperature invalid, using default: {temp}")
    processed['temperature'] = temp
    
    # Environmental Risk Probability (cascading input)
    if env_risk_prob is not None:
        processed['environmental_risk_prob'] = clip_to_range(env_risk_prob, 0.0, 1.0)
    else:
        try:
            erp = handle_missing(
                metrics.get('environmental_risk_prob'),
                HEALTH_DEFAULTS['environmental_risk_prob'],
                'environmental_risk_prob',
                False
            )
            erp = float(erp)
            erp = clip_to_range(erp, *HEALTH_RANGES['environmental_risk_prob'])
        except (TypeError, ValueError):
            erp = HEALTH_DEFAULTS['environmental_risk_prob']
            assumptions.append(f"Environmental risk prob invalid, using default: {erp}")
        processed['environmental_risk_prob'] = erp
    
    if log_assumptions and assumptions:
        processed['_assumptions'] = assumptions
    
    return processed


def preprocess_food_metrics(
    metrics: Dict[str, Any],
    log_assumptions: bool = True
) -> Dict[str, float]:
    """
    Preprocess food security input metrics.
    
    Args:
        metrics: Raw input metrics dictionary
        log_assumptions: Whether to log when defaults are used
    
    Returns:
        Cleaned metrics with valid values
    """
    processed = {}
    assumptions = []
    
    # Crop Supply Index
    try:
        supply = handle_missing(metrics.get('crop_supply_index'), FOOD_DEFAULTS['crop_supply_index'], 'crop_supply_index', False)
        supply = float(supply)
        supply = clip_to_range(supply, *FOOD_RANGES['crop_supply_index'])
    except (TypeError, ValueError):
        supply = FOOD_DEFAULTS['crop_supply_index']
        assumptions.append(f"Crop supply index invalid, using default: {supply}")
    processed['crop_supply_index'] = supply
    
    # Food Price Index
    try:
        price = handle_missing(metrics.get('food_price_index'), FOOD_DEFAULTS['food_price_index'], 'food_price_index', False)
        price = float(price)
        price = clip_to_range(price, *FOOD_RANGES['food_price_index'])
    except (TypeError, ValueError):
        price = FOOD_DEFAULTS['food_price_index']
        assumptions.append(f"Food price index invalid, using default: {price}")
    processed['food_price_index'] = price
    
    # Rainfall
    try:
        rain = handle_missing(metrics.get('rainfall'), FOOD_DEFAULTS['rainfall'], 'rainfall', False)
        rain = float(rain)
        rain = clip_to_range(rain, *FOOD_RANGES['rainfall'])
    except (TypeError, ValueError):
        rain = FOOD_DEFAULTS['rainfall']
        assumptions.append(f"Rainfall invalid, using default: {rain}")
    processed['rainfall'] = rain
    
    # Temperature
    try:
        temp = handle_missing(metrics.get('temperature'), FOOD_DEFAULTS['temperature'], 'temperature', False)
        temp = float(temp)
        if temp > 200:
            temp = temp - 273.15
        temp = clip_to_range(temp, *FOOD_RANGES['temperature'])
    except (TypeError, ValueError):
        temp = FOOD_DEFAULTS['temperature']
        assumptions.append(f"Temperature invalid, using default: {temp}")
    processed['temperature'] = temp
    
    # Supply Disruption Events
    try:
        disruptions = handle_missing(metrics.get('supply_disruption_events'), FOOD_DEFAULTS['supply_disruption_events'], 'supply_disruption_events', False)
        disruptions = int(float(disruptions))
        disruptions = clip_to_range(disruptions, *FOOD_RANGES['supply_disruption_events'])
    except (TypeError, ValueError):
        disruptions = FOOD_DEFAULTS['supply_disruption_events']
        assumptions.append(f"Supply disruptions invalid, using default: {disruptions}")
    processed['supply_disruption_events'] = disruptions
    
    if log_assumptions and assumptions:
        processed['_assumptions'] = assumptions
    
    return processed


def preprocess_all_metrics(metrics: Dict[str, Any]) -> Tuple[Dict, Dict, Dict, List[str]]:
    """
    Preprocess all metrics for cascading prediction.
    
    Args:
        metrics: Combined metrics dictionary with all fields
    
    Returns:
        Tuple of (env_metrics, health_metrics, food_metrics, all_assumptions)
    """
    env_metrics = preprocess_environmental_metrics(metrics, log_assumptions=True)
    health_metrics = preprocess_health_metrics(metrics, log_assumptions=True)
    food_metrics = preprocess_food_metrics(metrics, log_assumptions=True)
    
    # Collect all assumptions
    all_assumptions = []
    for m in [env_metrics, health_metrics, food_metrics]:
        if '_assumptions' in m:
            all_assumptions.extend(m.pop('_assumptions'))
    
    return env_metrics, health_metrics, food_metrics, all_assumptions
