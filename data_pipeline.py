"""
Urban Intelligence Platform - Data Pipeline
Ingests, processes, and stores multi-domain datasets for smart city analytics.
"""

import pandas as pd
import numpy as np
import sqlite3
from datetime import datetime, timedelta
import os
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')


class DataIngestion:
    """Handles loading of CSV datasets from different domains."""

    def __init__(self, data_dir='.'):
        self.data_dir = Path(data_dir)

    def load_traffic_data(self, filepath='datasets/archive1/TrafficVolumeData.csv'):
        """Load traffic volume dataset."""
        print(f"Loading traffic data from {filepath}...")
        df = pd.read_csv(self.data_dir / filepath)
        df['date_time'] = pd.to_datetime(df['date_time'], errors='coerce')
        return df

    def load_air_quality_data(self, filepath='datasets/archive3/aqi_india_38cols_knn_final.csv'):
        """Load air quality dataset."""
        print(f"Loading air quality data from {filepath}...")
        df = pd.read_csv(self.data_dir / filepath, low_memory=False)
        df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce')
        return df

    def load_respiratory_data(self, filepath='raw_weekly_hospital_respiratory_data_2020_2024.csv'):
        """Load hospital respiratory data."""
        print(f"Loading respiratory data from {filepath}...")
        df = pd.read_csv(self.data_dir / filepath, low_memory=False)
        df['Week Ending Date'] = pd.to_datetime(df['Week Ending Date'], errors='coerce')
        return df

    def load_agriculture_data(self, filepath='datasets/archive2/Agriculture_price_dataset.csv'):
        """Load agricultural mandi prices dataset."""
        print(f"Loading agriculture data from {filepath}...")
        df = pd.read_csv(self.data_dir / filepath, low_memory=False)
        # Handle different date formats
        df['Price Date'] = pd.to_datetime(df['Price Date'], errors='coerce', format='%m/%d/%Y')
        return df


class DataCleaner:
    """Cleans and normalizes data across different domains."""

    @staticmethod
    def clean_traffic_data(df):
        """Clean traffic volume data."""
        print("Cleaning traffic data...")
        df_clean = df.copy()

        # Remove rows with invalid dates
        df_clean = df_clean.dropna(subset=['date_time'])

        # Handle missing values in key columns
        numeric_cols = ['traffic_volume', 'temperature', 'humidity', 'wind_speed', 'air_pollution_index']
        for col in numeric_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
                df_clean[col] = df_clean[col].fillna(df_clean[col].median())

        # Convert temperature from Kelvin to Celsius if needed
        if 'temperature' in df_clean.columns:
            if df_clean['temperature'].mean() > 200:  # Likely in Kelvin
                df_clean['temperature'] = df_clean['temperature'] - 273.15

        return df_clean

    @staticmethod
    def clean_air_quality_data(df):
        """Clean air quality data."""
        print("Cleaning air quality data...")
        df_clean = df.copy()

        # Remove rows with invalid dates
        df_clean = df_clean.dropna(subset=['datetime'])

        # Handle missing values in key pollution metrics
        pollution_cols = ['us_aqi', 'pm2_5_ugm3', 'pm10_ugm3', 'co_ugm3', 'no2_ugm3', 'so2_ugm3', 'o3_ugm3']
        for col in pollution_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
                # Fill missing with median by city
                if 'city' in df_clean.columns:
                    df_clean[col] = df_clean.groupby('city')[col].transform(
                        lambda x: x.fillna(x.median())
                    )
                else:
                    df_clean[col] = df_clean[col].fillna(df_clean[col].median())

        return df_clean

    @staticmethod
    def clean_respiratory_data(df):
        """Clean hospital respiratory data."""
        print("Cleaning respiratory data...")
        df_clean = df.copy()

        # Remove rows with invalid dates
        df_clean = df_clean.dropna(subset=['Week Ending Date'])

        # Key columns for analysis
        key_cols = [
            'Total Patients Hospitalized with COVID-19',
            'Total Patients Hospitalized with Influenza',
            'Total Patients Hospitalized with RSV',
            'Percent Inpatient Beds Occupied',
            'Number of Inpatient Beds'
        ]

        for col in key_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
                df_clean[col] = df_clean[col].fillna(0)

        return df_clean

    @staticmethod
    def clean_agriculture_data(df):
        """Clean agriculture price data."""
        print("Cleaning agriculture data...")
        df_clean = df.copy()

        # Remove rows with invalid dates or prices
        df_clean = df_clean.dropna(subset=['Price Date'])

        # Clean price columns
        price_cols = ['Min_Price', 'Max_Price', 'Modal_Price']
        for col in price_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
                # Remove outliers (prices > 0)
                df_clean = df_clean[(df_clean[col] > 0) | df_clean[col].isna()]

        # Fill missing prices with modal price if available
        if 'Modal_Price' in df_clean.columns:
            for col in ['Min_Price', 'Max_Price']:
                if col in df_clean.columns:
                    df_clean[col] = df_clean[col].fillna(df_clean['Modal_Price'])

        return df_clean


class FeatureEngineer:
    """Engineers domain-specific features for analytics."""

    @staticmethod
    def engineer_traffic_features(df):
        """Engineer traffic congestion index and related features."""
        print("Engineering traffic features...")
        df_fe = df.copy()

        # Traffic Congestion Index (normalized 0-100)
        if 'traffic_volume' in df_fe.columns:
            traffic_max = df_fe['traffic_volume'].quantile(0.95)  # Use 95th percentile to avoid outliers
            traffic_min = df_fe['traffic_volume'].quantile(0.05)
            df_fe['traffic_congestion_index'] = (
                (df_fe['traffic_volume'] - traffic_min) / (traffic_max - traffic_min) * 100
            ).clip(0, 100)

        # Extract temporal features
        if 'date_time' in df_fe.columns:
            df_fe['date'] = df_fe['date_time'].dt.date
            df_fe['hour'] = df_fe['date_time'].dt.hour
            df_fe['day_of_week'] = df_fe['date_time'].dt.dayofweek
            df_fe['is_weekend'] = df_fe['day_of_week'].isin([5, 6])
            df_fe['month'] = df_fe['date_time'].dt.month

        return df_fe

    @staticmethod
    def engineer_aqi_features(df):
        """Engineer AQI severity score and pollution indicators."""
        print("Engineering AQI features...")
        df_fe = df.copy()

        # AQI Severity Score (normalized 0-100, higher = worse)
        if 'us_aqi' in df_fe.columns:
            # US AQI categories: Good (0-50), Moderate (51-100), Unhealthy for Sensitive (101-150),
            # Unhealthy (151-200), Very Unhealthy (201-300), Hazardous (301+)
            df_fe['aqi_severity_score'] = np.clip(df_fe['us_aqi'], 0, 500) / 5  # Scale to 0-100

            # Categorical severity
            conditions = [
                df_fe['us_aqi'] <= 50,
                df_fe['us_aqi'] <= 100,
                df_fe['us_aqi'] <= 150,
                df_fe['us_aqi'] <= 200,
                df_fe['us_aqi'] <= 300
            ]
            choices = ['Good', 'Moderate', 'Unhealthy_Sensitive', 'Unhealthy', 'Very_Unhealthy']
            df_fe['aqi_severity_category'] = np.select(conditions, choices, default='Hazardous')

        # Composite pollution index (weighted average of key pollutants)
        pollution_cols = ['pm2_5_ugm3', 'pm10_ugm3', 'no2_ugm3', 'o3_ugm3']
        available_cols = [col for col in pollution_cols if col in df_fe.columns]
        if available_cols:
            # Normalize each pollutant (assuming safe levels as reference)
            for col in available_cols:
                col_normalized = f"{col}_normalized"
                if 'pm2_5' in col:
                    safe_level = 35  # WHO guideline
                elif 'pm10' in col:
                    safe_level = 70
                elif 'no2' in col:
                    safe_level = 40
                elif 'o3' in col:
                    safe_level = 100
                else:
                    safe_level = df_fe[col].quantile(0.75)
                df_fe[col_normalized] = (df_fe[col] / safe_level) * 100
                df_fe[col_normalized] = df_fe[col_normalized].fillna(0)

        # Extract temporal features
        if 'datetime' in df_fe.columns:
            df_fe['date'] = df_fe['datetime'].dt.date
            df_fe['hour'] = df_fe['datetime'].dt.hour
            df_fe['day_of_week'] = df_fe['datetime'].dt.dayofweek
            df_fe['month'] = df_fe['datetime'].dt.month

        return df_fe

    @staticmethod
    def engineer_respiratory_features(df):
        """Engineer respiratory risk indicators."""
        print("Engineering respiratory features...")
        df_fe = df.copy()

        # Total respiratory cases (COVID + Influenza + RSV)
        respiratory_cols = [
            'Total Patients Hospitalized with COVID-19',
            'Total Patients Hospitalized with Influenza',
            'Total Patients Hospitalized with RSV'
        ]

        available_cols = [col for col in respiratory_cols if col in df_fe.columns]
        if available_cols:
            df_fe['total_respiratory_cases'] = df_fe[available_cols].sum(axis=1)
        else:
            df_fe['total_respiratory_cases'] = 0

        # Respiratory Risk Index (normalized 0-100)
        if 'total_respiratory_cases' in df_fe.columns:
            max_cases = df_fe['total_respiratory_cases'].quantile(0.95)
            min_cases = df_fe['total_respiratory_cases'].quantile(0.05)
            if max_cases > min_cases:
                df_fe['respiratory_risk_index'] = (
                    (df_fe['total_respiratory_cases'] - min_cases) / (max_cases - min_cases) * 100
                ).clip(0, 100)
            else:
                df_fe['respiratory_risk_index'] = 0

        # Bed occupancy pressure
        if 'Percent Inpatient Beds Occupied' in df_fe.columns:
            df_fe['bed_occupancy_pressure'] = df_fe['Percent Inpatient Beds Occupied'] / 100

        # Extract temporal features
        if 'Week Ending Date' in df_fe.columns:
            df_fe['date'] = df_fe['Week Ending Date'].dt.date
            df_fe['week'] = df_fe['Week Ending Date'].dt.isocalendar().week
            df_fe['month'] = df_fe['Week Ending Date'].dt.month
            df_fe['year'] = df_fe['Week Ending Date'].dt.year

        return df_fe

    @staticmethod
    def engineer_agriculture_features(df):
        """Engineer agricultural price volatility metrics."""
        print("Engineering agriculture features...")
        df_fe = df.copy()

        # Price volatility (coefficient of variation)
        if all(col in df_fe.columns for col in ['Min_Price', 'Max_Price', 'Modal_Price']):
            df_fe['price_range'] = df_fe['Max_Price'] - df_fe['Min_Price']
            df_fe['price_volatility'] = df_fe['price_range'] / (df_fe['Modal_Price'] + 1)  # Add 1 to avoid division by zero

        # Calculate rolling volatility by commodity and market
        df_fe = df_fe.sort_values(['Commodity', 'Market Name', 'Price Date'])

        volatility_window = 30  # 30-day window
        # Calculate rolling statistics grouped by commodity and market
        df_fe['price_std_30d'] = df_fe.groupby(['Commodity', 'Market Name'])['Modal_Price'].transform(
            lambda x: x.rolling(window=volatility_window, min_periods=1).std()
        )
        df_fe['price_mean_30d'] = df_fe.groupby(['Commodity', 'Market Name'])['Modal_Price'].transform(
            lambda x: x.rolling(window=volatility_window, min_periods=1).mean()
        )
        df_fe['price_volatility_30d'] = df_fe['price_std_30d'] / (df_fe['price_mean_30d'] + 1)
        df_fe = df_fe.drop(columns=['price_std_30d', 'price_mean_30d'])

        # Price change indicators
        if 'Modal_Price' in df_fe.columns:
            df_fe = df_fe.sort_values(['Commodity', 'Market Name', 'Price Date'])
            df_fe['price_change_pct'] = df_fe.groupby(['Commodity', 'Market Name'])[
                'Modal_Price'
            ].pct_change() * 100

        # Extract temporal features
        if 'Price Date' in df_fe.columns:
            df_fe['date'] = df_fe['Price Date'].dt.date
            df_fe['month'] = df_fe['Price Date'].dt.month
            df_fe['year'] = df_fe['Price Date'].dt.year
            df_fe['day_of_week'] = df_fe['Price Date'].dt.dayofweek

        return df_fe


class DataAggregator:
    """Aggregates data to common time granularity (daily/weekly) for cross-domain analysis."""

    @staticmethod
    def aggregate_to_daily(df, date_col, value_cols, agg_dict=None):
        """Aggregate data to daily level."""
        if agg_dict is None:
            agg_dict = {col: 'mean' for col in value_cols if col in df.columns}

        df_daily = df.copy()
        df_daily['date'] = pd.to_datetime(df_daily[date_col]).dt.date

        # Group by date and aggregate
        grouped = df_daily.groupby('date')

        aggregated = {}
        for col, func in agg_dict.items():
            if col in df_daily.columns:
                aggregated[col] = grouped[col].agg(func)

        df_result = pd.DataFrame(aggregated).reset_index()
        df_result['date'] = pd.to_datetime(df_result['date'])

        return df_result


class DatabaseManager:
    """Manages SQLite database operations."""

    def __init__(self, db_path='urban_intelligence.db'):
        self.db_path = db_path
        self.conn = None

    def connect(self):
        """Establish database connection."""
        self.conn = sqlite3.connect(self.db_path)
        return self.conn

    def create_schema(self):
        """Create database schema for all domain tables."""
        print("Creating database schema...")
        cursor = self.conn.cursor()

        # Traffic data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS traffic_daily (
                date DATE PRIMARY KEY,
                avg_traffic_volume REAL,
                avg_traffic_congestion_index REAL,
                avg_temperature REAL,
                avg_humidity REAL,
                avg_wind_speed REAL,
                avg_air_pollution_index REAL,
                record_count INTEGER
            )
        ''')

        # Air quality table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS air_quality_daily (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE,
                city TEXT,
                state TEXT,
                avg_us_aqi REAL,
                avg_aqi_severity_score REAL,
                avg_pm2_5 REAL,
                avg_pm10 REAL,
                avg_no2 REAL,
                avg_o3 REAL,
                aqi_severity_category TEXT,
                record_count INTEGER,
                UNIQUE(date, city, state)
            )
        ''')

        # Respiratory data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS respiratory_weekly (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                week_ending_date DATE,
                geographic_aggregation TEXT,
                total_respiratory_cases INTEGER,
                respiratory_risk_index REAL,
                total_covid19_cases INTEGER,
                total_influenza_cases INTEGER,
                total_rsv_cases INTEGER,
                bed_occupancy_percent REAL,
                bed_occupancy_pressure REAL,
                UNIQUE(week_ending_date, geographic_aggregation)
            )
        ''')

        # Agriculture data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS agriculture_daily (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE,
                state TEXT,
                district TEXT,
                market_name TEXT,
                commodity TEXT,
                variety TEXT,
                min_price REAL,
                max_price REAL,
                modal_price REAL,
                price_range REAL,
                price_volatility REAL,
                price_volatility_30d REAL,
                price_change_pct REAL,
                UNIQUE(date, market_name, commodity, variety)
            )
        ''')

        # Cross-domain analytics view (daily aggregated)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analytics_daily (
                date DATE PRIMARY KEY,
                avg_traffic_congestion_index REAL,
                avg_aqi_severity_score REAL,
                avg_respiratory_risk_index REAL,
                avg_price_volatility REAL,
                data_availability_flags TEXT
            )
        ''')

        self.conn.commit()
        print("Database schema created successfully.")

    def insert_traffic_daily(self, df):
        """Insert aggregated daily traffic data."""
        print("Inserting traffic data...")
        df['date'] = pd.to_datetime(df['date'])
        df.to_sql('traffic_daily', self.conn, if_exists='replace', index=False)

    def insert_air_quality_daily(self, df):
        """Insert aggregated daily air quality data."""
        print("Inserting air quality data...")
        df['date'] = pd.to_datetime(df['date'])
        df.to_sql('air_quality_daily', self.conn, if_exists='replace', index=False)

    def insert_respiratory_weekly(self, df):
        """Insert weekly respiratory data."""
        print("Inserting respiratory data...")
        df['week_ending_date'] = pd.to_datetime(df['Week Ending Date'])
        df.to_sql('respiratory_weekly', self.conn, if_exists='replace', index=False)

    def insert_agriculture_daily(self, df):
        """Insert daily agriculture data."""
        print("Inserting agriculture data...")
        df['date'] = pd.to_datetime(df['date'])
        df.to_sql('agriculture_daily', self.conn, if_exists='replace', index=False)

    def create_analytics_view(self):
        """Create cross-domain analytics by aggregating all domains to daily level."""
        print("Creating cross-domain analytics view...")
        cursor = self.conn.cursor()

        # Get traffic data
        traffic_query = '''
            SELECT date, avg_traffic_congestion_index
            FROM traffic_daily
        '''
        traffic_df = pd.read_sql_query(traffic_query, self.conn)

        # Get air quality data (aggregated by date, averaging across cities)
        aq_query = '''
            SELECT date, AVG(avg_aqi_severity_score) as avg_aqi_severity_score
            FROM air_quality_daily
            GROUP BY date
        '''
        aq_df = pd.read_sql_query(aq_query, self.conn)

        # Get respiratory data (convert weekly to daily, forward fill)
        resp_query = '''
            SELECT week_ending_date as date, AVG(respiratory_risk_index) as avg_respiratory_risk_index
            FROM respiratory_weekly
            GROUP BY week_ending_date
        '''
        resp_df = pd.read_sql_query(resp_query, self.conn)

        # Get agriculture data (aggregated by date)
        agri_query = '''
            SELECT date, AVG(price_volatility_30d) as avg_price_volatility
            FROM agriculture_daily
            WHERE price_volatility_30d IS NOT NULL
            GROUP BY date
        '''
        agri_df = pd.read_sql_query(agri_query, self.conn)

        # Merge all dataframes on date
        all_dfs = [traffic_df, aq_df, resp_df, agri_df]
        non_empty_dfs = [df for df in all_dfs if not df.empty]
        
        if non_empty_dfs:
            analytics_df = pd.DataFrame({'date': pd.date_range(
                start=min([df['date'].min() for df in non_empty_dfs]),
                end=max([df['date'].max() for df in non_empty_dfs]),
                freq='D'
            )})

            analytics_df['date'] = pd.to_datetime(analytics_df['date'])

            for df, col in [(traffic_df, 'avg_traffic_congestion_index'),
                            (aq_df, 'avg_aqi_severity_score'),
                            (resp_df, 'avg_respiratory_risk_index'),
                            (agri_df, 'avg_price_volatility')]:
                if not df.empty:
                    df['date'] = pd.to_datetime(df['date'])
                    analytics_df = analytics_df.merge(df[['date', col]], on='date', how='left')

            # Create data availability flags
            analytics_df['data_availability_flags'] = (
                analytics_df['avg_traffic_congestion_index'].notna().astype(int).astype(str) +
                analytics_df['avg_aqi_severity_score'].notna().astype(int).astype(str) +
                analytics_df['avg_respiratory_risk_index'].notna().astype(int).astype(str) +
                analytics_df['avg_price_volatility'].notna().astype(int).astype(str)
            )

            # Insert into analytics table
            analytics_df.to_sql('analytics_daily', self.conn, if_exists='replace', index=False)

            print(f"Analytics view created with {len(analytics_df)} daily records.")
        else:
            print("No data available to create analytics view.")

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()


def main():
    """Main pipeline execution."""
    print("=" * 60)
    print("Urban Intelligence Platform - Data Pipeline")
    print("=" * 60)

    # Initialize components
    ingestion = DataIngestion()
    cleaner = DataCleaner()
    feature_engineer = FeatureEngineer()
    aggregator = DataAggregator()
    db_manager = DatabaseManager()

    # Connect to database
    db_manager.connect()
    db_manager.create_schema()

    try:
        # 1. Ingest and process Traffic Data
        print("\n[1/4] Processing Traffic Data...")
        traffic_df = ingestion.load_traffic_data()
        traffic_df = cleaner.clean_traffic_data(traffic_df)
        traffic_df = feature_engineer.engineer_traffic_features(traffic_df)

        # Aggregate to daily
        traffic_daily = aggregator.aggregate_to_daily(
            traffic_df,
            'date_time',
            ['traffic_volume', 'traffic_congestion_index', 'temperature', 'humidity', 
             'wind_speed', 'air_pollution_index'],
            {
                'traffic_volume': 'mean',
                'traffic_congestion_index': 'mean',
                'temperature': 'mean',
                'humidity': 'mean',
                'wind_speed': 'mean',
                'air_pollution_index': 'mean'
            }
        )
        traffic_daily.rename(columns={
            'traffic_volume': 'avg_traffic_volume',
            'traffic_congestion_index': 'avg_traffic_congestion_index',
            'temperature': 'avg_temperature',
            'humidity': 'avg_humidity',
            'wind_speed': 'avg_wind_speed',
            'air_pollution_index': 'avg_air_pollution_index'
        }, inplace=True)
        # Calculate record count properly by merging
        record_counts = traffic_df.groupby(traffic_df['date_time'].dt.date).size().reset_index(name='record_count')
        record_counts.rename(columns={'date_time': 'date'}, inplace=True)
        record_counts['date'] = pd.to_datetime(record_counts['date'])
        traffic_daily = traffic_daily.merge(record_counts[['date', 'record_count']], on='date', how='left')
        traffic_daily['record_count'] = traffic_daily['record_count'].fillna(0).astype(int)
        db_manager.insert_traffic_daily(traffic_daily)

        # 2. Ingest and process Air Quality Data
        print("\n[2/4] Processing Air Quality Data...")
        aq_df = ingestion.load_air_quality_data()
        # Sample data if too large (for performance)
        if len(aq_df) > 500000:
            print(f"Sampling {len(aq_df)} records to 500K for performance...")
            aq_df = aq_df.sample(n=500000, random_state=42)
        aq_df = cleaner.clean_air_quality_data(aq_df)
        aq_df = feature_engineer.engineer_aqi_features(aq_df)

        # Aggregate to daily by city/state
        aq_daily = aq_df.groupby(['date', 'city', 'state']).agg({
            'us_aqi': 'mean',
            'aqi_severity_score': 'mean',
            'pm2_5_ugm3': 'mean',
            'pm10_ugm3': 'mean',
            'no2_ugm3': 'mean',
            'o3_ugm3': 'mean',
            'aqi_severity_category': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'Unknown'
        }).reset_index()
        aq_daily.rename(columns={
            'us_aqi': 'avg_us_aqi',
            'aqi_severity_score': 'avg_aqi_severity_score',
            'pm2_5_ugm3': 'avg_pm2_5',
            'pm10_ugm3': 'avg_pm10',
            'no2_ugm3': 'avg_no2',
            'o3_ugm3': 'avg_o3',
            'aqi_severity_category': 'aqi_severity_category'
        }, inplace=True)
        aq_daily['record_count'] = 1  # Placeholder
        db_manager.insert_air_quality_daily(aq_daily)

        # 3. Ingest and process Respiratory Data
        print("\n[3/4] Processing Respiratory Data...")
        resp_df = ingestion.load_respiratory_data()
        # Sample data if too large
        if len(resp_df) > 100000:
            print(f"Sampling {len(resp_df)} records to 100K for performance...")
            resp_df = resp_df.sample(n=100000, random_state=42)
        resp_df = cleaner.clean_respiratory_data(resp_df)
        resp_df = feature_engineer.engineer_respiratory_features(resp_df)

        # Prepare for database
        resp_export = resp_df[[
            'Week Ending Date', 'Geographic aggregation', 'total_respiratory_cases',
            'respiratory_risk_index',
            'Total Patients Hospitalized with COVID-19',
            'Total Patients Hospitalized with Influenza',
            'Total Patients Hospitalized with RSV',
            'Percent Inpatient Beds Occupied', 'bed_occupancy_pressure'
        ]].copy()
        resp_export.rename(columns={
            'Geographic aggregation': 'geographic_aggregation',
            'Total Patients Hospitalized with COVID-19': 'total_covid19_cases',
            'Total Patients Hospitalized with Influenza': 'total_influenza_cases',
            'Total Patients Hospitalized with RSV': 'total_rsv_cases',
            'Percent Inpatient Beds Occupied': 'bed_occupancy_percent'
        }, inplace=True)
        db_manager.insert_respiratory_weekly(resp_export)

        # 4. Ingest and process Agriculture Data
        print("\n[4/4] Processing Agriculture Data...")
        agri_df = ingestion.load_agriculture_data()
        # Sample data if too large
        if len(agri_df) > 200000:
            print(f"Sampling {len(agri_df)} records to 200K for performance...")
            agri_df = agri_df.sample(n=200000, random_state=42)
        agri_df = cleaner.clean_agriculture_data(agri_df)
        agri_df = feature_engineer.engineer_agriculture_features(agri_df)

        # Prepare for database
        agri_export = agri_df[[
            'date', 'STATE', 'District Name', 'Market Name', 'Commodity', 'Variety',
            'Min_Price', 'Max_Price', 'Modal_Price', 'price_range',
            'price_volatility', 'price_volatility_30d', 'price_change_pct'
        ]].copy()
        agri_export.rename(columns={
            'STATE': 'state',
            'District Name': 'district',
            'Market Name': 'market_name',
            'Commodity': 'commodity',
            'Variety': 'variety'
        }, inplace=True)
        db_manager.insert_agriculture_daily(agri_export)

        # 5. Create cross-domain analytics view
        print("\n[5/5] Creating Cross-Domain Analytics View...")
        db_manager.create_analytics_view()

        print("\n" + "=" * 60)
        print("Pipeline execution completed successfully!")
        print("=" * 60)

        # Print summary statistics
        cursor = db_manager.conn.cursor()

        tables = ['traffic_daily', 'air_quality_daily', 'respiratory_weekly', 
                  'agriculture_daily', 'analytics_daily']

        print("\nDatabase Summary:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table}: {count:,} records")

    except Exception as e:
        print(f"\nError during pipeline execution: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        db_manager.close()


if __name__ == '__main__':
    main()
