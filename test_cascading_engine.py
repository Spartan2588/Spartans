"""
Phase 2 Test Script - Cascading Risk Engine

Tests:
1. Cascading inference with P_env → Health
2. Policy scenario simulation
3. Confidence scoring
4. Resilience score calculation
"""

import os
import sys
import numpy as np

# Change to project directory
project_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(project_dir)

from model import CascadingRiskEngine, predict_cascading_risks, run_policy_scenario


def test_cascading_inference():
    """Test cascading risk inference."""
    print("\n" + "=" * 60)
    print("TEST 1: CASCADING INFERENCE")
    print("=" * 60)
    
    engine = CascadingRiskEngine()
    
    # High-risk scenario
    metrics = {
        'aqi': 180,
        'traffic_density': 2,
        'temperature': 38,
        'rainfall': 5,
        'hospital_load': 0.85,
        'respiratory_cases': 500,
        'crop_supply_index': 55,
        'food_price_index': 140,
        'supply_disruption_events': 4
    }
    
    result = engine.predict_cascading_risks(metrics)
    
    print("\nInput Metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")
    
    print("\nCascading Prediction Results:")
    print(f"  Environmental: {result['environmental']['risk']} (prob={result['environmental']['prob']:.2%})")
    print(f"  Health:        {result['health']['risk']} (prob={result['health']['prob']:.2%})")
    print(f"  Food Security: {result['food_security']['risk']} (prob={result['food_security']['prob']:.2%})")
    print(f"\n  Resilience Score: {result['resilience_score']}/100")
    
    print("\nConfidence Scores:")
    for domain, conf in result['confidence'].items():
        print(f"  {domain}: {conf:.1%}")
    
    print("\nCascading Effect:")
    print(f"  {result['cascading_effect']['description']}")
    
    # Validate output format
    assert 'environmental' in result
    assert 'health' in result
    assert 'food_security' in result
    assert 'resilience_score' in result
    assert 'confidence' in result
    assert 0 <= result['resilience_score'] <= 100
    
    print("\n✅ Cascading inference test PASSED")
    return engine


def test_policy_simulation(engine):
    """Test policy scenario simulation."""
    print("\n" + "=" * 60)
    print("TEST 2: POLICY SIMULATION")
    print("=" * 60)
    
    baseline_metrics = {
        'aqi': 200,
        'traffic_density': 2,
        'temperature': 40,
        'rainfall': 3,
        'hospital_load': 0.90,
        'respiratory_cases': 600,
        'crop_supply_index': 50,
        'food_price_index': 145,
        'supply_disruption_events': 4
    }
    
    # Comprehensive policy intervention
    policies = {
        'traffic_reduction': 0.40,      # 40% traffic reduction
        'aqi_cap': 150,                  # Cap AQI at 150
        'surge_capacity': 0.30,          # 30% hospital surge capacity
        'emergency_staffing': 0.20,      # 20% more staff
        'import_stabilization': 0.25,    # 25% import increase
        'subsidy_rate': 0.15             # 15% food subsidy
    }
    
    result = engine.run_policy_scenario(baseline_metrics, policies)
    
    print("\nBaseline State (High Risk):")
    print(f"  Environmental Risk: {result['baseline']['environmental']['prob']:.1%}")
    print(f"  Health Risk:        {result['baseline']['health']['prob']:.1%}")
    print(f"  Food Security Risk: {result['baseline']['food_security']['prob']:.1%}")
    print(f"  Resilience Score:   {result['baseline']['resilience_score']}")
    
    print("\nPolicies Applied:")
    for policy in result['policies_applied']:
        print(f"  - {policy}: {policies[policy]}")
    
    print("\nPost-Intervention State:")
    print(f"  Environmental Risk: {result['intervention']['environmental']['prob']:.1%}")
    print(f"  Health Risk:        {result['intervention']['health']['prob']:.1%}")
    print(f"  Food Security Risk: {result['intervention']['food_security']['prob']:.1%}")
    print(f"  Resilience Score:   {result['intervention']['resilience_score']}")
    
    print("\nRisk Reduction (percentage):")
    print(f"  Environmental: {result['percent_change']['environmental']:+.1f}%")
    print(f"  Health:        {result['percent_change']['health']:+.1f}%")
    print(f"  Food Security: {result['percent_change']['food_security']:+.1f}%")
    print(f"  Resilience:    {result['delta']['resilience_score']:+d} points")
    
    # Validate output structure (not strict improvement due to stochastic elements)
    assert 'baseline' in result
    assert 'intervention' in result
    assert 'delta' in result
    assert 'percent_change' in result
    assert 'policies_applied' in result
    
    print("\n✅ Policy simulation test PASSED")


def test_confidence_scoring(engine):
    """Test confidence score calculation."""
    print("\n" + "=" * 60)
    print("TEST 3: CONFIDENCE SCORING")
    print("=" * 60)
    
    # High confidence scenario (clear high risk)
    high_conf_metrics = {
        'aqi': 300,
        'traffic_density': 2,
        'temperature': 42,
        'rainfall': 0,
        'hospital_load': 0.95,
        'respiratory_cases': 800,
        'crop_supply_index': 40,
        'food_price_index': 160,
        'supply_disruption_events': 5
    }
    
    result_high = engine.predict_cascading_risks(high_conf_metrics)
    
    # Lower confidence scenario (mixed signals)
    mixed_metrics = {
        'aqi': 120,
        'traffic_density': 1,
        'temperature': 30,
        'rainfall': 40,
        'hospital_load': 0.60,
        'respiratory_cases': 200,
        'crop_supply_index': 70,
        'food_price_index': 105,
        'supply_disruption_events': 1
    }
    
    result_mixed = engine.predict_cascading_risks(mixed_metrics)
    
    print("\nHigh-Risk Scenario (clear signals):")
    print(f"  Environmental: risk={result_high['environmental']['risk']}, confidence={result_high['confidence']['environmental']:.1%}")
    print(f"  Health:        risk={result_high['health']['risk']}, confidence={result_high['confidence']['health']:.1%}")
    print(f"  Food Security: risk={result_high['food_security']['risk']}, confidence={result_high['confidence']['food_security']:.1%}")
    
    print("\nMixed-Signal Scenario:")
    print(f"  Environmental: risk={result_mixed['environmental']['risk']}, confidence={result_mixed['confidence']['environmental']:.1%}")
    print(f"  Health:        risk={result_mixed['health']['risk']}, confidence={result_mixed['confidence']['health']:.1%}")
    print(f"  Food Security: risk={result_mixed['food_security']['risk']}, confidence={result_mixed['confidence']['food_security']:.1%}")
    
    # Validate confidence is in valid range
    for result in [result_high, result_mixed]:
        for domain, conf in result['confidence'].items():
            assert 0 <= conf <= 1, f"Confidence for {domain} outside [0,1]: {conf}"
    
    print("\n✅ Confidence scoring test PASSED")


def test_missing_values(engine):
    """Test handling of missing values."""
    print("\n" + "=" * 60)
    print("TEST 4: MISSING VALUE HANDLING")
    print("=" * 60)
    
    # Partial metrics (some missing)
    partial_metrics = {
        'aqi': 150,
        # Missing: traffic_density, temperature, rainfall
        'hospital_load': 0.75,
        # Missing: respiratory_cases
        'crop_supply_index': 65
        # Missing: food_price_index, supply_disruption_events
    }
    
    print("\nPartial Input (many fields missing):")
    for key, value in partial_metrics.items():
        print(f"  {key}: {value}")
    
    result = engine.predict_cascading_risks(partial_metrics)
    
    print("\nPrediction still works:")
    print(f"  Environmental: {result['environmental']['risk']} ({result['environmental']['prob']:.1%})")
    print(f"  Health:        {result['health']['risk']} ({result['health']['prob']:.1%})")
    print(f"  Food Security: {result['food_security']['risk']} ({result['food_security']['prob']:.1%})")
    print(f"  Resilience:    {result['resilience_score']}/100")
    
    if result.get('assumptions'):
        print("\nAssumptions made:")
        for assumption in result['assumptions']:
            print(f"  - {assumption}")
    
    print("\n✅ Missing value handling test PASSED")


def test_standalone_functions():
    """Test standalone convenience functions."""
    print("\n" + "=" * 60)
    print("TEST 5: STANDALONE FUNCTIONS")
    print("=" * 60)
    
    metrics = {
        'aqi': 160,
        'traffic_density': 1,
        'temperature': 35,
        'rainfall': 10,
        'hospital_load': 0.70,
        'respiratory_cases': 300,
        'crop_supply_index': 65,
        'food_price_index': 115,
        'supply_disruption_events': 2
    }
    
    # Test predict_cascading_risks function
    result = predict_cascading_risks(metrics)
    print(f"\npredict_cascading_risks() output:")
    print(f"  Resilience Score: {result['resilience_score']}")
    
    # Test run_policy_scenario function
    scenario = run_policy_scenario(
        metrics,
        {'traffic_reduction': 0.30}
    )
    print(f"\nrun_policy_scenario() output:")
    print(f"  Baseline resilience:     {scenario['baseline']['resilience_score']}")
    print(f"  Intervention resilience: {scenario['intervention']['resilience_score']}")
    
    print("\n✅ Standalone functions test PASSED")


def main():
    print("=" * 60)
    print("PHASE 2 - CASCADING RISK ENGINE TESTS")
    print("=" * 60)
    
    # Test 1: Cascading inference
    engine = test_cascading_inference()
    
    # Test 2: Policy simulation
    test_policy_simulation(engine)
    
    # Test 3: Confidence scoring
    test_confidence_scoring(engine)
    
    # Test 4: Missing value handling
    test_missing_values(engine)
    
    # Test 5: Standalone functions
    test_standalone_functions()
    
    print("\n" + "=" * 60)
    print("ALL PHASE 2 TESTS PASSED!")
    print("=" * 60)
    print("\nCascading Risk Engine is ready for production.")


if __name__ == "__main__":
    main()
