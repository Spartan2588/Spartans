"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
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
    
    # Robust metrics additions
    confidence: Optional[float] = 0.5
    sources: Optional[Dict[str, str]] = None
    timestamps: Optional[Dict[str, str]] = None  # Detailed formatted timestamps
    
    # Relax data_freshness to allow string (overall status) or dict (per-domain)
    data_freshness: Any 
    
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


# Delta-Based Scenario Schemas
class DeltaScenarioRequest(BaseModel):
    """Request for delta-based scenario simulation."""
    city: str = Field(..., description="City name (e.g., 'delhi', 'mumbai')")
    scenario_type: Optional[str] = Field(None, description="Preset scenario: heatwave, drought, crisis, flood, pollution_spike")
    custom_prompt: Optional[str] = Field(None, description="Natural language prompt for scenario inference")
    custom_deltas: Optional[Dict[str, float]] = Field(None, description="Manual delta overrides: aqi_delta, temperature_delta, etc.")


class BaselineMetrics(BaseModel):
    """Current/baseline metrics before scenario application."""
    aqi: Optional[float] = None
    temperature: Optional[float] = None
    hospital_load: Optional[float] = None
    crop_supply: Optional[float] = None
    timestamps: Dict[str, str] = Field(default_factory=dict)
    data_freshness: str = "unknown"
    confidence: float = 0.5
    sources: Dict[str, str] = Field(default_factory=dict)



class ScenarioSignals(BaseModel):
    """Structured scenario signals extracted from prompt."""
    primary_events: List[Literal["flood", "heatwave", "drought", "pollution", "cyclone", "none"]]
    duration: Literal["short", "moderate", "prolonged"]
    severity: Literal["low", "moderate", "high"]
    secondary_impacts: List[Literal[
        "transport_disruption", "hospital_access_reduction", "power_outage", 
        "water_shortage", "food_supply_disruption", "none"
    ]]
    confidence: Literal["high", "medium", "low"]


class DeltaInfo(BaseModel):
    """Information about deltas applied in scenario."""
    aqi_delta: float = 0
    temperature_delta: float = 0
    hospital_load_delta: float = 0
    crop_supply_delta: float = 0
    source: str = "default"
    inferred_scenario: Optional[str] = None
    signals: Optional[ScenarioSignals] = None  # NEW: Structured signals
    inference_confidence: Optional[float] = None
    description: str = ""


class SimulatedMetrics(BaseModel):
    """Metrics after scenario deltas are applied."""
    aqi: float
    temperature: float
    hospital_load: float
    crop_supply: float
    deltas_applied: Dict[str, Dict[str, float]] = Field(
        default_factory=dict,
        description="Per-metric breakdown: {metric: {baseline, delta, final}}"
    )


class ValidationInfo(BaseModel):
    """Validation information for debugging."""
    used_live_data: bool = False
    fallback_used: bool = False
    deltas_applied: bool = False
    ml_executed: bool = False


class DeltaScenarioResponse(BaseModel):
    """Response from delta-based scenario simulation."""
    baseline: BaselineMetrics
    deltas: DeltaInfo
    simulated: SimulatedMetrics
    risks: RiskAssessmentResponse
    validation: ValidationInfo
    timestamp: str


# Health Check Schema
class HealthCheckResponse(BaseModel):
    """API health check response."""
    status: str
    database_connected: bool
    timestamp: datetime
    version: str = "1.0.0"
