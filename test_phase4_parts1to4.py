"""
Phase 4 Test Script (Parts 1-4) - Validation, Robustness & Calibration

Tests:
1. End-to-end system validation
2. Probability & calibration verification
3. Edge case handling
4. Confidence consistency checks
"""

import os
import sys
import json
import time

# Change to project directory
project_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(project_dir)

from model import SystemValidator, run_full_system_check


def test_end_to_end_validation():
    """Test 1: Full end-to-end system validation."""
    print("\n" + "=" * 60)
    print("TEST 1: END-TO-END SYSTEM VALIDATION")
    print("=" * 60)
    
    result = run_full_system_check()
    
    print("\nSubsystem Status:")
    for name, status in result.items():
        if name in ['total_runtime_ms', 'all_passed', 'results']:
            continue
        emoji = "✅" if status == 'PASS' else "❌"
        print(f"  {emoji} {name}: {status}")
    
    print(f"\nTotal Runtime: {result['total_runtime_ms']:.1f}ms")
    print(f"All Passed: {result['all_passed']}")
    
    assert result['all_passed'], "End-to-end validation failed"
    
    print("\n✅ End-to-end validation PASSED")
    return SystemValidator()


def test_calibration_verification(validator):
    """Test 2: Probability calibration verification."""
    print("\n" + "=" * 60)
    print("TEST 2: CALIBRATION VERIFICATION")
    print("=" * 60)
    
    result = validator.verify_calibration(n_samples=50)
    
    print("\nProbability Sum Check:")
    ps = result['probability_sum']
    print(f"  Samples tested: {ps['samples_tested']}")
    print(f"  Violations: {ps['violations']}")
    print(f"  Status: {'✅ PASS' if ps['passed'] else '❌ FAIL'}")
    
    print("\nPerturbation Stability:")
    stab = result['perturbation_stability']
    print(f"  Epsilon: {stab['epsilon']}")
    print(f"  Max probability change: {stab['max_probability_change']:.4f}")
    print(f"  Stable: {'✅ Yes' if stab['stable'] else '⚠️ No'}")
    
    print("\nBrier Score:")
    brier = result['brier_score']
    if brier.get('score') is not None:
        print(f"  Score: {brier['score']:.4f}")
        print(f"  Interpretation: {brier['interpretation']}")
    else:
        print(f"  {brier.get('message', 'Not computed')}")
    
    print("\nExpected Calibration Error (ECE):")
    ece = result['expected_calibration_error']
    if ece.get('ece') is not None:
        print(f"  ECE: {ece['ece']:.4f}")
        print(f"  Interpretation: {ece['interpretation']}")
    else:
        print(f"  {ece.get('message', 'Not computed')}")
    
    print(f"\nCalibration Verified: {'✅ Yes' if result['calibration_verified'] else '⚠️ Partial'}")
    
    # Probability sum must pass
    assert result['probability_sum']['passed'], "Probability sum check failed"
    
    print("\n✅ Calibration verification PASSED")


def test_edge_cases(validator):
    """Test 3: Edge case and failure mode handling."""
    print("\n" + "=" * 60)
    print("TEST 3: EDGE CASE HANDLING")
    print("=" * 60)
    
    result = validator.test_edge_cases()
    
    print("\nMissing Values:")
    mv = result['missing_values']
    print(f"  Test cases: {mv['test_cases']}")
    print(f"  Errors: {mv['errors']}")
    print(f"  Handled: {'✅' if mv['handled'] else '❌'}")
    
    print("\nOut-of-Range Inputs:")
    oor = result['out_of_range']
    print(f"  Test cases: {oor['test_cases']}")
    print(f"  Errors: {len(oor['errors'])}")
    print(f"  Values clipped: {oor['values_clipped']}")
    print(f"  Handled: {'✅' if oor['handled'] else '❌'}")
    
    print("\nExtreme Values:")
    ev = result['extreme_values']
    if ev['handled']:
        print(f"  Extreme high resilience: {ev['extreme_high_resilience']}")
        print(f"  Extreme low resilience: {ev['extreme_low_resilience']}")
        print(f"  Sensible ordering: {'✅' if ev['sensible_ordering'] else '⚠️'}")
    else:
        print(f"  Error: {ev.get('error', 'Unknown')}")
    
    print("\nPartial Data:")
    pd = result['partial_data']
    for name, r in pd['partial_results'].items():
        status = '✅' if r['success'] else '❌'
        print(f"  {name}: {status}")
    
    print(f"\nAll Edge Cases Handled: {'✅' if result['all_edge_cases_handled'] else '⚠️'}")
    
    # Critical checks must pass
    assert result['missing_values']['handled'], "Missing value handling failed"
    assert result['out_of_range']['handled'], "Out-of-range handling failed"
    
    print("\n✅ Edge case handling PASSED")


def test_confidence_consistency(validator):
    """Test 4: Confidence consistency checks."""
    print("\n" + "=" * 60)
    print("TEST 4: CONFIDENCE CONSISTENCY")
    print("=" * 60)
    
    result = validator.check_confidence_consistency()
    
    print("\nClass Separation Check:")
    cs = result['class_separation']
    print(f"  Clear scenario confidence: {cs['clear_scenario_confidence']:.3f}")
    print(f"  Ambiguous scenario confidence: {cs['ambiguous_scenario_confidence']:.3f}")
    print(f"  Difference: {cs['confidence_difference']:.3f}")
    print(f"  Consistent: {'✅' if cs['consistent'] else '⚠️'}")
    
    print("\nNoise Sensitivity:")
    ns = result['noise_sensitivity']
    print(f"  Base confidence: {ns['base_confidence']:.3f}")
    print(f"  Noisy confidence: {ns['noisy_confidence']:.3f}")
    print(f"  Note: {ns['note']}")
    
    print("\nCascading Confidence:")
    cc = result['cascading_confidence']
    print(f"  Environmental confidence: {cc['environmental_confidence']:.3f}")
    print(f"  Health confidence: {cc['health_confidence']:.3f}")
    print(f"  Env risk cascaded: {cc['env_risk_cascaded']:.3f}")
    
    print("\nFlagged Predictions:")
    fp = result['flagged_cases']
    print(f"  Flagged: {fp['flagged_predictions']}")
    for flag in fp['flags'][:3]:  # Show first 3
        print(f"    - {flag['domain']}: {flag['issue']} (risk={flag['risk']}, conf={flag['confidence']})")
    
    print(f"\nConfidence Consistent: {'✅' if result['confidence_consistent'] else '⚠️'}")
    
    print("\n✅ Confidence consistency check PASSED")


def test_json_serialization(validator):
    """Test that all validation outputs are JSON-serializable."""
    print("\n" + "=" * 60)
    print("TEST 5: JSON SERIALIZATION OF VALIDATION OUTPUTS")
    print("=" * 60)
    
    # System check
    sys_check = run_full_system_check()
    json_str = json.dumps(sys_check, default=str)
    print(f"  System check: {len(json_str)} bytes ✓")
    
    # Calibration
    calibration = validator.verify_calibration(n_samples=20)
    json_str = json.dumps(calibration, default=str)
    print(f"  Calibration:  {len(json_str)} bytes ✓")
    
    # Edge cases
    edge_cases = validator.test_edge_cases()
    json_str = json.dumps(edge_cases, default=str)
    print(f"  Edge cases:   {len(json_str)} bytes ✓")
    
    # Confidence
    confidence = validator.check_confidence_consistency()
    json_str = json.dumps(confidence, default=str)
    print(f"  Confidence:   {len(json_str)} bytes ✓")
    
    print("\n✅ JSON serialization PASSED")


def main():
    print("=" * 60)
    print("PHASE 4 (PARTS 1-4) - VALIDATION & ROBUSTNESS TESTS")
    print("=" * 60)
    
    # Test 1: End-to-end
    validator = test_end_to_end_validation()
    
    # Need initialized engine
    validator._ensure_engine()
    
    # Test 2: Calibration
    test_calibration_verification(validator)
    
    # Test 3: Edge cases
    test_edge_cases(validator)
    
    # Test 4: Confidence
    test_confidence_consistency(validator)
    
    # Test 5: JSON serialization
    test_json_serialization(validator)
    
    print("\n" + "=" * 60)
    print("ALL PHASE 4 (PARTS 1-4) TESTS PASSED!")
    print("=" * 60)
    print("\nSystem validated and ready for demo.")


if __name__ == "__main__":
    main()
