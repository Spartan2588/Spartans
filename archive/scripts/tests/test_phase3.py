"""
Phase 3 Test Script - Scenario Analysis, ROI & Explainability

Tests:
1. Scenario comparison
2. Economic impact & ROI calculation
3. Natural language explanations
4. Feature importance
5. Decision signals
"""

import os
import sys
import json

# Change to project directory
project_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(project_dir)

from model import (
    CascadingRiskEngine,
    compare_scenarios,
    format_comparison_report,
    calculate_roi,
    CostAssumptions,
    ExplainabilityEngine,
    explain_prediction
)


def test_scenario_comparison():
    """Test scenario comparison functionality."""
    print("\n" + "=" * 60)
    print("TEST 1: SCENARIO COMPARISON")
    print("=" * 60)
    
    engine = CascadingRiskEngine()
    
    # Baseline scenario (high stress)
    baseline_metrics = {
        'aqi': 200, 'traffic_density': 2, 'temperature': 40, 'rainfall': 3,
        'hospital_load': 0.88, 'respiratory_cases': 550,
        'crop_supply_index': 52, 'food_price_index': 145, 'supply_disruption_events': 4
    }
    
    # Intervention scenario (policy applied)
    intervention_metrics = {
        'aqi': 120, 'traffic_density': 1, 'temperature': 40, 'rainfall': 3,
        'hospital_load': 0.68, 'respiratory_cases': 350,
        'crop_supply_index': 72, 'food_price_index': 110, 'supply_disruption_events': 1
    }
    
    baseline_pred = engine.predict_cascading_risks(baseline_metrics)
    intervention_pred = engine.predict_cascading_risks(intervention_metrics)
    
    comparison = compare_scenarios(baseline_pred, intervention_pred)
    
    print("\nComparison Results:")
    print(f"  Environmental: {comparison['environmental']['baseline_prob']:.1%} → {comparison['environmental']['intervention_prob']:.1%}")
    print(f"  Health:        {comparison['health']['baseline_prob']:.1%} → {comparison['health']['intervention_prob']:.1%}")
    print(f"  Food Security: {comparison['food_security']['baseline_prob']:.1%} → {comparison['food_security']['intervention_prob']:.1%}")
    print(f"  Resilience:    {comparison['resilience_score']['baseline']} → {comparison['resilience_score']['intervention']}")
    
    # Validate structure
    assert 'environmental' in comparison
    assert 'health' in comparison
    assert 'food_security' in comparison
    assert 'resilience_score' in comparison
    assert 'summary' in comparison
    
    print("\n✅ Scenario comparison test PASSED")
    
    return engine, baseline_pred, intervention_pred


def test_roi_calculation(baseline_pred, intervention_pred):
    """Test ROI and economic impact calculation."""
    print("\n" + "=" * 60)
    print("TEST 2: ECONOMIC IMPACT & ROI")
    print("=" * 60)
    
    intervention_cost = 25_000_000  # $25M
    
    roi_result = calculate_roi(
        baseline_risk=baseline_pred,
        intervention_risk=intervention_pred,
        intervention_cost=intervention_cost
    )
    
    print(f"\nIntervention Cost: ${roi_result['intervention_cost']:,.0f}")
    print(f"\nProjected Savings:")
    print(f"  Environmental: ${roi_result['environmental_savings']:,.0f}")
    print(f"  Health:        ${roi_result['health_savings']:,.0f}")
    print(f"  Food Security: ${roi_result['food_savings']:,.0f}")
    print(f"  Total:         ${roi_result['total_savings']:,.0f}")
    print(f"\nFinancial Metrics:")
    print(f"  Net Benefit:   ${roi_result['net_benefit']:,.0f}")
    print(f"  ROI:           {roi_result['roi_percent']:.1f}%")
    print(f"  Payback:       {roi_result['payback_period_months']} months")
    print(f"\nRecommendation: {roi_result['recommendation']}")
    
    # Validate structure
    assert 'intervention_cost' in roi_result
    assert 'total_savings' in roi_result
    assert 'roi' in roi_result
    assert 'recommendation' in roi_result
    
    # Validate JSON serializable
    json.dumps(roi_result)
    
    print("\n✅ ROI calculation test PASSED")


def test_explainability(engine):
    """Test natural language explanations."""
    print("\n" + "=" * 60)
    print("TEST 3: NATURAL LANGUAGE EXPLANATIONS")
    print("=" * 60)
    
    metrics = {
        'aqi': 175, 'traffic_density': 2, 'temperature': 38, 'rainfall': 5,
        'hospital_load': 0.82, 'respiratory_cases': 450,
        'crop_supply_index': 55, 'food_price_index': 140, 'supply_disruption_events': 3
    }
    
    predictions = engine.predict_cascading_risks(metrics)
    explanations = explain_prediction(metrics, predictions)
    
    print("\nGenerated Explanations:")
    for i, exp in enumerate(explanations, 1):
        print(f"  {i}. {exp}")
    
    # Validate explanations
    assert len(explanations) > 0
    assert any("AQI" in exp for exp in explanations)
    assert any("cascaded" in exp or "Environmental" in exp for exp in explanations)
    
    print("\n✅ Explainability test PASSED")


def test_decision_signals(engine):
    """Test decision signal generation."""
    print("\n" + "=" * 60)
    print("TEST 4: DECISION SIGNALS")
    print("=" * 60)
    
    # High risk scenario
    high_risk_metrics = {
        'aqi': 250, 'traffic_density': 2, 'temperature': 42, 'rainfall': 0,
        'hospital_load': 0.95, 'respiratory_cases': 700,
        'crop_supply_index': 40, 'food_price_index': 160, 'supply_disruption_events': 5
    }
    
    predictions = engine.predict_cascading_risks(high_risk_metrics)
    
    explainer = ExplainabilityEngine(engine)
    signals = explainer.get_decision_signals(predictions)
    
    print("\nDecision Signals:")
    for domain in ['environmental', 'health', 'food_security']:
        sig = signals[domain]
        print(f"  {domain.upper()}")
        print(f"    Signal: {sig['signal']}")
        print(f"    Risk: {sig['risk_level']} ({sig['risk_probability']:.1%})")
        print(f"    Confidence: {sig['confidence_level']} ({sig['confidence']:.1%})")
        print(f"    Action: {sig['recommended_action']}")
    
    print(f"\n  OVERALL: Resilience {signals['overall']['resilience_level']} ({signals['overall']['resilience_score']}/100)")
    
    # Validate structure
    assert 'environmental' in signals
    assert 'signal' in signals['environmental']
    assert 'recommended_action' in signals['environmental']
    
    # Validate JSON serializable
    json.dumps(signals)
    
    print("\n✅ Decision signals test PASSED")


def test_json_serialization(engine, baseline_pred, intervention_pred):
    """Test that all outputs are JSON serializable."""
    print("\n" + "=" * 60)
    print("TEST 5: JSON SERIALIZATION")
    print("=" * 60)
    
    # Test cascading predictions
    json_str = json.dumps(baseline_pred, default=str)
    print(f"  Predictions: {len(json_str)} bytes ✓")
    
    # Test scenario comparison
    comparison = compare_scenarios(baseline_pred, intervention_pred)
    json_str = json.dumps(comparison)
    print(f"  Comparison:  {len(json_str)} bytes ✓")
    
    # Test ROI
    roi = calculate_roi(baseline_pred, intervention_pred, 10_000_000)
    json_str = json.dumps(roi)
    print(f"  ROI:         {len(json_str)} bytes ✓")
    
    # Test explanations
    metrics = {'aqi': 150, 'traffic_density': 1, 'temperature': 30}
    explanations = explain_prediction(metrics, baseline_pred)
    json_str = json.dumps(explanations)
    print(f"  Explanations: {len(json_str)} bytes ✓")
    
    print("\n✅ JSON serialization test PASSED")


def main():
    print("=" * 60)
    print("PHASE 3 - SCENARIO ANALYSIS, ROI & EXPLAINABILITY TESTS")
    print("=" * 60)
    
    # Test 1: Scenario comparison
    engine, baseline, intervention = test_scenario_comparison()
    
    # Test 2: ROI calculation
    test_roi_calculation(baseline, intervention)
    
    # Test 3: Explainability
    test_explainability(engine)
    
    # Test 4: Decision signals
    test_decision_signals(engine)
    
    # Test 5: JSON serialization
    test_json_serialization(engine, baseline, intervention)
    
    print("\n" + "=" * 60)
    print("ALL PHASE 3 TESTS PASSED!")
    print("=" * 60)
    print("\nPhase 3 complete - Ready for frontend integration.")


if __name__ == "__main__":
    main()
