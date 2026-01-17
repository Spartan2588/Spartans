"""
Scenario Comparison Engine

Compares baseline vs intervention scenarios with:
- Risk probability deltas
- Percentage changes
- Resilience score comparison
"""

from typing import Dict, Any, Optional
import numpy as np


def compare_scenarios(
    baseline_predictions: Dict[str, Any],
    intervention_predictions: Dict[str, Any]
) -> Dict:
    """
    Compare two city states: baseline (no intervention) vs intervention (policy applied).
    
    Args:
        baseline_predictions: Risk predictions for baseline scenario
        intervention_predictions: Risk predictions after policy intervention
    
    Returns:
        Detailed comparison with deltas and percentage changes:
        {
            "environmental": {
                "baseline_prob": 0.72,
                "intervention_prob": 0.48,
                "absolute_change": -0.24,
                "percent_change": -33.3,
                "risk_class_change": "high → medium"
            },
            "health": {...},
            "food_security": {...},
            "resilience_score": {
                "baseline": 38,
                "intervention": 61,
                "change": +23,
                "improvement_percent": 60.5
            },
            "confidence_comparison": {...}
        }
    """
    
    def calc_percent_change(baseline: float, intervention: float) -> float:
        """Calculate percentage change, handling zero baseline."""
        if baseline == 0:
            return 0.0 if intervention == 0 else 100.0
        return ((intervention - baseline) / baseline) * 100
    
    def format_risk_change(baseline_class: str, intervention_class: str) -> str:
        """Format risk class change as readable string."""
        if baseline_class == intervention_class:
            return f"{baseline_class} (unchanged)"
        return f"{baseline_class} → {intervention_class}"
    
    result = {}
    
    # Environmental comparison
    env_b = baseline_predictions['environmental']
    env_i = intervention_predictions['environmental']
    env_baseline_prob = env_b['prob']
    env_intervention_prob = env_i['prob']
    
    result['environmental'] = {
        'baseline_prob': round(env_baseline_prob, 4),
        'intervention_prob': round(env_intervention_prob, 4),
        'absolute_change': round(env_intervention_prob - env_baseline_prob, 4),
        'percent_change': round(calc_percent_change(env_baseline_prob, env_intervention_prob), 2),
        'risk_class_change': format_risk_change(env_b['risk'], env_i['risk']),
        'baseline_class': env_b['risk'],
        'intervention_class': env_i['risk']
    }
    
    # Health comparison
    health_b = baseline_predictions['health']
    health_i = intervention_predictions['health']
    health_baseline_prob = health_b['prob']
    health_intervention_prob = health_i['prob']
    
    result['health'] = {
        'baseline_prob': round(health_baseline_prob, 4),
        'intervention_prob': round(health_intervention_prob, 4),
        'absolute_change': round(health_intervention_prob - health_baseline_prob, 4),
        'percent_change': round(calc_percent_change(health_baseline_prob, health_intervention_prob), 2),
        'risk_class_change': format_risk_change(health_b['risk'], health_i['risk']),
        'baseline_class': health_b['risk'],
        'intervention_class': health_i['risk']
    }
    
    # Food security comparison
    food_b = baseline_predictions['food_security']
    food_i = intervention_predictions['food_security']
    food_baseline_prob = food_b['prob']
    food_intervention_prob = food_i['prob']
    
    result['food_security'] = {
        'baseline_prob': round(food_baseline_prob, 4),
        'intervention_prob': round(food_intervention_prob, 4),
        'absolute_change': round(food_intervention_prob - food_baseline_prob, 4),
        'percent_change': round(calc_percent_change(food_baseline_prob, food_intervention_prob), 2),
        'risk_class_change': format_risk_change(food_b['risk'], food_i['risk']),
        'baseline_class': food_b['risk'],
        'intervention_class': food_i['risk']
    }
    
    # Resilience score comparison
    res_baseline = baseline_predictions['resilience_score']
    res_intervention = intervention_predictions['resilience_score']
    res_change = res_intervention - res_baseline
    
    result['resilience_score'] = {
        'baseline': res_baseline,
        'intervention': res_intervention,
        'change': res_change,
        'improvement_percent': round(calc_percent_change(res_baseline, res_intervention), 2) if res_baseline > 0 else 0
    }
    
    # Confidence comparison
    result['confidence_comparison'] = {
        'environmental': {
            'baseline': baseline_predictions['confidence']['environmental'],
            'intervention': intervention_predictions['confidence']['environmental']
        },
        'health': {
            'baseline': baseline_predictions['confidence']['health'],
            'intervention': intervention_predictions['confidence']['health']
        },
        'food_security': {
            'baseline': baseline_predictions['confidence']['food_security'],
            'intervention': intervention_predictions['confidence']['food_security']
        }
    }
    
    # Summary metrics
    result['summary'] = {
        'total_risk_reduction': round(
            -result['environmental']['absolute_change'] +
            -result['health']['absolute_change'] +
            -result['food_security']['absolute_change'],
            4
        ),
        'resilience_improvement': res_change,
        'intervention_effective': res_change > 0
    }
    
    return result


def format_comparison_report(comparison: Dict) -> str:
    """
    Format comparison results as human-readable report.
    
    Args:
        comparison: Output from compare_scenarios()
    
    Returns:
        Formatted string report
    """
    lines = []
    lines.append("=" * 60)
    lines.append("SCENARIO COMPARISON REPORT")
    lines.append("=" * 60)
    
    # Environmental
    env = comparison['environmental']
    lines.append(f"\n📊 ENVIRONMENTAL RISK")
    lines.append(f"   Baseline:     {env['baseline_prob']:.1%} ({env['baseline_class']})")
    lines.append(f"   Intervention: {env['intervention_prob']:.1%} ({env['intervention_class']})")
    lines.append(f"   Change:       {env['absolute_change']:+.1%} ({env['percent_change']:+.1f}%)")
    
    # Health
    health = comparison['health']
    lines.append(f"\n🏥 HEALTH RISK")
    lines.append(f"   Baseline:     {health['baseline_prob']:.1%} ({health['baseline_class']})")
    lines.append(f"   Intervention: {health['intervention_prob']:.1%} ({health['intervention_class']})")
    lines.append(f"   Change:       {health['absolute_change']:+.1%} ({health['percent_change']:+.1f}%)")
    
    # Food Security
    food = comparison['food_security']
    lines.append(f"\n🌾 FOOD SECURITY RISK")
    lines.append(f"   Baseline:     {food['baseline_prob']:.1%} ({food['baseline_class']})")
    lines.append(f"   Intervention: {food['intervention_prob']:.1%} ({food['intervention_class']})")
    lines.append(f"   Change:       {food['absolute_change']:+.1%} ({food['percent_change']:+.1f}%)")
    
    # Resilience
    res = comparison['resilience_score']
    lines.append(f"\n🎯 RESILIENCE SCORE")
    lines.append(f"   Baseline:     {res['baseline']}/100")
    lines.append(f"   Intervention: {res['intervention']}/100")
    lines.append(f"   Improvement:  {res['change']:+d} points")
    
    # Summary
    summary = comparison['summary']
    lines.append(f"\n" + "=" * 60)
    if summary['intervention_effective']:
        lines.append("✅ INTERVENTION EFFECTIVE - Resilience increased")
    else:
        lines.append("⚠️ INTERVENTION HAD LIMITED EFFECT")
    lines.append("=" * 60)
    
    return "\n".join(lines)
