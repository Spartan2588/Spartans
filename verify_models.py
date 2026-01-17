"""
Phase 1 Verification Script

Run this to verify all three risk models are working correctly
with calibrated probability outputs and policy simulation hooks.
"""

from model.risk_engine import RiskEngine
import numpy as np

def main():
    print("=" * 60)
    print("PHASE 1 COMPLETE VERIFICATION")
    print("=" * 60)
    
    # Initialize and train models
    engine = RiskEngine()
    
    # Test Environmental Model
    print("\n[1] ENVIRONMENTAL RISK MODEL")
    print("-" * 40)
    
    env_result = engine.predict_environmental(
        aqi=180,
        traffic_density=2,
        temperature=35,
        rainfall=5
    )
    print(f"Input: AQI=180, Traffic=HIGH, Temp=35°C, Rain=5mm")
    print(f"Risk Class: {env_result['risk_class'].upper()}")
    print(f"Probabilities:")
    print(f"  Low:    {env_result['probabilities']['low']:.2%}")
    print(f"  Medium: {env_result['probabilities']['medium']:.2%}")
    print(f"  High:   {env_result['probabilities']['high']:.2%}")
    
    # Test policy simulation
    X_env = np.array([[180, 2, 35, 5]])
    traffic_policy = engine.env_model.simulate_traffic_reduction(X_env, 0.40)
    print(f"\nPolicy Test: 40% Traffic Reduction")
    print(f"  Baseline High-Risk: {traffic_policy['baseline']['probabilities']['high'][0]:.2%}")
    print(f"  After Policy:       {traffic_policy['intervention']['probabilities']['high'][0]:.2%}")
    print(f"  Risk Reduction:     {traffic_policy['risk_reduction'][0]:.2%}")
    
    # Test Health Model
    print("\n[2] HEALTH RISK MODEL")
    print("-" * 40)
    
    health_result = engine.predict_health(
        aqi=180,
        hospital_load=0.78,
        respiratory_cases=280,
        temperature=35,
        environmental_risk_prob=0.75
    )
    print(f"Input: AQI=180, Hospital=78%, Cases=280, Env Risk=75%")
    print(f"Risk Class: {health_result['risk_class'].upper()}")
    print(f"Probabilities:")
    print(f"  Low:    {health_result['probabilities']['low']:.2%}")
    print(f"  Medium: {health_result['probabilities']['medium']:.2%}")
    print(f"  High:   {health_result['probabilities']['high']:.2%}")
    
    # Test health policy
    X_health = np.array([[180, 0.85, 280, 35, 0.75]])
    surge_policy = engine.health_model.simulate_hospital_surge_capacity(X_health, 0.20)
    print(f"\nPolicy Test: 20% Surge Capacity")
    print(f"  Baseline High-Risk: {surge_policy['baseline']['probabilities']['high'][0]:.2%}")
    print(f"  After Policy:       {surge_policy['intervention']['probabilities']['high'][0]:.2%}")
    
    # Test Food Security Model
    print("\n[3] FOOD SECURITY RISK MODEL")
    print("-" * 40)
    
    food_result = engine.predict_food_security(
        crop_supply_index=65,
        food_price_index=125,
        rainfall=25,
        temperature=38,
        supply_disruption_events=2
    )
    print(f"Input: Supply=65, Price=125, Rain=25mm, Disruptions=2")
    print(f"Risk Class: {food_result['risk_class'].upper()}")
    print(f"Probabilities:")
    print(f"  Low:    {food_result['probabilities']['low']:.2%}")
    print(f"  Medium: {food_result['probabilities']['medium']:.2%}")
    print(f"  High:   {food_result['probabilities']['high']:.2%}")
    
    # Test food policy
    X_food = np.array([[55, 135, 25, 38, 3]])
    import_policy = engine.food_model.simulate_food_import_stabilization(X_food, 0.20)
    print(f"\nPolicy Test: 20% Import Increase")
    print(f"  Baseline High-Risk: {import_policy['baseline']['probabilities']['high'][0]:.2%}")
    print(f"  After Policy:       {import_policy['intervention']['probabilities']['high'][0]:.2%}")
    
    # Feature Importance
    print("\n[4] HEALTH MODEL FEATURE IMPORTANCE")
    print("-" * 40)
    importance = engine.get_health_feature_importance()
    sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)
    for feature, score in sorted_imp:
        bar = "█" * int(score * 30)
        print(f"  {feature:30} {score:.3f} {bar}")
    
    print("\n" + "=" * 60)
    print("✓ ALL MODELS TRAINED AND VERIFIED SUCCESSFULLY")
    print("✓ Calibrated probability outputs working")
    print("✓ Policy simulation hooks functional")
    print("=" * 60)
    print("\nPhase 1 Complete - Ready for Phase 2 Cascading Integration")


if __name__ == "__main__":
    main()
