
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def check(prompt, deltas_override=None):
    url = f"{BASE_URL}/scenario-delta"
    payload = {"city": "Mumbai"}
    
    if deltas_override:
        # We can pass custom deltas, but here we want to test inference from prompt...
        # Wait, the verification is about logic mapping signals -> deltas.
        # So we should send prompt or manually constructed request if possible?
        # The API allows `custom_prompt` which triggers inference.
        pass
    
    # We will just verify prompts
    pass

def verify_case(case_name, prompt, expected_hosp_range):
    print(f"\n--- Testing: {case_name} ---")
    print(f"Prompt: '{prompt}'")
    
    url = f"{BASE_URL}/scenario-delta"
    try:
        response = requests.post(url, json={"city": "Mumbai", "custom_prompt": prompt})
        data = response.json()
        
        deltas = data.get("deltas", {})
        h_delta = deltas.get("hospital_load_delta", 0)
        signals = deltas.get("signals", {})
        
        print(f"Signals: {json.dumps(signals, indent=2)}")
        print(f"Hospital Delta: {h_delta}")
        
        min_v, max_v = expected_hosp_range
        if min_v <= h_delta <= max_v:
            print(f"✅ PASS (Range {min_v}-{max_v})")
        else:
            print(f"❌ FAIL (Expected {min_v}-{max_v}, Got {h_delta})")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # 1. Moderate flood
    verify_case("Moderate Flood", "Moderate flood", (10, 25))
    
    # 2. Flood + Transport
    verify_case("Flood + Transport", "Flood disrupting transport", (20, 40))
    
    # 3. Flood + Access
    verify_case("Flood + Access", "Flood reducing hospital access", (30, 55))
    
    # 4. Prolonged Drought
    verify_case("Prolonged Drought", "Prolonged drought", (5, 15))
    
    # 5. Heatwave + AQI (Pollution)
    verify_case("Heatwave + Pollution", "Heatwave causing high pollution", (20, 45))
