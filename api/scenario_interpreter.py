
"""
Scenario Interpretation and Simulation Engine.
Implements semantic extraction (Natural Language -> Signals) and soft-coded impact logic.
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
from . import schemas

# SCENARIO CONFIGURATION (Soft-coded weights)
# This allows tuning without deep logic changes.
SCENARIO_CONFIG = {
    "base_impacts": {
        "flood": {
            "aqi": -10,      # Washout effect
            "temp": -4,     # Cooling effect
            "hospital": 12,  # Injuries/Diseases
            "food": -8       # Logistics disruption
        },
        "heatwave": {
            "aqi": 25,       # Ozone formation
            "temp": 5,      # Direct spike
            "hospital": 15,  # Heat stroke
            "food": -10      # Production loss
        },
        "pollution": {
            "aqi": 100,      # Major spike
            "temp": 1,
            "hospital": 10,  # Respiratory stress
            "food": -2
        },
        "drought": {
            "aqi": 15,       # Dust
            "temp": 3,
            "hospital": 8,   # Dehydration/Scarcity
            "food": -25      # Major production loss
        },
        "cyclone": {
            "aqi": -15,      # Strong washout
            "temp": -3,
            "hospital": 20,  # Trauma
            "food": -15      # Major logistics hit
        }
    },
    "secondary_impacts": {
        "transport_disruption": {
            "hospital": 15,  # Transport lag = higher patient risk
            "food": -5       # Logistics bottleneck
        },
        "hospital_access_reduction": {
            "hospital": 25,  # Direct strain on remaining capacity
            "food": 0
        },
        "food_supply_disruption": {
            "hospital": 0,
            "food": -10      # Direct availability drop
        }
    },
    "multipliers": {
        "severity": {"low": 0.5, "moderate": 1.0, "high": 1.5},
        "duration": {"short": 0.8, "moderate": 1.0, "prolonged": 1.5}
    },
    "bounds": {
        "aqi": (0, 500),
        "temperature": (-10, 55),
        "hospital_load": (0, 100),
        "food_availability": (10, 100) # Floor 10% to represent survival threshold
    }
}

class ScenarioInterpreter:
    """
    Interpretation Layer: Extracts semantic components from prompts.
    """
    KEYWORDS = {
        "primary_events": {
            "flood": ["flood", "flooding", "heavy rain", "monsoon", "waterlogging", "deluge"],
            "heatwave": ["heatwave", "heat", "hot", "temperature spike", "scorching", "sun"],
            "drought": ["drought", "dry", "arid", "water shortage", "no rain"],
            "pollution": ["pollution", "smog", "aqi", "air quality", "haze", "toxic"],
            "cyclone": ["cyclone", "storm", "hurricane", "wind", "gale"],
        },
        "severity": {
            "high": ["severe", "extreme", "catastrophic", "massive", "deadly", "critical", "major"],
            "low": ["mild", "minor", "slight", "small", "low"],
            "moderate": ["moderate", "medium", "average"]
        },
        "duration": {
            "prolonged": ["prolonged", "long", "weeks", "month", "extended", "chronic", "persistent"],
            "short": ["short", "brief", "flash", "sudden", "day", "hour"],
            "moderate": ["moderate", "medium"]
        },
        "secondary_impacts": {
            "transport_disruption": ["traffic", "transport", "road", "commute", "stuck", "jam"],
            "hospital_access_reduction": ["hospital", "medical", "ambulance", "health", "access"],
            "food_supply_disruption": ["food", "crop", "supply", "market", "shortage"]
        }
    }

    @classmethod
    def extract_signals(cls, prompt: str) -> schemas.ScenarioSignals:
        """Extract signals deterministically from text."""
        p = prompt.lower()
        events = [e for e, kws in cls.KEYWORDS["primary_events"].items() if any(kw in p for kw in kws)]
        severity = next((s for s, kws in cls.KEYWORDS["severity"].items() if any(kw in p for kw in kws)), "moderate")
        duration = next((d for d, kws in cls.KEYWORDS["duration"].items() if any(kw in p for kw in kws)), "moderate")
        impacts = [i for i, kws in cls.KEYWORDS["secondary_impacts"].items() if any(kw in p for kw in kws)]
        
        match_count = len(events) + len(impacts)
        conf = "high" if match_count >= 2 else "medium" if match_count == 1 else "low"
        
        return schemas.ScenarioSignals(
            primary_events=events if events else ["none"],
            duration=duration,
            severity=severity,
            secondary_impacts=impacts,
            confidence=conf
        )

class ScenarioSimulator:
    """
    Impact Layer: Applies soft-coded logic and aggregation.
    """
    @classmethod
    def get_deltas(cls, signals: schemas.ScenarioSignals) -> Dict[str, Any]:
        deltas = {"aqi_delta": 0, "temperature_delta": 0, "hospital_load_delta": 0, "crop_supply_delta": 0, "description": ""}
        
        s_mult = SCENARIO_CONFIG["multipliers"]["severity"].get(signals.severity, 1.0)
        d_mult = SCENARIO_CONFIG["multipliers"]["duration"].get(signals.duration, 1.0)
        
        processed_events = []
        active_events = signals.primary_events if signals.primary_events != ["none"] else []
        
        for event in active_events:
            processed_events.append(event)
            base = SCENARIO_CONFIG["base_impacts"].get(event, {})
            deltas["aqi_delta"] += base.get("aqi", 0) * s_mult
            deltas["temperature_delta"] += base.get("temp", 0) * (1.2 if signals.severity == "high" and event == "heatwave" else 1.0)
            deltas["hospital_load_delta"] += base.get("hospital", 0) * s_mult * d_mult
            deltas["crop_supply_delta"] += base.get("food", 0) * s_mult * d_mult
            
        for impact in signals.secondary_impacts:
            base = SCENARIO_CONFIG["secondary_impacts"].get(impact, {})
            deltas["hospital_load_delta"] += base.get("hospital", 0)
            deltas["crop_supply_delta"] += base.get("food", 0)

        # Build Description
        parts = []
        if signals.severity != 'moderate': parts.append(signals.severity.title())
        if signals.duration != 'moderate': parts.append(signals.duration.title())
        parts.append(", ".join([e.title() for e in processed_events]) if processed_events else "Scenario")
        if signals.secondary_impacts:
            impact_names = [i.replace('_', ' ').title().replace('Hospital Access Reduction', 'Infrastructure Disruption') for i in signals.secondary_impacts]
            parts.append(f"triggering {', '.join(impact_names)}")
            
        deltas["description"] = " ".join(parts)
        deltas["signals"] = signals
        return deltas

    @classmethod
    def apply_to_baseline(cls, baseline: Dict[str, Any], deltas: Dict[str, Any]) -> Dict[str, Any]:
        sim = {}
        b = SCENARIO_CONFIG["bounds"]
        
        # AQI
        val = baseline.get("aqi", 100) + deltas.get("aqi_delta", 0)
        sim["aqi"] = max(b["aqi"][0], min(b["aqi"][1], val))
        
        # Temp
        val = baseline.get("temperature", 25) + deltas.get("temperature_delta", 0)
        sim["temperature"] = max(b["temperature"][0], min(b["temperature"][1], val))
        
        # Hospital Load
        val = baseline.get("hospital_load", 50) + deltas.get("hospital_load_delta", 0)
        sim["hospital_load"] = max(b["hospital_load"][0], min(b["hospital_load"][1], val))
        
        # Food Availability (mapped from crop_supply)
        val = baseline.get("crop_supply", 70) + deltas.get("crop_supply_delta", 0)
        sim["crop_supply"] = max(b["food_availability"][0], min(b["food_availability"][1], val))
        
        return sim

def run_simulation_pipeline(
    baseline: Dict[str, Any],
    custom_prompt: Optional[str] = None,
    scenario_type: Optional[str] = None
) -> Dict[str, Any]:
    """Integrated Simulation Pipeline."""
    if custom_prompt:
        signals = ScenarioInterpreter.extract_signals(custom_prompt)
        source = "prompt_inference"
    elif scenario_type:
         # Map preset to deterministic signals
         signals = schemas.ScenarioSignals(
             primary_events=[scenario_type] if scenario_type in SCENARIO_CONFIG["base_impacts"] else ["none"],
             duration="short", severity="moderate", secondary_impacts=[], confidence="high"
         )
         if scenario_type == "crisis":
             signals.severity = "high"
             signals.secondary_impacts = ["transport_disruption", "hospital_access_reduction"]
         source = "preset"
    else:
        signals = schemas.ScenarioSignals(primary_events=["none"], duration="moderate", severity="moderate", secondary_impacts=[], confidence="high")
        source = "default"

    deltas = ScenarioSimulator.get_deltas(signals)
    simulated = ScenarioSimulator.apply_to_baseline(baseline, deltas)
    
    return {
        "baseline": baseline,
        "deltas": {**deltas, "source": source},
        "simulated": simulated,
        "timestamp": datetime.now().isoformat()
    }
