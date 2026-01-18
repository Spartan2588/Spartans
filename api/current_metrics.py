from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from . import crud

def calculate_data_freshness(timestamp: Optional[datetime]) -> str:
    """
    Determine data freshness level based on timestamp age.
    live: < 1 hour
    recent: < 24 hours
    cached: < 7 days
    estimated: > 7 days or None
    """
    if not timestamp:
        return "estimated"
    
    age = datetime.now() - timestamp
    if age < timedelta(hours=1):
        return "live"
    elif age < timedelta(hours=24):
        return "recent"
    elif age < timedelta(days=7):
        return "cached"
    else:
        return "estimated"

def calculate_confidence(freshness: str) -> float:
    """
    Calculate confidence score (0.0 - 1.0) based on freshness.
    """
    mapping = {
        "live": 0.95,
        "recent": 0.85,
        "cached": 0.60,
        "estimated": 0.35,
        "unknown": 0.20
    }
    return mapping.get(freshness, 0.20)

def format_timestamp_ago(timestamp: Optional[datetime]) -> str:
    """
    Format timestamp as human-readable relative time (e.g., '2 hours ago').
    Returns 'Estimated' if timestamp is None or very old.
    """
    if not timestamp:
        return "Estimated"
    
    age = datetime.now() - timestamp
    
    if age < timedelta(minutes=1):
        return "Just now"
    elif age < timedelta(minutes=60):
        return f"{int(age.total_seconds() / 60)} min ago"
    elif age < timedelta(hours=24):
        return f"{int(age.total_seconds() / 3600)} hours ago"
    elif age < timedelta(days=7):
        return f"{age.days} days ago"
    else:
        return "Estimated"  # Hide specific days for very old data to avoid user confusion

def fetch_current_metrics(db: Session, city: str = "Mumbai", state: str = "Maharashtra") -> Dict[str, Any]:
    """
    Fetch the latest current metrics for a specific city (Strictly Defaults to Mumbai).
    Ensures NO null values are returned.
    """
    
    # Enforce Mumbai if not specified (though func arg defaults cover this, explicit safety is good)
    target_city = city if city else "Mumbai"
    target_state = state if state else "Maharashtra"

    # Fetch from DB via CRUD
    # We use the existing aggregate function but will post-process strictly
    db_data = crud.get_city_current_state(db, target_city, target_state)
    
    # Defaults / Fallbacks (Estimates for Mumbai)
    # Based on typical averages for Mumbai
    defaults = {
        "aqi": 145.0,
        "temperature": 28.5,
        "hospital_load": 65.0,
        "crop_supply": 75.0
    }

    # Extract & Sanitize
    # If DB returns None or missing keys, we use the default
    
    metrics = {}
    timestamps = {}
    sources = {}
    
    # Helper to safe-get and validate
    def safe_get(key, default_val):
        val = db_data.get(key)
        if val is None:
            return default_val
        # Ensure it's a number (float/int)
        try:
            return float(val)
        except (ValueError, TypeError):
            return default_val

    # 1. AQI
    metrics["aqi"] = safe_get("aqi", defaults["aqi"])
    ts_aqi = db_data.get("timestamp") # Main timestamp usually covers AQI/Env
    timestamps["air_quality"] = format_timestamp_ago(ts_aqi)
    # Determine source explicitly
    freshness_aqi = calculate_data_freshness(ts_aqi)
    sources["air_quality"] = "sensor" if freshness_aqi in ["live", "recent"] else "historical_estimate"

    # 2. Temperature
    metrics["temperature"] = safe_get("temperature", defaults["temperature"])
    # Temp usually shares timestamp with AQI in this schema, or separate if available
    timestamps["traffic"] = format_timestamp_ago(ts_aqi) # Using main timestamp as proxy for env data
    
    # 3. Hospital Load (bed_occupancy_percent)
    # Sometimes stored as hospital_load or bed_occupancy_percent
    h_load = db_data.get("hospital_load")
    if h_load is None:
        h_load = db_data.get("bed_occupancy_percent")
    
    if h_load is not None:
         val = float(h_load)
         if val <= 1.0 and val > 0:
             val = val * 100.0
         
         ts_health = db_data.get("timestamp")
         freshness_health = calculate_data_freshness(ts_health)
         
         # Enforce realistic floor: Hospital Load rarely below 40% in metro cities
         if val < 40.0:
             val = max(val, 55.0) # Boost to realistic average if data is garbage low
             freshness_health = "estimated" # Mark as estimated since we altered it
             
         metrics["hospital_load"] = val
         timestamps["respiratory"] = format_timestamp_ago(ts_health)
    else:
        metrics["hospital_load"] = defaults["hospital_load"]
        timestamps["respiratory"] = "Estimated"
        freshness_health = "estimated"
    
    sources["respiratory"] = "hospital_api" if freshness_health in ["live", "recent"] else "model_estimate"

    # 4. Crop Supply (crop_supply_index)
    c_supply = db_data.get("crop_supply_index")
    if c_supply is None:
        c_supply = db_data.get("crop_supply")
        
    if c_supply is not None:
        val = float(c_supply)
        # Enforce realistic floor
        if val < 40.0:
             val = max(val, 60.0)
             freshness_agri = "estimated"
        else:
             freshness_agri = calculate_data_freshness(db_data.get("timestamp"))
             
        metrics["crop_supply"] = val
        ts_agri = db_data.get("timestamp")
        timestamps["agriculture"] = format_timestamp_ago(ts_agri)
    else:
        metrics["crop_supply"] = defaults["crop_supply"]
        timestamps["agriculture"] = "Estimated"
        freshness_agri = "estimated"

    sources["agriculture"] = "market_data" if freshness_agri in ["live", "recent"] else "seasonal_estimate"


    # Overall Freshness & Confidence
    # We take the "worst" freshness to be safe, or average?
    # Let's take the freshness of Environmental data as the primary driver for "Overall Status"
    # but recalculate confidence as a weighted avg
    
    freshness_levels = [freshness_aqi, freshness_health, freshness_agri]
    if "live" in freshness_levels:
        overall_freshness = "live"
    elif "recent" in freshness_levels:
        overall_freshness = "recent"
    elif "cached" in freshness_levels:
        overall_freshness = "cached"
    else:
        overall_freshness = "estimated"

    # Confidence calculation
    # Average of component confidences
    c_aqi = calculate_confidence(freshness_aqi)
    c_health = calculate_confidence(freshness_health)
    c_agri = calculate_confidence(freshness_agri)
    avg_confidence = (c_aqi + c_health + c_agri) / 3.0

    return {
        "city": target_city,
        "state": target_state,
        "aqi": metrics["aqi"],
        "temperature": metrics["temperature"],
        "hospital_load": metrics["hospital_load"],
        "crop_supply": metrics["crop_supply"],
        "timestamps": timestamps,
        "sources": sources,
        "data_freshness": overall_freshness,
        "confidence": round(avg_confidence, 2),
        "fetched_at": datetime.now().isoformat()
    }
