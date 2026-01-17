"""
Real Data Loaders for Risk Models

Loads and preprocesses actual datasets for training:
- Environmental: Traffic + AQI data
- Health: Hospital respiratory data + AQI
- Food Security: Agriculture price data

Replaces synthetic data generation for production models.
"""

import pandas as pd
import numpy as np
from typing import Tuple, Optional
import os


# =============================================================================
# ENVIRONMENTAL DATA LOADER
# =============================================================================

def load_environmental_data(
    traffic_path: str = "datasets/archive1/TrafficVolumeData.csv",
    aqi_path: str = "datasets/archive3/aqi_india_38cols_knn_final.csv",
    sample_size: Optional[int] = 10000
) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """
    Load real environmental data for training.
    
    Data sources:
    - Traffic Volume: Contains AQI, temperature, rain, traffic volume
    - India AQI: Contains detailed pollution metrics
    
    Returns:
        X: Features [aqi, traffic_density, temperature, rainfall]
        y: Labels ['low', 'medium', 'high']
        df: Full DataFrame for inspection
    """
    print("Loading Environmental Data...")
    
    # Traffic data already has most features we need
    df_traffic = pd.read_csv(traffic_path)
    
    # Rename and select columns
    df = df_traffic[['air_pollution_index', 'traffic_volume', 'temperature', 'rain_p_h']].copy()
    df.columns = ['aqi', 'traffic_volume', 'temperature', 'rainfall']
    
    # Drop missing values
    df = df.dropna()
    
    # Convert traffic volume to density categories (low/medium/high)
    # Using percentiles: 0-33% = low(0), 33-66% = medium(1), 66-100% = high(2)
    traffic_p33 = df['traffic_volume'].quantile(0.33)
    traffic_p66 = df['traffic_volume'].quantile(0.66)
    
    df['traffic_density'] = pd.cut(
        df['traffic_volume'],
        bins=[-np.inf, traffic_p33, traffic_p66, np.inf],
        labels=[0, 1, 2]
    ).astype(int)
    
    # Convert temperature from Kelvin to Celsius if needed
    if df['temperature'].mean() > 200:  # Likely Kelvin
        df['temperature'] = df['temperature'] - 273.15
    
    # Create risk labels based on real thresholds
    # Using EPA AQI categories as reference
    def label_risk(row):
        aqi = row['aqi']
        traffic = row['traffic_density']
        
        # High risk: Unhealthy AQI (>150) or very unhealthy (>200)
        if aqi > 200 or (aqi > 150 and traffic == 2):
            return 'high'
        # Medium risk: Moderate to Unhealthy for Sensitive Groups
        elif aqi > 100 or traffic == 2:
            return 'medium'
        # Low risk: Good to Moderate
        else:
            return 'low'
    
    df['risk_label'] = df.apply(label_risk, axis=1)
    
    # Sample if needed
    if sample_size and len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)
    
    # Prepare output
    X = df[['aqi', 'traffic_density', 'temperature', 'rainfall']].values
    y = df['risk_label'].values
    
    print(f"  Loaded {len(df)} samples")
    print(f"  Label distribution: {pd.Series(y).value_counts().to_dict()}")
    
    return X, y, df


# =============================================================================
# HEALTH DATA LOADER
# =============================================================================

def load_health_data(
    hospital_path: str = "raw_weekly_hospital_respiratory_data_2020_2024.csv",
    sample_size: Optional[int] = None
) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """
    Load real health/hospital data for training.
    
    Data source:
    - Hospital Respiratory Data: Bed occupancy, respiratory cases
    
    Features used:
    - Percent Inpatient Beds Occupied (hospital load)
    - Total respiratory cases (COVID + Influenza + RSV)
    - Simulated AQI correlation
    
    Returns:
        X: Features [aqi, hospital_load, respiratory_cases, temperature, env_risk_prob]
        y: Labels ['low', 'medium', 'high']
        df: Full DataFrame for inspection
    """
    print("Loading Health Data...")
    
    df = pd.read_csv(hospital_path)
    
    # Select relevant columns
    cols_to_use = [
        'Percent Inpatient Beds Occupied',
        'Total Patients Hospitalized with COVID-19',
        'Total Patients Hospitalized with Influenza',
        'Total Patients Hospitalized with RSV',
        'Percent ICU Beds Occupied'
    ]
    
    df_health = df[cols_to_use].copy()
    df_health.columns = ['hospital_load', 'covid_cases', 'influenza_cases', 'rsv_cases', 'icu_load']
    
    # Drop missing values
    df_health = df_health.dropna()
    
    # Calculate total respiratory cases
    df_health['respiratory_cases'] = (
        df_health['covid_cases'] + 
        df_health['influenza_cases'] + 
        df_health['rsv_cases']
    )
    
    # Normalize hospital load to 0-1 range if in percentage
    if df_health['hospital_load'].max() > 1:
        df_health['hospital_load'] = df_health['hospital_load'] / 100
    
    # Simulate AQI correlation (in real scenario, would merge with AQI dataset by date/location)
    # Using random values correlated with respiratory cases
    np.random.seed(42)
    base_aqi = 80 + df_health['respiratory_cases'] / df_health['respiratory_cases'].max() * 100
    df_health['aqi'] = np.clip(base_aqi + np.random.normal(0, 20, len(df_health)), 30, 300)
    
    # Simulate temperature (seasonal correlation)
    df_health['temperature'] = np.random.normal(28, 8, len(df_health))
    df_health['temperature'] = np.clip(df_health['temperature'], 10, 45)
    
    # Simulate environmental risk probability (would come from environmental model in Phase 2)
    df_health['env_risk_prob'] = np.clip(
        (df_health['aqi'] - 50) / 200 + np.random.normal(0, 0.1, len(df_health)),
        0, 1
    )
    
    # Create risk labels
    def label_health_risk(row):
        hospital_load = row['hospital_load']
        icu_load = row['icu_load'] / 100 if row['icu_load'] > 1 else row['icu_load']
        resp_cases = row['respiratory_cases']
        
        # Normalize respiratory cases
        resp_normalized = resp_cases / df_health['respiratory_cases'].max()
        
        # High risk: High hospital load or ICU stress
        if hospital_load > 0.85 or icu_load > 0.80 or resp_normalized > 0.7:
            return 'high'
        elif hospital_load > 0.65 or icu_load > 0.60 or resp_normalized > 0.4:
            return 'medium'
        else:
            return 'low'
    
    df_health['risk_label'] = df_health.apply(label_health_risk, axis=1)
    
    # Sample if needed
    if sample_size and len(df_health) > sample_size:
        df_health = df_health.sample(n=sample_size, random_state=42)
    
    # Prepare output
    X = df_health[['aqi', 'hospital_load', 'respiratory_cases', 'temperature', 'env_risk_prob']].values
    y = df_health['risk_label'].values
    
    print(f"  Loaded {len(df_health)} samples")
    print(f"  Label distribution: {pd.Series(y).value_counts().to_dict()}")
    
    return X, y, df_health


# =============================================================================
# FOOD SECURITY DATA LOADER
# =============================================================================

def load_food_security_data(
    agriculture_path: str = "datasets/archive2/Agriculture_price_dataset.csv",
    sample_size: Optional[int] = 10000
) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """
    Load real agriculture/food price data for training.
    
    Data source:
    - Agriculture Price Dataset: Commodity prices across markets
    
    Features derived:
    - crop_supply_index: Inverse of price volatility
    - food_price_index: Normalized modal prices
    - supply_disruption_events: Price spikes count
    
    Returns:
        X: Features [crop_supply, food_price, rainfall, temperature, disruptions]
        y: Labels ['low', 'medium', 'high']
        df: Full DataFrame for inspection
    """
    print("Loading Food Security Data...")
    
    df = pd.read_csv(agriculture_path)
    
    # Convert Price Date to datetime
    df['Price Date'] = pd.to_datetime(df['Price Date'], errors='coerce')
    
    # Filter to have valid prices
    df = df[df['Modal_Price'] > 0].copy()
    
    # Group by date to get daily aggregates
    daily = df.groupby('Price Date').agg({
        'Modal_Price': ['mean', 'std', 'count'],
        'Min_Price': 'mean',
        'Max_Price': 'mean'
    }).reset_index()
    
    daily.columns = ['date', 'avg_price', 'price_std', 'num_markets', 'min_price', 'max_price']
    
    # Drop missing values
    daily = daily.dropna()
    
    if len(daily) < 100:
        print("  Warning: Not enough daily data, using raw aggregates")
        # Use commodity-level aggregation instead
        commodity_agg = df.groupby('Commodity').agg({
            'Modal_Price': ['mean', 'std'],
            'Min_Price': 'mean',
            'Max_Price': 'mean'
        }).reset_index()
        commodity_agg.columns = ['commodity', 'avg_price', 'price_std', 'min_price', 'max_price']
        daily = commodity_agg.dropna()
    
    # Create features
    # Food price index: Normalized to 80-150 range
    price_min, price_max = daily['avg_price'].min(), daily['avg_price'].max()
    daily['food_price_index'] = 80 + (daily['avg_price'] - price_min) / (price_max - price_min) * 70
    
    # Crop supply index: Inverse of price volatility (higher volatility = lower supply stability)
    # Range: 40-100
    if 'price_std' in daily.columns and daily['price_std'].max() > 0:
        vol_normalized = daily['price_std'] / daily['price_std'].max()
        daily['crop_supply_index'] = 100 - vol_normalized * 60
    else:
        daily['crop_supply_index'] = np.random.uniform(50, 90, len(daily))
    
    # Price spread as disruption indicator
    daily['price_spread'] = (daily['max_price'] - daily['min_price']) / daily['avg_price']
    spread_threshold = daily['price_spread'].quantile(0.7)
    daily['supply_disruption_events'] = (daily['price_spread'] > spread_threshold).astype(int) * np.random.randint(1, 4, len(daily))
    
    # Simulate weather data (would need separate weather dataset for real implementation)
    np.random.seed(42)
    daily['rainfall'] = np.clip(np.random.exponential(30, len(daily)), 0, 100)
    daily['temperature'] = np.clip(np.random.normal(30, 6, len(daily)), 20, 45)
    
    # Create risk labels
    def label_food_risk(row):
        supply = row['crop_supply_index']
        price = row['food_price_index']
        disruptions = row['supply_disruption_events']
        
        # High risk: Low supply, high prices, or many disruptions
        if supply < 60 or price > 130 or disruptions >= 3:
            return 'high'
        elif supply < 75 or price > 110 or disruptions >= 2:
            return 'medium'
        else:
            return 'low'
    
    daily['risk_label'] = daily.apply(label_food_risk, axis=1)
    
    # Sample if needed
    if sample_size and len(daily) > sample_size:
        daily = daily.sample(n=sample_size, random_state=42)
    
    # Prepare output
    X = daily[['crop_supply_index', 'food_price_index', 'rainfall', 'temperature', 'supply_disruption_events']].values
    y = daily['risk_label'].values
    
    print(f"  Loaded {len(daily)} samples")
    print(f"  Label distribution: {pd.Series(y).value_counts().to_dict()}")
    
    return X, y, daily


# =============================================================================
# MAIN LOADER FUNCTION
# =============================================================================

def load_all_real_data() -> dict:
    """
    Load all real datasets for model training.
    
    Returns:
        Dictionary with X, y, df for each model type
    """
    data = {}
    
    print("=" * 60)
    print("LOADING REAL TRAINING DATA")
    print("=" * 60)
    
    # Environmental
    X_env, y_env, df_env = load_environmental_data()
    data['environmental'] = {'X': X_env, 'y': y_env, 'df': df_env}
    
    # Health
    X_health, y_health, df_health = load_health_data()
    data['health'] = {'X': X_health, 'y': y_health, 'df': df_health}
    
    # Food Security
    X_food, y_food, df_food = load_food_security_data()
    data['food'] = {'X': X_food, 'y': y_food, 'df': df_food}
    
    print("\n" + "=" * 60)
    print("DATA LOADING COMPLETE")
    print("=" * 60)
    
    return data


if __name__ == "__main__":
    data = load_all_real_data()
    
    print("\nData shapes:")
    for name, d in data.items():
        print(f"  {name}: X={d['X'].shape}, y={d['y'].shape}")
