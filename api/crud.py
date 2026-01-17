"""
CRUD operations for database queries.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import Optional, List, Dict
from datetime import datetime, date, timedelta
from . import models, schemas


def _parse_date(date_val) -> Optional[date]:
    """Safely parse date from various formats returned by SQLite."""
    if date_val is None:
        return None
    if isinstance(date_val, date):
        return date_val
    if isinstance(date_val, datetime):
        return date_val.date()
    if isinstance(date_val, str):
        # Try parsing common formats
        for fmt in ('%Y-%m-%d', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S.%f'):
            try:
                return datetime.strptime(date_val, fmt).date()
            except ValueError:
                continue
        return None
    return None


def get_latest_air_quality(db: Session, city: str, state: Optional[str] = None):
    """Get latest air quality data for a city."""
    query = db.query(models.AirQualityDaily).filter(
        models.AirQualityDaily.city.ilike(f"%{city}%")
    )
    if state:
        query = query.filter(models.AirQualityDaily.state.ilike(f"%{state}%"))

    return query.order_by(desc(models.AirQualityDaily.date)).first()


def get_latest_traffic(db: Session, days_back: int = 30):
    """Get latest traffic data (most recent date)."""
    return db.query(models.TrafficDaily).order_by(desc(models.TrafficDaily.date)).first()


def get_latest_respiratory(db: Session, geographic_agg: Optional[str] = None):
    """Get latest respiratory data."""
    query = db.query(models.RespiratoryWeekly)
    if geographic_agg:
        query = query.filter(models.RespiratoryWeekly.geographic_aggregation == geographic_agg)
    return query.order_by(desc(models.RespiratoryWeekly.week_ending_date)).first()


def get_avg_agriculture_volatility(db: Session, state: Optional[str] = None, days: int = 7):
    """Get average agriculture price volatility for recent period."""
    cutoff_date = date.today() - timedelta(days=days)

    query = db.query(func.avg(models.AgricultureDaily.price_volatility_30d)).filter(
        models.AgricultureDaily.date >= cutoff_date,
        models.AgricultureDaily.price_volatility_30d.isnot(None)
    )

    if state:
        query = query.filter(models.AgricultureDaily.state.ilike(f"%{state}%"))

    result = query.scalar()
    return result if result else 0.0


def get_historical_analytics(db: Session, hours: int = 24, city: Optional[str] = None):
    """Get historical analytics data.
    
    Falls back to most recent N records if no data within the specified hours.
    """
    cutoff_date = datetime.now() - timedelta(hours=hours)
    cutoff_date = cutoff_date.date()

    # Get analytics data within cutoff
    analytics_query = db.query(models.AnalyticsDaily).filter(
        models.AnalyticsDaily.date >= cutoff_date
    ).order_by(models.AnalyticsDaily.date)

    analytics_data = analytics_query.all()

    # Fallback: if no recent data, get the most recent N records anyway (for demo purposes)
    if not analytics_data:
        # Get most recent records to fill the gap
        fallback_query = db.query(models.AnalyticsDaily).order_by(
            models.AnalyticsDaily.date.desc()
        ).limit(min(hours, 100))  # Limit to hours count or 100 max
        analytics_data = list(reversed(fallback_query.all()))  # Reverse to get chronological order

    # If city specified, try to get city-specific AQ data and merge
    if city:
        aq_query = db.query(models.AirQualityDaily).filter(
            models.AirQualityDaily.city.ilike(f"%{city}%"),
            models.AirQualityDaily.date >= cutoff_date
        ).order_by(models.AirQualityDaily.date)

        # For now, return analytics (can be enhanced to merge city-specific data)
        return analytics_data

    return analytics_data


def get_cities_list(db: Session):
    """Get list of all cities with summary data."""
    # Get unique cities from air quality data
    # Query just city and state, then get latest dates separately
    cities_query = db.query(
        models.AirQualityDaily.city,
        models.AirQualityDaily.state
    ).distinct().order_by(models.AirQualityDaily.city)

    cities_raw = cities_query.all()

    cities = []
    for city_row in cities_raw:
        city_name = city_row.city.lower()

        # Get latest data for each domain
        latest_aq = get_latest_air_quality(db, city_row.city, city_row.state)
        latest_resp = get_latest_respiratory(db)
        latest_traffic = get_latest_traffic(db)
        avg_volatility = get_avg_agriculture_volatility(db, city_row.state, days=7)

        # Determine data freshness
        data_freshness = {
            'air_quality': _parse_date(latest_aq.date) if latest_aq else None,
            'respiratory': _parse_date(latest_resp.week_ending_date) if latest_resp else None,
            'traffic': _parse_date(latest_traffic.date) if latest_traffic else None,
            'agriculture': date.today() - timedelta(days=7)  # Approximation
        }

        # Check if has recent data (within last 30 days)
        has_recent = any(
            d and (date.today() - d).days <= 30 
            for d in [data_freshness['air_quality'], data_freshness['respiratory'], 
                      data_freshness['traffic'], data_freshness['agriculture']]
        )

        cities.append({
            'city': city_row.city,
            'state': city_row.state,
            'latest_aqi': latest_aq.avg_us_aqi if latest_aq else None,
            'latest_traffic_congestion': latest_traffic.avg_traffic_congestion_index if latest_traffic else None,
            'latest_respiratory_risk': latest_resp.respiratory_risk_index if latest_resp else None,
            'data_freshness': data_freshness,
            'has_recent_data': has_recent
        })

    return cities


def get_city_current_state(db: Session, city: str, state: Optional[str] = None):
    """Get comprehensive current state for a city."""
    # Get latest data from database tables
    aq_data = get_latest_air_quality(db, city, state)
    traffic_data = get_latest_traffic(db)
    resp_data = get_latest_respiratory(db)
    avg_volatility = get_avg_agriculture_volatility(db, state, days=7)
    
    # NEW: Get latest agriculture data for supply/price details
    # We query the latest record for any commodity in this state to get general agricultural health
    agri_data = None
    if state or (aq_data and aq_data.state):
        search_state = state or aq_data.state
        agri_data = db.query(models.AgricultureDaily).filter(
            models.AgricultureDaily.state.ilike(f"%{search_state}%")
        ).order_by(desc(models.AgricultureDaily.date)).first()

    # Build response
    current_state = {
        'city': city,
        'state': state or (aq_data.state if aq_data else None),
        'timestamp': datetime.now(),
        # Environmental
        'aqi': aq_data.avg_us_aqi if aq_data else None,
        'aqi_severity_score': aq_data.avg_aqi_severity_score if aq_data else None,
        'aqi_category': aq_data.aqi_severity_category if aq_data else None,
        'pm25': aq_data.avg_pm2_5 if aq_data else None,
        'pm10': aq_data.avg_pm10 if aq_data else None,
        # Traffic & Weather (Temperature comes from here)
        'traffic_volume': traffic_data.avg_traffic_volume if traffic_data else None,
        'traffic_congestion_index': traffic_data.avg_traffic_congestion_index if traffic_data else None,
        'congestion_level': None,  # Will be determined from index
        'temperature': traffic_data.avg_temperature if traffic_data else None,  # NEW
        'humidity': traffic_data.avg_humidity if traffic_data else None,        # NEW
        'wind_speed': traffic_data.avg_wind_speed if traffic_data else None,    # NEW
        # Health
        'respiratory_cases': resp_data.total_respiratory_cases if resp_data else None,
        'respiratory_risk_index': resp_data.respiratory_risk_index if resp_data else None,
        'hospital_load': resp_data.bed_occupancy_pressure if resp_data else None,
        'bed_occupancy_percent': resp_data.bed_occupancy_percent if resp_data else None,
        # Agriculture / Food Security
        'avg_food_price_volatility': float(avg_volatility) if avg_volatility else None,
        'crop_supply_index': 100.0 - (agri_data.price_volatility * 100) if agri_data and agri_data.price_volatility else 50.0, # NEW: Derived proxy
        'food_price_index': agri_data.Modal_Price if agri_data else None, # NEW
        
        'data_freshness': {
            'air_quality': _parse_date(aq_data.date) if aq_data else None,
            'respiratory': _parse_date(resp_data.week_ending_date) if resp_data else None,
            'traffic': _parse_date(traffic_data.date) if traffic_data else None,
            'agriculture': _parse_date(agri_data.date) if agri_data else (date.today() - timedelta(days=7))
        }
    }

    # Determine congestion level from index
    if current_state['traffic_congestion_index'] is not None:
        idx = current_state['traffic_congestion_index']
        if idx < 33:
            current_state['congestion_level'] = 'low'
        elif idx < 67:
            current_state['congestion_level'] = 'medium'
        else:
            current_state['congestion_level'] = 'high'

    return current_state
