"""
Scenario Delta Inference and Simulation.
Implements context-aware delta-based scenario simulation on top of real baseline data.
"""

from datetime import datetime
from typing import Dict, Any, Optional, Tuple, List
import re
from . import schemas

class ScenarioDeltas:
    """
    Infer parameter deltas from scenario type or natural language prompt.
    Deltas are relative changes applied on top of baseline (current) metrics.
    Context-aware using Structured Scenario Signals.
    """
    
    # Keyword Mappings for Structured Classification
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
            "power_outage": ["power", "electricity", "blackout", "outage", "light"],
            "water_shortage": ["water supply", "dry tap", "drinking water"],
            "food_supply_disruption": ["food", "crop", "supply", "market", "shortage"]
        }
    }

    @classmethod
    def extract_scenario_signals(cls, prompt: str) -> schemas.ScenarioSignals:
        """
        Extract structured scenario signals from prompt deterministically.
        Matches user's requested JSON Schema.
        """
        prompt_lower = prompt.lower()
        
        # 1. Primary Events
        primary_events = []
        for event, keywords in cls.KEYWORDS["primary_events"].items():
            if any(kw in prompt_lower for kw in keywords):
                primary_events.append(event)
        
        # 2. Severity (Default: moderate)
        severity = "moderate"
        for level, keywords in cls.KEYWORDS["severity"].items():
            if any(kw in prompt_lower for kw in keywords):
                severity = level
                break # Take first match
        
        # 3. Duration (Default: moderate)
        duration = "moderate"
        for length, keywords in cls.KEYWORDS["duration"].items():
            if any(kw in prompt_lower for kw in keywords):
                duration = length
                break
        
        # 4. Secondary Impacts
        secondary_impacts = []
        for impact, keywords in cls.KEYWORDS["secondary_impacts"].items():
            if any(kw in prompt_lower for kw in keywords):
                secondary_impacts.append(impact)
                
        # 5. Confidence Calculation
        # Simple heuristic: more keywords matched = higher confidence
        match_count = len(primary_events) + len(secondary_impacts) + (1 if severity != "moderate" else 0)
        confidence = "high" if match_count >= 2 else "medium" if match_count == 1 else "low"
        
        return schemas.ScenarioSignals(
            primary_events=primary_events if primary_events else ["none"],
            duration=duration,
            severity=severity,
            secondary_impacts=secondary_impacts,
            confidence=confidence
        )

    @classmethod
    def get_deltas_from_signals(cls, signals: schemas.ScenarioSignals) -> Dict[str, Any]:
        """
        Convert structured signals into physics-based deltas.
        """
        deltas = {
            "aqi_delta": 0,
            "temperature_delta": 0,
            "hospital_load_delta": 0,
            "crop_supply_delta": 0,
            "description": ""
        }
        
        # Multipliers based on Severity
        sev_mult = {"low": 0.5, "moderate": 1.0, "high": 1.5}.get(signals.severity, 1.0)
        
        # Multipliers based on Duration
        # Prolonged events have higher cumulative impact on health/food
        dur_mult = {"short": 0.8, "moderate": 1.0, "prolonged": 1.5}.get(signals.duration, 1.0)
        
    @classmethod
    def get_deltas_from_signals(cls, signals: schemas.ScenarioSignals) -> Dict[str, Any]:
        """
        Convert structured signals into physics-based deltas.
        Implements compositional logic: Sums impacts from all detected events.
        """
        deltas = {
            "aqi_delta": 0,
            "temperature_delta": 0,
            "hospital_load_delta": 0,
            "crop_supply_delta": 0,
            "description": ""
        }
        
        # Multipliers based on Severity
        sev_mult = {"low": 0.5, "moderate": 1.0, "high": 1.5}.get(signals.severity, 1.0)
        
        # Multipliers based on Duration
        # Prolonged events have higher cumulative impact on health/food
        dur_mult = {"short": 0.8, "moderate": 1.0, "prolonged": 1.5}.get(signals.duration, 1.0)
        
        # --- Compositional Event Logic ---
        # Iterate over ALL primary events and sum their impacts
        events_processed = []
        
        # If no events, default to 'none' logically (deltas 0)
        active_events = signals.primary_events if signals.primary_events and signals.primary_events != ["none"] else []
        
        for primary in active_events:
            events_processed.append(primary)
            
            if primary == "flood":
                # AQI improves (washout)
                deltas["aqi_delta"] += -10 * sev_mult
                deltas["temperature_delta"] += -4 * sev_mult
                
                # Health: Injuries / Waterborne diseases
                # Base +12% (Moderate). Range 10-25%.
                deltas["hospital_load_delta"] += 12 * sev_mult * dur_mult
                
                # Food: Logistics disruption
                deltas["crop_supply_delta"] += -8 * sev_mult * dur_mult

            elif primary == "heatwave":
                deltas["aqi_delta"] += 25 * sev_mult # Heat promotes ozone/smog
                deltas["temperature_delta"] += 5 * (1.2 if signals.severity == "high" else 1.0)
                deltas["hospital_load_delta"] += 15 * sev_mult * dur_mult # Heat stroke
                deltas["crop_supply_delta"] += -10 * dur_mult # Crops die over time
                
            elif primary == "pollution":
                deltas["aqi_delta"] += 100 * sev_mult
                deltas["temperature_delta"] += 1
                deltas["hospital_load_delta"] += 10 * sev_mult # Respiratory
                deltas["crop_supply_delta"] += -2 

            elif primary == "drought":
                deltas["aqi_delta"] += 15 * sev_mult # Dust
                deltas["temperature_delta"] += 3
                # Health: Dehydration, water scarcity
                # Base +8. Prolonged -> 12.
                deltas["hospital_load_delta"] += 8 * dur_mult
                deltas["crop_supply_delta"] += -25 * dur_mult

            elif primary == "cyclone":
                deltas["aqi_delta"] += -15 * sev_mult # Washout
                deltas["temperature_delta"] += -3
                deltas["hospital_load_delta"] += 20 * sev_mult # Trauma
                deltas["crop_supply_delta"] += -15 * sev_mult 
            
        # --- Secondary Impact Add-ons ---
        if "transport_disruption" in signals.secondary_impacts:
             # Critical for Food Logistics
             deltas["crop_supply_delta"] -= 5 
             # Critical for Hospital Access (implies patients stuck OR ambulances stuck -> delayed care -> higher acuity/mortality risk, effectively higher load per bed due to longer stays?)
             # User specified: Flood + Transport -> Hospital +20-40%. 
             # Base Flood(12) + Transport(15) = 27.
             deltas["hospital_load_delta"] += 15
             
        if "hospital_access_reduction" in signals.secondary_impacts:
             # Directly spikes hospital load (strain on available resources, triage chaos)
             # User specified: Flood + Access -> +30-55%.
             # Base Flood(12) + Access(25) = 37.
             deltas["hospital_load_delta"] += 25
             
        if "food_supply_disruption" in signals.secondary_impacts:
             deltas["crop_supply_delta"] -= 10
             
        # Generate Description
        desc_parts = []
        if signals.severity != 'moderate': desc_parts.append(signals.severity.title())
        if signals.duration != 'moderate': desc_parts.append(signals.duration.title())
        
        desc_parts.append(", ".join([e.title() for e in events_processed]) if events_processed else "Scenario")
        
        if signals.secondary_impacts:
            impacts = [i.replace('_', ' ').title() for i in signals.secondary_impacts]
            desc_parts.append(f"causing {', '.join(impacts)}")
            
        deltas["description"] = " ".join(desc_parts)
        deltas["signals"] = signals # Store for API response
        
        return deltas

    @classmethod
    def apply_deltas_to_baseline(cls, baseline: Dict[str, Any], deltas: Dict[str, Any]) -> Dict[str, Any]:
        """Apply deltas with logical bounds checking."""
        simulated = {}
        
        # 1. AQI (0 - 500)
        base_aqi = baseline.get("aqi", 100)
        delta_aqi = deltas.get("aqi_delta", 0)
        simulated["aqi"] = max(0, min(500, base_aqi + delta_aqi))
        
        # 2. Temperature (-10 to 55)
        base_temp = baseline.get("temperature", 25)
        delta_temp = deltas.get("temperature_delta", 0)
        simulated["temperature"] = max(-10, min(55, base_temp + delta_temp))
        
        # 3. Hospital Load (0 - 100%)
        # Input baseline is assumed to be 0-100 scale (ensured by fetch_current_metrics)
        base_hosp = baseline.get("hospital_load", 50)
        
        delta_hosp = deltas.get("hospital_load_delta", 0)
        simulated_hosp = max(0, min(100, base_hosp + delta_hosp))
        simulated["hospital_load"] = simulated_hosp
        
        # 4. Crop Supply / Food Availability (0 - 100)
        base_crop = baseline.get("crop_supply", 70)
        delta_crop = deltas.get("crop_supply_delta", 0)
        simulated["crop_supply"] = max(10, min(100, base_crop + delta_crop)) # Floor 10

        simulated["deltas_applied"] = {
            "aqi": {"baseline": base_aqi, "delta": delta_aqi, "final": simulated["aqi"]},
            "temperature": {"baseline": base_temp, "delta": delta_temp, "final": simulated["temperature"]},
            "hospital_load": {"baseline": base_hosp, "delta": delta_hosp, "final": simulated["hospital_load"]},
            "crop_supply": {"baseline": base_crop, "delta": delta_crop, "final": simulated["crop_supply"]}
        }
        
        return simulated

def run_delta_simulation(
    baseline_metrics: Dict[str, Any],
    scenario_type: Optional[str] = None,
    custom_prompt: Optional[str] = None,
    custom_deltas: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Run simulation with context-aware logic."""
    if custom_deltas:
        deltas = custom_deltas
        deltas["source"] = "custom"
        # Dummy signals for custom
        deltas["signals"] = None
    elif custom_prompt:
        # NEW: use structured signals
        signals = ScenarioDeltas.extract_scenario_signals(custom_prompt)
        deltas = ScenarioDeltas.get_deltas_from_signals(signals)
        deltas["source"] = "prompt_inference"
        deltas["inferred_scenario"] = signals.primary_events[0]
        deltas["inference_confidence"] = 0.9 if signals.confidence == "high" else 0.5
    elif scenario_type:
        # Map preset to signals
        # Just create specific signals for the button press
        signals = schemas.ScenarioSignals(
            primary_events=[scenario_type if scenario_type in ScenarioDeltas.KEYWORDS["primary_events"] else "none"],
            duration="short",
            severity="moderate",
            secondary_impacts=[],
            confidence="high"
        )
        if scenario_type == "crisis": # Special case mapping
             signals.severity = "high"
             signals.secondary_impacts = ["transport_disruption", "hospital_access_reduction"]
             
        deltas = ScenarioDeltas.get_deltas_from_signals(signals)
        deltas["source"] = "preset"
        deltas["inferred_scenario"] = scenario_type
        deltas["inference_confidence"] = 1.0
    else:
        signals = schemas.ScenarioSignals(primary_events=["none"], duration="moderate", severity="moderate", secondary_impacts=[], confidence="high")
        deltas = ScenarioDeltas.get_deltas_from_signals(signals)
        deltas["source"] = "default"
    
    simulated = ScenarioDeltas.apply_deltas_to_baseline(baseline_metrics, deltas)
    
    result = {
        "baseline": baseline_metrics,
        "deltas": {
            "aqi_delta": deltas.get("aqi_delta", 0),
            "temperature_delta": deltas.get("temperature_delta", 0),
            "hospital_load_delta": deltas.get("hospital_load_delta", 0),
            "crop_supply_delta": deltas.get("crop_supply_delta", 0),
            "source": deltas.get("source"),
            "inferred_scenario": deltas.get("inferred_scenario"),
            "signals": deltas.get("signals"), # Pass signals object
            "inference_confidence": deltas.get("inference_confidence"),
            "description": deltas.get("description", "")
        },
        "simulated": simulated,
        "validation": {
            "used_live_data": baseline_metrics.get("data_freshness") in ["live", "recent"],
            "fallback_used": baseline_metrics.get("data_freshness") not in ["live", "recent"],
            "deltas_applied": True,
            "ml_executed": False
        },
        "timestamp": datetime.now().isoformat()
    }
    return result
