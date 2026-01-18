import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_signal_extraction(prompt):
    url = f"{BASE_URL}/scenario-delta"
    payload = {
        "city": "Mumbai",
        "custom_prompt": prompt
    }
    
    print(f"\nTesting prompt: '{prompt}'")
    try:
        response = requests.post(url, json=payload)
        if response.status_code != 200:
            print(f"FAILED: {response.text}")
            return
            
        data = response.json()
        deltas = data.get("deltas", {})
        signals = deltas.get("signals")
        
        if signals:
            print(" Signals Extracted:")
            print(json.dumps(signals, indent=2))
        else:
            print(" NO SIGNALS FOUND (Use 'signals' field in DeltaInfo missing?)")
            
        print(f" Deltas Applied: AQI={deltas.get('aqi_delta')}, Crop={deltas.get('crop_supply_delta')}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test case from user prompt
    test_signal_extraction("What if Mumbai experiences prolonged monsoon flooding that disrupts transport and hospital access?")
    
    # Another test case
    test_signal_extraction("Simulate a short but severe heatwave")
