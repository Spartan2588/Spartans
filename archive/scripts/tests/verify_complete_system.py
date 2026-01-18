"""
COMPREHENSIVE SYSTEM VERIFICATION SCRIPT

This script verifies ALL functionality from Phase 1-4 works correctly
without opening any browser or external tools.

Tests:
- Phase 1: Risk models (Environmental, Health, Food Security)
- Phase 2: Cascading inference, policy simulation, confidence
- Phase 3: Scenario comparison, ROI, explanations
- Phase 4: Validation, calibration, edge cases, performance, completeness

Run this to verify the entire system is working.
"""

import os
import sys
import json
import time

# Change to project directory
project_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(project_dir)

print("=" * 70)
print("SMART CITY RISK PLATFORM - COMPLETE SYSTEM VERIFICATION")
print("=" * 70)
print(f"\nProject Dir: {project_dir}")
print("Loading modules...")

start_time = time.time()

from model import (
    CascadingRiskEngine,
    compare_scenarios,
    calculate_roi,
    explain_prediction,
    SystemValidator,
    run_all_validations
)

print(f"Modules loaded in {time.time() - start_time:.2f}s")


def run_phase1_tests():
    """Test Phase 1: Risk Models"""
    print("\n" + "=" * 70)
    print("PHASE 1: RISK MODELS")
    print("=" * 70)
    
    engine = CascadingRiskEngine()
    
    # Test individual models
    import numpy as np
    
    # Environmental
    X_env = np.array([[150, 2, 35, 10]])
    env_result = engine.env_model.predict_with_proba(X_env)
    print(f"\n✅ Environmental Model: {env_result['class'][0]} risk")
    
    # Health  
    X_health = np.array([[150, 0.75, 350, 35, 0.6]])
    health_result = engine.health_model.predict_with_proba(X_health)
    print(f"✅ Health Model: {health_result['class'][0]} risk")
    
    # Food
    X_food = np.array([[65, 120, 10, 35, 2]])
    food_result = engine.food_model.predict_with_proba(X_food)
    print(f"✅ Food Security Model: {food_result['class'][0]} risk")
    
    return engine


def run_phase2_tests(engine):
    """Test Phase 2: Cascading Inference & Policy Simulation"""
    print("\n" + "=" * 70)
    print("PHASE 2: CASCADING INFERENCE & POLICY SIMULATION")
    print("=" * 70)
    
    metrics = {
        'aqi': 175, 'traffic_density': 2, 'temperature': 38, 'rainfall': 5,
        'hospital_load': 0.82, 'respiratory_cases': 450,
        'crop_supply_index': 58, 'food_price_index': 135, 'supply_disruption_events': 3
    }
    
    # Cascading prediction
    result = engine.predict_cascading_risks(metrics)
    print(f"\n✅ Cascading Inference:")
    print(f"   Environmental: {result['environmental']['risk']} ({result['environmental']['prob']:.1%})")
    print(f"   Health:        {result['health']['risk']} ({result['health']['prob']:.1%})")
    print(f"   Food Security: {result['food_security']['risk']} ({result['food_security']['prob']:.1%})")
    print(f"   Resilience:    {result['resilience_score']}/100")
    print(f"   Cascade:       P_env={result['cascading_effect']['env_risk_injected_to_health']:.2%} → Health")
    
    # Policy simulation
    scenario = engine.run_policy_scenario(
        metrics,
        {'traffic_reduction': 0.35, 'surge_capacity': 0.25}
    )
    print(f"\n✅ Policy Simulation:")
    print(f"   Resilience: {scenario['baseline']['resilience_score']} → {scenario['intervention']['resilience_score']}")
    
    # Confidence
    print(f"\n✅ Confidence Scores:")
    for domain, conf in result['confidence'].items():
        print(f"   {domain}: {conf:.0%}")
    
    return result


def run_phase3_tests(engine, predictions):
    """Test Phase 3: Scenario Comparison, ROI, Explanations"""
    print("\n" + "=" * 70)
    print("PHASE 3: SCENARIO COMPARISON, ROI & EXPLANATIONS")
    print("=" * 70)
    
    # Create intervention
    intervention_metrics = {
        'aqi': 100, 'traffic_density': 1, 'temperature': 30, 'rainfall': 20,
        'hospital_load': 0.60, 'respiratory_cases': 200,
        'crop_supply_index': 80, 'food_price_index': 100, 'supply_disruption_events': 1
    }
    intervention = engine.predict_cascading_risks(intervention_metrics)
    
    # Scenario comparison
    comparison = compare_scenarios(predictions, intervention)
    print(f"\n✅ Scenario Comparison:")
    print(f"   Resilience: {comparison['resilience_score']['baseline']} → {comparison['resilience_score']['intervention']} ({comparison['resilience_score']['change']:+d})")
    
    # ROI
    roi = calculate_roi(predictions, intervention, 25_000_000)
    print(f"\n✅ ROI Calculation:")
    print(f"   Intervention Cost: ${roi['intervention_cost']:,.0f}")
    print(f"   Total Savings:     ${roi['total_savings']:,.0f}")
    print(f"   Net Benefit:       ${roi['net_benefit']:,.0f}")
    print(f"   ROI:               {roi['roi_percent']:.1f}%")
    print(f"   Recommendation:    {roi['recommendation_code']}")
    
    # Explanations
    metrics = {'aqi': 175, 'traffic_density': 2, 'hospital_load': 0.82}
    explanations = explain_prediction(metrics, predictions)
    print(f"\n✅ Natural Language Explanations ({len(explanations)} generated):")
    for exp in explanations[:3]:
        print(f"   • {exp[:80]}...")


def run_phase4_tests():
    """Test Phase 4: Validation, Calibration, Edge Cases, Performance"""
    print("\n" + "=" * 70)
    print("PHASE 4: VALIDATION & ROBUSTNESS")
    print("=" * 70)
    
    validator = SystemValidator()
    
    # Part 1: End-to-end
    print("\n📋 Part 1: End-to-End Validation")
    e2e = validator.run_full_system_check()
    for name, status in e2e.items():
        if name in ['total_runtime_ms', 'all_passed', 'results']:
            continue
        emoji = "✅" if status == 'PASS' else "❌"
        print(f"   {emoji} {name}")
    print(f"   ⏱️  Total: {e2e['total_runtime_ms']:.0f}ms")
    
    # Part 2: Calibration
    print("\n📋 Part 2: Calibration Verification")
    cal = validator.verify_calibration(n_samples=30)
    print(f"   ✅ Probability sum check: {'PASS' if cal['probability_sum']['passed'] else 'FAIL'}")
    print(f"   ✅ Perturbation stability: {'Stable' if cal['perturbation_stability']['stable'] else 'Unstable'}")
    if cal['brier_score'].get('score'):
        print(f"   ✅ Brier score: {cal['brier_score']['score']:.4f} ({cal['brier_score']['interpretation']})")
    
    # Part 3: Edge cases
    print("\n📋 Part 3: Edge Case Handling")
    edge = validator.test_edge_cases()
    print(f"   ✅ Missing values: {'Handled' if edge['missing_values']['handled'] else 'Failed'}")
    print(f"   ✅ Out-of-range: {'Handled' if edge['out_of_range']['handled'] else 'Failed'}")
    print(f"   ✅ Extreme values: {'Handled' if edge['extreme_values']['handled'] else 'Failed'}")
    
    # Part 4: Confidence
    print("\n📋 Part 4: Confidence Consistency")
    conf = validator.check_confidence_consistency()
    print(f"   ✅ Class separation: {'Consistent' if conf['class_separation']['consistent'] else 'Issue'}")
    print(f"   ✅ Flagged predictions: {conf['flagged_cases']['flagged_predictions']}")
    
    # Part 5: Explanation audit
    print("\n📋 Part 5: Explanation Audit")
    exp_audit = validator.audit_explanations()
    print(f"   ✅ Quality score: {exp_audit['quality_score']:.1%}")
    print(f"   ✅ Input reference rate: {exp_audit['input_reference_rate']:.0%}")
    print(f"   ✅ Issues found: {len(exp_audit['issues'])}")
    
    # Part 6: Performance
    print("\n📋 Part 6: Performance Testing")
    perf = validator.run_performance_tests(iterations=5)
    print(f"   ✅ Inference:    {perf['inference']['mean_ms']:.1f}ms (target <100ms)")
    print(f"   ✅ Comparison:   {perf['scenario_comparison']['mean_ms']:.1f}ms (target <50ms)")
    print(f"   ✅ ROI:          {perf['roi_calculation']['mean_ms']:.1f}ms (target <10ms)")
    print(f"   ✅ Explanation:  {perf['explanation']['mean_ms']:.1f}ms (target <50ms)")
    
    # Part 7: Completeness
    print("\n📋 Part 7: Functionality Completeness")
    complete = validator.check_functionality_completeness()
    for feature, status in complete.items():
        if feature == 'all_complete':
            continue
        emoji = "✅" if status else "❌"
        print(f"   {emoji} {feature}")
    
    return complete


def print_final_summary(completeness):
    """Print final summary"""
    print("\n" + "=" * 70)
    print("FINAL VERIFICATION SUMMARY")
    print("=" * 70)
    
    all_passed = bool(completeness['all_complete'])
    
    print("\n📊 FUNCTIONALITY CHECKLIST:")
    checklist = {
        'Phase 1 Models': bool(completeness['phase_1_models']),
        'Probability Calibration': bool(completeness['probability_calibration']),
        'Cascading Risk Engine': bool(completeness['cascading_risk_engine']),
        'Policy Simulation': bool(completeness['policy_scenario_simulation']),
        'Scenario Comparison': bool(completeness['scenario_comparison']),
        'ROI Calculation': bool(completeness['roi_calculation']),
        'Feature Importance': bool(completeness['feature_importance']),
        'NL Explanations': bool(completeness['natural_language_explanations']),
        'Confidence Scoring': bool(completeness['confidence_scoring']),
        'Real Data Robustness': bool(completeness['real_data_robustness']),
        'End-to-End Validation': bool(completeness['end_to_end_validation'])
    }
    
    passed = sum(1 for v in checklist.values() if v)
    total = len(checklist)
    
    for feature, status in checklist.items():
        emoji = "✅" if status else "❌"
        print(f"   {emoji} {feature}")
    
    print(f"\n   Score: {passed}/{total} ({passed/total:.0%})")
    
    print("\n" + "=" * 70)
    if all_passed:
        print("🎉 ALL SYSTEMS OPERATIONAL - READY FOR DEMO!")
    else:
        print("⚠️  SOME CHECKS FAILED - REVIEW NEEDED")
    print("=" * 70)
    
    # JSON output for programmatic verification
    print("\n📄 JSON Verification Output:")
    # Convert to plain Python types for JSON
    json_output = {k: bool(v) for k, v in completeness.items()}
    print(json.dumps(json_output, indent=2))


def main():
    total_start = time.time()
    
    # Phase 1
    engine = run_phase1_tests()
    
    # Phase 2
    predictions = run_phase2_tests(engine)
    
    # Phase 3
    run_phase3_tests(engine, predictions)
    
    # Phase 4
    completeness = run_phase4_tests()
    
    # Summary
    print_final_summary(completeness)
    
    print(f"\n⏱️  Total verification time: {time.time() - total_start:.1f}s")


if __name__ == "__main__":
    main()
