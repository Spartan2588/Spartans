"""
Verification script for Phase 5 Backend Integration.
Tests:
1. MLEngine Singleton Loading
2. Cascade Analysis Endpoint Logic
3. Scenario Presets
4. Extended CRUD operations (Dashboard Data)
"""

import sys
import os
import asyncio
from pathlib import Path

# Add project root to path
sys.path.append(os.getcwd())

from api.ml import MLEngine
from api.cascade import analyze_cascade
from api.presets import get_presets
from api.crud import get_city_current_state
from api.database import SessionLocal
from model.cascading_engine import CascadingRiskEngine

async def test_ml_engine():
    print("\n--- Testing ML Engine Integration ---")
    try:
        # Mocking the heavy init for speed if needed, but let's try real load
        # We might need to handle if data files aren't there, but let's see.
        engine = MLEngine.get_instance()
        if isinstance(engine, CascadingRiskEngine):
            print("✅ MLEngine initialized successfully and returned CascadingRiskEngine instance.")
        else:
            print("❌ MLEngine failed to return correct instance.")
    except Exception as e:
        print(f"❌ MLEngine initialization failed: {e}")

async def test_cascade_endpoint():
    print("\n--- Testing Cascade Analysis API ---")
    try:
        # Test with Delhi
        response = await analyze_cascade(city="delhi", trigger_system="environmental", trigger_severity=0.8)
        
        print(f"✅ Response received. Impact Summary: {response.impact_summary}")
        
        # Verify structure
        assert len(response.systems) == 4, "Should have 4 systems"
        assert len(response.edges) > 0, "Should have edges"
        assert len(response.propagation_timeline) > 0, "Should have timeline events"
        
        # Verify logic (Env=0.8 -> Health should be affected)
        health_node = next(n for n in response.systems if n.id == "health")
        assert health_node.severity > 0, "Health should be affected by Environmental trigger"
        print("✅ Cascade logic verified.")
        
    except Exception as e:
        print(f"❌ Cascade endpoint failed: {e}")

async def test_presets():
    print("\n--- Testing Scenario Presets ---")
    try:
        presets = get_presets() # Directly calling function from module as import might differ
        # Actually it is in api.presets
        from api.presets import get_presets as get_presets_fn
        presets = get_presets_fn()
        
        assert len(presets) >= 3, "Should have at least 3 presets"
        print(f"✅ Found {len(presets)} presets.")
        
        heatwave = next((p for p in presets if p.id == "heatwave"), None)
        assert heatwave is not None, "Heatwave preset missing"
        assert heatwave.modifications["temperature"] == 45.0, "Heatwave temp mismatch"
        print("✅ Preset content verified.")
        
    except Exception as e:
        print(f"❌ Presets verification failed: {e}")

def test_crud_extensions():
    print("\n--- Testing CRUD Extensions (Dashboard Data) ---")
    db = SessionLocal()
    try:
        # Try to get data for a city/state that likely exists or mock it
        # We will check if the fields exist in the return dict, even if None
        city = "Mumbai" # Example
        
        result = get_city_current_state(db, city)
        
        fields_to_check = ["temperature", "crop_supply_index", "food_price_index", "humidity"]
        missing_fields = [f for f in fields_to_check if f not in result]
        
        if missing_fields:
            print(f"❌ Missing new fields in response: {missing_fields}")
        else:
            print("✅ All new fields present in current_state response.")
            print(f"   Temperature: {result.get('temperature')}")
            print(f"   Crop Supply: {result.get('crop_supply_index')}")
            
    except Exception as e:
        print(f"❌ CRUD verification failed: {e}")
    finally:
        db.close()

async def main():
    await test_ml_engine()
    await test_cascade_endpoint()
    await test_presets()
    test_crud_extensions()

if __name__ == "__main__":
    asyncio.run(main())
