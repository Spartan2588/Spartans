"""
Dataset Column Analyzer
"""
import pandas as pd

print("=" * 60)
print("AVAILABLE DATASETS AND COLUMNS")
print("=" * 60)

# 1. Traffic Data
print("\n[1] TRAFFIC VOLUME DATA")
print("-" * 40)
df = pd.read_csv('datasets/archive1/TrafficVolumeData.csv', nrows=10)
print(f"Shape: {df.shape}")
print("Columns:")
for col in df.columns:
    print(f"  - {col}")
print("\nSample values:")
print(df.head(3).to_string())

# 2. Agriculture Data  
print("\n\n[2] AGRICULTURE PRICE DATA")
print("-" * 40)
df = pd.read_csv('datasets/archive2/Agriculture_price_dataset.csv', nrows=10)
print(f"Shape: {df.shape}")
print("Columns:")
for col in df.columns:
    print(f"  - {col}")
print("\nSample values:")
print(df.head(3).to_string())

# 3. AQI Data
print("\n\n[3] INDIA AQI DATA")
print("-" * 40)
df = pd.read_csv('datasets/archive3/aqi_india_38cols_knn_final.csv', nrows=10)
print(f"Shape: {df.shape}")
print("Columns:")
for col in df.columns:
    print(f"  - {col}")
print("\nSample values (first 8 columns):")
print(df.iloc[:3, :8].to_string())

# 4. Hospital Data
print("\n\n[4] HOSPITAL RESPIRATORY DATA")
print("-" * 40)
df = pd.read_csv('raw_weekly_hospital_respiratory_data_2020_2024.csv', nrows=10)
print(f"Shape: {df.shape}")
print("Columns:")
for col in df.columns:
    print(f"  - {col}")
print("\nSample values (first 6 columns):")
print(df.iloc[:3, :6].to_string())

print("\n" + "=" * 60)
print("DATASET SUMMARY")
print("=" * 60)
print("""
ENVIRONMENTAL MODEL needs:
  - AQI data (from aqi_india dataset)
  - Traffic density (from TrafficVolumeData)
  - Temperature (may be in AQI dataset)
  - Rainfall (may need to derive or use weather data)

HEALTH MODEL needs:
  - AQI data
  - Hospital load (from hospital respiratory data)
  - Respiratory cases (from hospital data)
  - Temperature

FOOD SECURITY MODEL needs:
  - Crop supply index (derive from Agriculture prices)
  - Food price index (from Agriculture prices)
  - Rainfall
  - Temperature
  - Supply disruption events (derive from price volatility)
""")
