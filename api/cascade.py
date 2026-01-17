"""
Cascade Analysis API Endpoint.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional
from pydantic import BaseModel

from .ml import MLEngine

router = APIRouter()

class CascadeNode(BaseModel):
    id: str
    name: str
    severity: float
    affected: bool

class CascadeEdge(BaseModel):
    source: str  # 'from' is a reserved keyword in Python
    target: str # 'to'
    weight: float

    # Map to frontend expectations
    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        d['from'] = d.pop('source')
        d['to'] = d.pop('target')
        return d

class PropagationEvent(BaseModel):
    stage: int
    system: str
    severity: float
    timestamp: str

class ImpactSummary(BaseModel):
    systems_affected: int
    cascade_stages: int
    average_severity: float
    total_propagation_time: str

class CascadeResponse(BaseModel):
    systems: List[CascadeNode]
    edges: List[CascadeEdge]
    propagation_timeline: List[PropagationEvent]
    impact_summary: ImpactSummary


@router.post("/api/v1/cascade", response_model=CascadeResponse, tags=["Cascade"])
async def analyze_cascade(
    city: str = Query(..., description="City name"),
    trigger_system: str = Query("environmental", description="Triggering system (environmental, health, food, economy)"),
    trigger_severity: float = Query(0.75, ge=0.0, le=1.0, description="Severity of the trigger event")
):
    """
    Simulate cascading failure propagation using the ML engine.
    """
    try:
        engine = MLEngine.get_instance()
        
        # 1. Get Cascade Graph & Weights (Static structure from engine)
        # In a real dynamic system, these weights would come from current state
        # For now, we use the graph defined in the engine
        
        # Define the system graph (matches frontend expectations)
        # Note: 'source' mapped to 'from' in response
        edges = [
            CascadeEdge(source="environmental", target="health", weight=0.7),
            CascadeEdge(source="environmental", target="agriculture", weight=0.5),
            CascadeEdge(source="health", target="economy", weight=0.35),
            CascadeEdge(source="agriculture", target="economy", weight=0.4)
        ]
        
        # 2. Simulate Propagation
        # Simple logical propagation based on engine's logic
        # Steps:
        # Stage 0: Trigger Only
        # Stage 1: Direct Impacts (Env -> Health, Env -> Agri)
        # Stage 2: Secondary Impacts (Health -> Econ, Agri -> Econ)
        
        systems_state = {
            "environmental": 0.0,
            "health": 0.0,
            "agriculture": 0.0,
            "economy": 0.0
        }
        
        # Timeline events
        timeline = []
        
        # Stage 1 (0h): Trigger
        systems_state[trigger_system] = trigger_severity
        timeline.append(PropagationEvent(
            stage=1, 
            system=trigger_system, 
            severity=trigger_severity, 
            timestamp="0h"
        ))
        
        # Stage 2 (2h): Direct Propagation
        propagated_health = 0.0
        propagated_agri = 0.0
        
        if trigger_system == "environmental":
            # Env -> Health
            propagated_health = trigger_severity * 0.7  # weight
            systems_state["health"] = max(systems_state["health"], propagated_health)
            if propagated_health > 0.1:
                timeline.append(PropagationEvent(stage=2, system="health", severity=propagated_health, timestamp="2h"))
            
            # Env -> Agri
            propagated_agri = trigger_severity * 0.5 # weight
            systems_state["agriculture"] = max(systems_state["agriculture"], propagated_agri)
            if propagated_agri > 0.1:
                timeline.append(PropagationEvent(stage=2, system="agriculture", severity=propagated_agri, timestamp="2h"))

        # Stage 3 (6h): Secondary Propagation
        propagated_econ_h = systems_state["health"] * 0.35 # Health -> Econ
        propagated_econ_a = systems_state["agriculture"] * 0.40 # Agri -> Econ
        
        total_econ = min(propagated_econ_h + propagated_econ_a, 1.0)
        systems_state["economy"] = total_econ
        
        if total_econ > 0.1:
            timeline.append(PropagationEvent(stage=3, system="economy", severity=total_econ, timestamp="6h"))

        # 3. Construct Response
        systems_list = []
        affected_count = 0
        total_sev = 0.0
        
        for sys_id, sev in systems_state.items():
            affected = sev > 0.1
            if affected:
                affected_count += 1
                total_sev += sev
                
            systems_list.append(CascadeNode(
                id=sys_id,
                name=sys_id.capitalize(),
                severity=round(sev, 2),
                affected=affected
            ))
            
        summary = ImpactSummary(
            systems_affected=affected_count,
            cascade_stages=3 if affected_count > 1 else 1,
            average_severity=round(total_sev / affected_count, 2) if affected_count > 0 else 0.0,
            total_propagation_time="6h"
        )
        
        return CascadeResponse(
            systems=systems_list,
            edges=edges,
            propagation_timeline=timeline,
            impact_summary=summary
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Cascade analysis failed: {str(e)}")
