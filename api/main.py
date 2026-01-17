"""
FastAPI main application - Urban Intelligence Platform Backend API.
"""

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Dict, List
from datetime import datetime, timedelta

from .database import get_db
from . import schemas, crud, risk_assessment, scenario, cascade, presets
from . import websocket_routes

# Initialize FastAPI app
app = FastAPI(
    title="Urban Intelligence Platform API",
    description="REST API for data-driven urban systems integrating traffic, air quality, health, and agriculture data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Include Cascade Router
app.include_router(cascade.router)

# Include WebSocket Router
app.include_router(websocket_routes.router)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint."""
    return {
        "message": "Urban Intelligence Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "current_state": "/api/v1/current-state",
            "risk_assessment": "/api/v1/risk-assessment",
            "scenario": "/api/v1/scenario",
            "historical": "/api/v1/historical",
            "cities": "/api/v1/cities",
            "websocket_predictions": "/ws/predictions",
            "websocket_ingest": "/ws/data-ingest"
        }
    }


@app.on_event("startup")
async def startup_event():
    """Start background tasks on application startup."""
    # Start the demo data simulator for real-time predictions
    websocket_routes.start_simulator()
    print("WebSocket real-time data simulator started")


@app.get("/api/v1/realtime-trends", tags=["Real-Time"])
async def get_realtime_trends():
    """
    REST fallback for real-time trends (for clients without WebSocket).
    Returns prediction history and trend summary.
    """
    from .realtime import get_state_manager
    
    state_manager = get_state_manager()
    
    return {
        "history": state_manager.get_prediction_history(),
        "trends": state_manager.get_trend_summary(),
        "latest": state_manager.latest_prediction.model_dump() if state_manager.latest_prediction else None,
        "confidence": state_manager.get_confidence(),
        "websocket_url": "/ws/predictions"
    }


@app.get("/health", response_model=schemas.HealthCheckResponse, tags=["Health"])
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    return schemas.HealthCheckResponse(
        status="healthy" if db_connected else "unhealthy",
        database_connected=db_connected,
        timestamp=datetime.now()
    )


@app.get("/api/v1/current-state", response_model=schemas.CurrentStateResponse, tags=["Analytics"])
async def get_current_state(
    city: str = Query(..., description="City name (e.g., 'delhi', 'mumbai')"),
    state: Optional[str] = Query(None, description="State name (optional, for disambiguation)"),
    db: Session = Depends(get_db)
):
    """
    Get current state metrics for a city.

    Returns latest aggregated metrics from all datasets (traffic, air quality, health, agriculture).
    """
    try:
        current_state = crud.get_city_current_state(db, city, state)

        if not current_state.get('aqi') and not current_state.get('traffic_volume'):
            raise HTTPException(
                status_code=404,
                detail=f"No data found for city: {city}" + (f", state: {state}" if state else "")
            )

        return schemas.CurrentStateResponse(**current_state)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()  # Print full traceback to server console
        raise HTTPException(status_code=500, detail=f"Error fetching current state: {str(e)}")


@app.get("/api/v1/risk-assessment", response_model=schemas.RiskAssessmentResponse, tags=["Risk Analysis"])
async def get_risk_assessment(
    city: str = Query(..., description="City name"),
    state: Optional[str] = Query(None, description="State name (optional)"),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive risk assessment for a city.

    Computes environmental, health, and food security risks using ML/rules-based assessment.
    """
    try:
        # Get current state
        current_state = crud.get_city_current_state(db, city, state)

        if not current_state.get('aqi') and not current_state.get('traffic_volume'):
            raise HTTPException(
                status_code=404,
                detail=f"No data found for city: {city}" + (f", state: {state}" if state else "")
            )

        # Compute risk assessment
        risk_assessment_result = risk_assessment.compute_risk_assessment(current_state)

        return schemas.RiskAssessmentResponse(**risk_assessment_result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing risk assessment: {str(e)}")


@app.post("/api/v1/scenario", response_model=schemas.ScenarioResponse, tags=["Simulation"])
async def simulate_scenario(
    scenario_request: schemas.ScenarioRequest,
    db: Session = Depends(get_db)
):
    """
    What-if scenario simulation endpoint.

    Simulates the impact of interventions (changes to AQI, traffic, supply, etc.)
    and returns baseline vs intervention risks, improvements, and economic impact estimates.
    """
    try:
        city = scenario_request.city_id.lower()

        # Get baseline current state
        baseline_state = crud.get_city_current_state(db, city)

        if not baseline_state.get('aqi') and not baseline_state.get('traffic_volume'):
            raise HTTPException(
                status_code=404,
                detail=f"No baseline data found for city: {city}"
            )

        # Compute baseline risks
        baseline_risks = risk_assessment.compute_risk_assessment(baseline_state)

        # Convert modifications to dict
        modifications_dict = scenario_request.modifications.dict(exclude_none=True)

        # Simulate scenario
        scenario_result = scenario.simulate_scenario(
            baseline_state,
            modifications_dict,
            baseline_risks
        )

        return schemas.ScenarioResponse(**scenario_result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error simulating scenario: {str(e)}")


@app.get("/api/v1/historical", response_model=schemas.HistoricalResponse, tags=["Analytics"])
async def get_historical(
    city: Optional[str] = Query(None, description="City name (optional, for city-specific data)"),
    hours: int = Query(24, ge=1, le=168, description="Number of hours to look back (max 168 = 7 days)"),
    db: Session = Depends(get_db)
):
    """
    Get historical data for charts and trend analysis.

    Returns time series data for the last N hours.
    """
    try:
        # Get historical analytics data
        historical_data = crud.get_historical_analytics(db, hours=hours, city=city)

        if not historical_data:
            raise HTTPException(
                status_code=404,
                detail=f"No historical data found for the specified time period"
            )

        # Convert to response format
        data_points = []
        for record in historical_data:
            data_points.append({
                'timestamp': datetime.combine(record.date, datetime.min.time()),
                'aqi': None,
                'aqi_severity_score': record.avg_aqi_severity_score,
                'traffic_congestion_index': record.avg_traffic_congestion_index,
                'respiratory_risk_index': record.avg_respiratory_risk_index,
                'price_volatility': record.avg_price_volatility
            })

        time_range = {
            'start': data_points[0]['timestamp'] if data_points else datetime.now(),
            'end': data_points[-1]['timestamp'] if data_points else datetime.now()
        }

        return schemas.HistoricalResponse(
            city=city or "aggregated",
            data_points=[schemas.HistoricalDataPoint(**dp) for dp in data_points],
            time_range=time_range,
            record_count=len(data_points)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching historical data: {str(e)}")


@app.get("/api/v1/cities", response_model=schemas.CitiesResponse, tags=["Metadata"])
async def get_cities(
    db: Session = Depends(get_db)
):
    """
    Get list of all cities with summary indicators and data freshness.

    Useful for dashboard city selection and data availability overview.
    """
    try:
        cities_data = crud.get_cities_list(db)

        cities = [
            schemas.CitySummary(**city) for city in cities_data
        ]

        return schemas.CitiesResponse(
            cities=cities,
            total_cities=len(cities)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cities list: {str(e)}")


@app.get("/api/v1/scenario-presets", response_model=Dict[str, List[presets.ScenarioPreset]], tags=["Simulation"])
async def get_scenario_presets():
    """
    Get list of pre-defined scenarios for the simulation interface.
    """
    return {"presets": presets.get_presets()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
