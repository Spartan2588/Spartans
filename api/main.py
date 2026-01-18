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
from . import schemas, crud, risk_assessment, scenario, cascade, presets, current_metrics
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
    city: str = Query("Mumbai", description="City name (e.g., 'mumbai', 'delhi')"),
    state: Optional[str] = Query("Maharashtra", description="State name (optional, for disambiguation)"),
    db: Session = Depends(get_db)
):
    """
    Get current state metrics for a city.
    Strictly uses robust fetching logic to ensure no nulls and proper timestamping.
    Defaults to Mumbai if not specified.
    """
    try:
        # Use robust fetcher (handles strict city, nulls, estimates)
        metrics = current_metrics.fetch_current_metrics(db, city, state)
        
        # We also need the raw state for other fields not covered by fetch_current_metrics
        # (like pm25, traffic_congestion which might be used by dashboard)
        raw_state = crud.get_city_current_state(db, metrics['city'], metrics['state'])
        
        # Merge: Start with raw state, overwrite with robust metrics
        response_data = raw_state.copy()
        response_data.update({
            "city": metrics["city"],
            "state": metrics["state"],
            "aqi": metrics["aqi"],
            "temperature": metrics["temperature"],
            "hospital_load": metrics["hospital_load"],
            "bed_occupancy_percent": metrics["hospital_load"], # Alias
            "crop_supply_index": metrics["crop_supply"], # Alias
            "data_freshness": metrics["data_freshness"],
            "confidence": metrics["confidence"],
            "timestamps": metrics["timestamps"],
            "sources": metrics["sources"]
        })
        
        return schemas.CurrentStateResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
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


@app.post("/api/v1/scenario-delta", response_model=schemas.DeltaScenarioResponse, tags=["Simulation"])
async def simulate_scenario_delta(
    request: schemas.DeltaScenarioRequest,
    db: Session = Depends(get_db)
):
    """
    Delta-based scenario simulation endpoint.
    
    This endpoint implements the strict flow:
    1. Fetch current metrics as baseline (live/recent data)
    2. Infer or apply deltas based on scenario_type, prompt, or custom_deltas
    3. Apply deltas to baseline to get simulated values
    4. Run ML/risk inference on simulated state
    5. Return structured result with validation info
    
    Deltas are NEVER hardcoded - they are always applied relative to real data.
    """
    from .current_metrics import fetch_current_metrics
    from .scenario_deltas import run_delta_simulation, ScenarioDeltas
    
    try:
        city = request.city.lower()
        
        # Step 1: Fetch current metrics (baseline)
        print(f"[VALIDATION] Fetching current metrics for {city}")
        baseline_metrics = fetch_current_metrics(db, city)
        
        used_live_data = baseline_metrics.get('data_freshness') in ['live', 'recent']
        fallback_used = baseline_metrics.get('data_freshness') in ['cached', 'estimated']
        
        print(f"[VALIDATION] Using live data: {used_live_data}")
        print(f"[VALIDATION] Fallback used: {fallback_used}")
        
        # Step 2: Run delta simulation
        simulation_result = run_delta_simulation(
            baseline_metrics=baseline_metrics,
            scenario_type=request.scenario_type,
            custom_prompt=request.custom_prompt,
            custom_deltas=request.custom_deltas
        )
        
        print(f"[VALIDATION] Deltas applied: {simulation_result['deltas']}")
        
        # Step 3: Prepare simulated state for ML inference
        simulated_state = {
            'city': city,
            'aqi': simulation_result['simulated']['aqi'],
            'aqi_severity_score': min(100, simulation_result['simulated']['aqi'] / 5),  # Approximate
            'temperature': simulation_result['simulated']['temperature'],
            'hospital_load': simulation_result['simulated']['hospital_load'] / 100,  # Normalize to 0-1
            'pm25': baseline_metrics.get('pm25'),
            'pm10': baseline_metrics.get('pm10'),
            'traffic_congestion_index': baseline_metrics.get('traffic_congestion'),
            'respiratory_risk_index': baseline_metrics.get('respiratory_cases', 0) / 10 if baseline_metrics.get('respiratory_cases') else 50,
            'respiratory_cases': baseline_metrics.get('respiratory_cases', 0),
            'avg_food_price_volatility': max(0, (100 - simulation_result['simulated']['crop_supply']) / 100 * 0.5),
            'crop_supply_index': simulation_result['simulated']['crop_supply'],
            'timestamp': datetime.now()
        }
        
        # Step 4: Run ML/risk inference
        print("[VALIDATION] Running ML inference on simulated state")
        risk_result = risk_assessment.compute_risk_assessment(simulated_state)
        ml_executed = True
        
        print(f"[VALIDATION] ML executed: {ml_executed}")
        
        # Step 5: Build structured response
        baseline_response = schemas.BaselineMetrics(
            aqi=baseline_metrics.get('aqi'),
            temperature=baseline_metrics.get('temperature'),
            hospital_load=baseline_metrics.get('hospital_load'),
            crop_supply=baseline_metrics.get('crop_supply'),
            timestamps=baseline_metrics.get('timestamps', {}),
            data_freshness=baseline_metrics.get('data_freshness', 'unknown'),
            confidence=baseline_metrics.get('confidence', 0.5),
            sources=baseline_metrics.get('sources', {})
        )
        
        delta_response = schemas.DeltaInfo(
            aqi_delta=simulation_result['deltas'].get('aqi_delta', 0),
            temperature_delta=simulation_result['deltas'].get('temperature_delta', 0),
            hospital_load_delta=simulation_result['deltas'].get('hospital_load_delta', 0),
            crop_supply_delta=simulation_result['deltas'].get('crop_supply_delta', 0),
            source=simulation_result['deltas'].get('source', 'default'),
            inferred_scenario=simulation_result['deltas'].get('inferred_scenario'),
            signals=simulation_result['deltas'].get('signals'),
            inference_confidence=simulation_result['deltas'].get('inference_confidence'),
            description=simulation_result['deltas'].get('description', '')
        )
        
        simulated_response = schemas.SimulatedMetrics(
            aqi=simulation_result['simulated']['aqi'],
            temperature=simulation_result['simulated']['temperature'],
            hospital_load=simulation_result['simulated']['hospital_load'],
            crop_supply=simulation_result['simulated']['crop_supply'],
            deltas_applied=simulation_result['simulated'].get('deltas_applied', {})
        )
        
        validation_response = schemas.ValidationInfo(
            used_live_data=used_live_data,
            fallback_used=fallback_used,
            deltas_applied=True,
            ml_executed=ml_executed
        )
        
        risk_response = schemas.RiskAssessmentResponse(**risk_result)
        
        return schemas.DeltaScenarioResponse(
            baseline=baseline_response,
            deltas=delta_response,
            simulated=simulated_response,
            risks=risk_response,
            validation=validation_response,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error in delta scenario simulation: {str(e)}")


@app.get("/api/v1/scenario-presets", response_model=Dict[str, List[presets.ScenarioPreset]], tags=["Simulation"])
async def get_scenario_presets():
    """
    Get list of pre-defined scenarios for the simulation interface.
    """
    return {"presets": presets.get_presets()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
