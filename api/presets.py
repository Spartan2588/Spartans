"""
Scenario Presets for What-If Analysis.
"""

from typing import List, Dict, Optional
from pydantic import BaseModel

class ScenarioPreset(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    modifications: Dict[str, float]

# Pre-defined scenarios
PRESETS = [
    ScenarioPreset(
        id="heatwave",
        name="Heatwave",
        icon="🔥",
        description="Simulate extreme heat conditions increasing respiratory risk and energy demand.",
        modifications={
            "temperature": 45.0,  # High temp
            "aqi": 180.0,         # Worsened air quality
            "respiratory_cases": 800.0
        }
    ),
    ScenarioPreset(
        id="drought",
        name="Drought",
        icon="🏜️",
        description="Simulate water scarcity impacting agriculture and food prices.",
        modifications={
            "crop_supply_index": 30.0,   # Low supply
            "price_volatility": 0.60     # High volatility
        }
    ),
    ScenarioPreset(
        id="crisis",
        name="Urban Crisis",
        icon="⚠️",
        description="Compound failure event: High pollution + Supply chain breakdown.",
        modifications={
            "aqi": 250.0,
            "hospital_load": 0.95,       # 95% occupancy
            "crop_supply_index": 20.0
        }
    )
]

def get_presets() -> List[ScenarioPreset]:
    """Get all available scenario presets."""
    return PRESETS
