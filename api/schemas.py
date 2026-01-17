"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime


# Current State Schemas
class CurrentStateResponse(BaseModel):
    """Current state metrics for a city."""
    city: str
    state: Optional[str] = None
    timestamp: datetime
    aqi: Optional[float] = None
    aqi_severity_score: Optional[float] = None
    aqi_category: Optional[str] = None
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    traffic_volume: Optional[float] = None
    traffic_congestion_index: Optional[float] = None
    congestion_level: Optional[str] = None
    respiratory_cases: Optional[int] = None
    respiratory_risk_index: Optional[float] = None
    hospital_load: Optional[float] = None
    bed_occupancy_percent: Optional[float] = None
    avg_food_price_volatility: Optional[float] = None
    crop_supply_index: Optional[float] = None  # NEW
    food_price_index: Optional[float] = None   # NEW
    temperature: Optional[float] = None        # NEW
    humidity: Optional[float] = None           # NEW
    wind_speed: Optional[float] = None         # NEW
    data_freshness: Dict[str, Any]  # Can be date, datetime, or string
    
    class Config:
        from_attributes = True


# Risk Assessment Schemas
class RiskAssessmentResponse(BaseModel):
    """Risk assessment results."""
    environmental_risk: str = Field(..., description="Risk level: low, medium, high, critical")
    environmental_prob: float = Field(..., ge=0.0, le=1.0)
    health_risk: str = Field(..., description="Risk level: low, medium, high, critical")
    health_prob: float = Field(..., ge=0.0, le=1.0)
    food_security_risk: str = Field(..., description="Risk level: low, medium, high, critical")
    food_security_prob: float = Field(..., ge=0.0, le=1.0)
    resilience_score: float = Field(..., ge=0.0, le=1.0, description="Overall resilience 0-1")
    causal_explanations: List[str] = Field(default_factory=list)
    city: str
    timestamp: datetime


# Scenario Simulation Schemas
class ScenarioModifications(BaseModel):
    """What-if scenario modifications."""
    aqi: Optional[float] = None
    traffic_volume: Optional[float] = None
    crop_supply_index: Optional[float] = None
    respiratory_cases: Optional[int] = None
    hospital_load: Optional[float] = None # NEW
    temperature: Optional[float] = None   # NEW


class ScenarioRequest(BaseModel):
    """Scenario simulation request."""
    city_id: str = Field(..., description="City identifier (e.g., 'delhi', 'mumbai')")
    modifications: ScenarioModifications


class ScenarioResponse(BaseModel):
    """Scenario simulation results."""
    city: str
    baseline_risks: RiskAssessmentResponse
    intervention_risks: RiskAssessmentResponse
    improvements: Dict[str, float] = Field(..., description="% improvement for each risk category")
    overall_improvement: float = Field(..., description="Overall % improvement")
    economic_impact_estimate: Optional[float] = Field(None, description="Estimated economic impact in currency units")
    roi_estimate: Optional[float] = Field(None, description="ROI percentage")
    interventions_applied: Dict[str, Optional[float]]


# Historical Data Schemas
class HistoricalDataPoint(BaseModel):
    """Single historical data point."""
    timestamp: datetime
    aqi: Optional[float] = None
    aqi_severity_score: Optional[float] = None
    traffic_congestion_index: Optional[float] = None
    respiratory_risk_index: Optional[float] = None
    price_volatility: Optional[float] = None


class HistoricalResponse(BaseModel):
    """Historical data response."""
    city: str
    data_points: List[HistoricalDataPoint]
    time_range: Dict[str, datetime]
    record_count: int


# City List Schemas
class CitySummary(BaseModel):
    """City summary with key indicators."""
    city: str
    state: Optional[str] = None
    latest_aqi: Optional[float] = None
    latest_traffic_congestion: Optional[float] = None
    latest_respiratory_risk: Optional[float] = None
    data_freshness: Dict[str, Optional[date]]
    has_recent_data: bool


class CitiesResponse(BaseModel):
    """List of cities with summaries."""
    cities: List[CitySummary]
    total_cities: int


# Health Check Schema
class HealthCheckResponse(BaseModel):
    """API health check response."""
    status: str
    database_connected: bool
    timestamp: datetime
    version: str = "1.0.0"
