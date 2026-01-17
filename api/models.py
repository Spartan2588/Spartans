"""
SQLAlchemy models for database tables.
Matches the actual database schema created by data_pipeline.py.
"""

from sqlalchemy import Column, Integer, Float, String, Date, DateTime, TypeDecorator
from datetime import date as date_type, datetime as datetime_type
from .database import Base


class SQLiteDate(TypeDecorator):
    """Handle SQLite TIMESTAMP strings that may be dates or datetimes."""
    impl = String
    cache_ok = True
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, (date_type, datetime_type)):
            return value
        # Value is a string - parse it
        try:
            # Try various formats
            for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d'):
                try:
                    return datetime_type.strptime(value, fmt).date()
                except ValueError:
                    continue
            # Fallback: try fromisoformat with T separator
            return datetime_type.fromisoformat(value.replace(' ', 'T').replace('Z', '+00:00')).date()
        except:
            return value


class TrafficDaily(Base):
    """Traffic data aggregated daily."""
    __tablename__ = "traffic_daily"
    
    date = Column(SQLiteDate, primary_key=True, index=True)
    avg_traffic_volume = Column(Float)
    avg_traffic_congestion_index = Column(Float)
    avg_temperature = Column(Float)
    avg_humidity = Column(Float)
    avg_wind_speed = Column(Float)
    avg_air_pollution_index = Column(Float)
    record_count = Column(Integer)


class AirQualityDaily(Base):
    """Air quality data aggregated daily by city/state.
    Note: Table has no primary key, using composite columns for unique constraint.
    """
    __tablename__ = "air_quality_daily"
    
    date = Column(SQLiteDate, primary_key=True, index=True)
    city = Column(String, primary_key=True, index=True)
    state = Column(String, primary_key=True, index=True)
    avg_us_aqi = Column(Float)
    avg_aqi_severity_score = Column(Float)
    avg_pm2_5 = Column(Float)
    avg_pm10 = Column(Float)
    avg_no2 = Column(Float)
    avg_o3 = Column(Float)
    aqi_severity_category = Column(String)
    record_count = Column(Integer)


class RespiratoryWeekly(Base):
    """Respiratory health data aggregated weekly.
    Note: Table has both 'Week Ending Date' and 'week_ending_date' columns.
    """
    __tablename__ = "respiratory_weekly"
    
    # Note: Table uses 'Week Ending Date' as first column but we'll query 'week_ending_date'
    week_ending_date = Column(SQLiteDate, primary_key=True, index=True)
    geographic_aggregation = Column(String, primary_key=True, index=True)
    total_respiratory_cases = Column(Float)  # Stored as REAL in DB
    respiratory_risk_index = Column(Float)
    total_covid19_cases = Column(Float)
    total_influenza_cases = Column(Float)
    total_rsv_cases = Column(Float)
    bed_occupancy_percent = Column(Float)
    bed_occupancy_pressure = Column(Float)


class AgricultureDaily(Base):
    """Agriculture price data aggregated daily.
    Note: Column names match database (Min_Price, Max_Price, Modal_Price).
    """
    __tablename__ = "agriculture_daily"
    
    date = Column(SQLiteDate, primary_key=True, index=True)
    state = Column(String, primary_key=True, index=True)
    district = Column(String, primary_key=True, index=True)
    market_name = Column(String, primary_key=True, index=True)
    commodity = Column(String, primary_key=True, index=True)
    variety = Column(String, primary_key=True, index=True)
    Min_Price = Column(Float)  # Matches database column name
    Max_Price = Column(Float)  # Matches database column name
    Modal_Price = Column(Float)  # Matches database column name
    price_range = Column(Float)
    price_volatility = Column(Float)
    price_volatility_30d = Column(Float)
    price_change_pct = Column(Float)


class AnalyticsDaily(Base):
    """Cross-domain analytics aggregated daily."""
    __tablename__ = "analytics_daily"
    
    date = Column(SQLiteDate, primary_key=True, index=True)
    avg_traffic_congestion_index = Column(Float)
    avg_aqi_severity_score = Column(Float)
    avg_respiratory_risk_index = Column(Float)
    avg_price_volatility = Column(Float)
    data_availability_flags = Column(String)
