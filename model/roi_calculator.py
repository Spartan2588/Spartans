"""
Economic Impact & ROI Calculator

Converts risk reduction into financial value:
- Health crisis cost exposure
- Food insecurity cost exposure
- Net benefit and ROI calculation

This is a deterministic economic layer, not ML.
All parameters are configurable and transparent.
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class CostAssumptions:
    """
    Configurable cost assumptions for ROI calculation.
    
    All values in USD. Defaults are illustrative and should be
    adjusted based on actual city/region data.
    """
    # Health sector cost exposures (per unit probability)
    health_crisis_exposure: float = 200_000_000  # $200M per unit probability
    health_icu_cost_per_bed: float = 50_000      # Daily ICU cost
    health_outbreak_multiplier: float = 1.5      # Cost multiplier during outbreak
    
    # Food security cost exposures
    food_insecurity_exposure: float = 50_000_000  # $50M per unit probability
    food_price_volatility_cost: float = 20_000_000  # Cost of price spikes
    food_supply_disruption_cost: float = 30_000_000  # Per major disruption
    
    # Environmental cost exposures
    environmental_health_cost: float = 75_000_000  # $75M per unit probability
    environmental_productivity_loss: float = 25_000_000  # Economic productivity
    
    # General multipliers
    uncertainty_discount: float = 0.85  # Discount for model uncertainty
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary for JSON serialization."""
        return {
            'health_crisis_exposure': self.health_crisis_exposure,
            'health_icu_cost_per_bed': self.health_icu_cost_per_bed,
            'health_outbreak_multiplier': self.health_outbreak_multiplier,
            'food_insecurity_exposure': self.food_insecurity_exposure,
            'food_price_volatility_cost': self.food_price_volatility_cost,
            'food_supply_disruption_cost': self.food_supply_disruption_cost,
            'environmental_health_cost': self.environmental_health_cost,
            'environmental_productivity_loss': self.environmental_productivity_loss,
            'uncertainty_discount': self.uncertainty_discount
        }


# Default cost assumptions (can be overridden)
DEFAULT_COSTS = CostAssumptions()


def calculate_roi(
    baseline_risk: Dict[str, Any],
    intervention_risk: Dict[str, Any],
    intervention_cost: float,
    cost_assumptions: Optional[CostAssumptions] = None,
    confidence_weighted: bool = True
) -> Dict:
    """
    Calculate economic impact and ROI for a policy intervention.
    
    Converts risk reduction into financial value using configurable
    cost assumptions. The logic is:
    
    1. Calculate baseline expected costs from risk probabilities
    2. Calculate intervention expected costs
    3. Savings = Baseline costs - Intervention costs
    4. Net benefit = Savings - Intervention cost
    5. ROI = Net benefit / Intervention cost
    
    Args:
        baseline_risk: Risk predictions before intervention
        intervention_risk: Risk predictions after intervention
        intervention_cost: Cost of implementing the policy (USD)
        cost_assumptions: Optional custom cost parameters
        confidence_weighted: If True, apply confidence-based discount
    
    Returns:
        {
            "intervention_cost": 25_000_000,
            "environmental_savings": 18_000_000,
            "health_savings": 48_000_000,
            "food_savings": 12_000_000,
            "total_savings": 78_000_000,
            "net_benefit": 53_000_000,
            "roi": 2.12,
            "payback_period_months": 5.7,
            "assumptions_used": {...},
            "calculation_notes": [...]
        }
    """
    costs = cost_assumptions or DEFAULT_COSTS
    notes = []
    
    # Extract probabilities
    env_baseline = baseline_risk['environmental']['prob']
    env_intervention = intervention_risk['environmental']['prob']
    env_reduction = max(0, env_baseline - env_intervention)
    
    health_baseline = baseline_risk['health']['prob']
    health_intervention = intervention_risk['health']['prob']
    health_reduction = max(0, health_baseline - health_intervention)
    
    food_baseline = baseline_risk['food_security']['prob']
    food_intervention = intervention_risk['food_security']['prob']
    food_reduction = max(0, food_baseline - food_intervention)
    
    # Apply confidence weighting if enabled
    confidence_factor = 1.0
    if confidence_weighted and 'confidence' in baseline_risk:
        avg_confidence = (
            baseline_risk['confidence']['environmental'] +
            baseline_risk['confidence']['health'] +
            baseline_risk['confidence']['food_security']
        ) / 3
        confidence_factor = costs.uncertainty_discount + (1 - costs.uncertainty_discount) * avg_confidence
        notes.append(f"Confidence factor applied: {confidence_factor:.2f}")
    
    # Calculate environmental savings
    env_total_exposure = costs.environmental_health_cost + costs.environmental_productivity_loss
    environmental_savings = env_reduction * env_total_exposure * confidence_factor
    notes.append(f"Environmental: {env_reduction:.1%} risk reduction × ${env_total_exposure:,.0f} exposure")
    
    # Calculate health savings
    health_savings = health_reduction * costs.health_crisis_exposure * confidence_factor
    notes.append(f"Health: {health_reduction:.1%} risk reduction × ${costs.health_crisis_exposure:,.0f} exposure")
    
    # Calculate food security savings
    food_savings = food_reduction * costs.food_insecurity_exposure * confidence_factor
    notes.append(f"Food: {food_reduction:.1%} risk reduction × ${costs.food_insecurity_exposure:,.0f} exposure")
    
    # Total savings
    total_savings = environmental_savings + health_savings + food_savings
    
    # Net benefit & ROI
    net_benefit = total_savings - intervention_cost
    roi = (net_benefit / intervention_cost) if intervention_cost > 0 else 0
    
    # Payback period (assuming annualized savings)
    annual_savings = total_savings  # Assuming per-year figures
    payback_months = (intervention_cost / (annual_savings / 12)) if annual_savings > 0 else float('inf')
    
    # Determine recommendation
    if roi >= 2.0:
        recommendation = "STRONGLY RECOMMENDED - High ROI"
        recommendation_code = "strong_yes"
    elif roi >= 1.0:
        recommendation = "RECOMMENDED - Positive ROI"
        recommendation_code = "yes"
    elif roi >= 0.5:
        recommendation = "CONSIDER - Moderate ROI with non-financial benefits"
        recommendation_code = "consider"
    elif roi >= 0:
        recommendation = "MARGINAL - Limited financial return"
        recommendation_code = "marginal"
    else:
        recommendation = "NOT RECOMMENDED - Negative ROI"
        recommendation_code = "no"
    
    return {
        'intervention_cost': round(intervention_cost, 2),
        'environmental_savings': round(environmental_savings, 2),
        'health_savings': round(health_savings, 2),
        'food_savings': round(food_savings, 2),
        'total_savings': round(total_savings, 2),
        'net_benefit': round(net_benefit, 2),
        'roi': round(roi, 3),
        'roi_percent': round(roi * 100, 1),
        'payback_period_months': round(payback_months, 1) if payback_months != float('inf') else None,
        'recommendation': recommendation,
        'recommendation_code': recommendation_code,
        'risk_reduction': {
            'environmental': round(env_reduction, 4),
            'health': round(health_reduction, 4),
            'food_security': round(food_reduction, 4)
        },
        'assumptions_used': costs.to_dict(),
        'calculation_notes': notes,
        'confidence_weighted': confidence_weighted
    }


def calculate_policy_portfolio_roi(
    baseline_risk: Dict[str, Any],
    policies: list[Dict[str, Any]],
    cost_assumptions: Optional[CostAssumptions] = None
) -> Dict:
    """
    Calculate ROI for multiple policy options to enable comparison.
    
    Args:
        baseline_risk: Risk predictions before any intervention
        policies: List of policy dicts with 'name', 'intervention_risk', 'cost'
        cost_assumptions: Optional custom cost parameters
    
    Returns:
        Ranked list of policies by ROI with comparison metrics
    """
    costs = cost_assumptions or DEFAULT_COSTS
    results = []
    
    for policy in policies:
        roi_result = calculate_roi(
            baseline_risk=baseline_risk,
            intervention_risk=policy['intervention_risk'],
            intervention_cost=policy['cost'],
            cost_assumptions=costs
        )
        
        results.append({
            'policy_name': policy['name'],
            'cost': policy['cost'],
            'roi': roi_result['roi'],
            'net_benefit': roi_result['net_benefit'],
            'recommendation_code': roi_result['recommendation_code'],
            'details': roi_result
        })
    
    # Sort by ROI (highest first)
    results.sort(key=lambda x: x['roi'], reverse=True)
    
    # Add ranking
    for i, result in enumerate(results):
        result['rank'] = i + 1
    
    return {
        'baseline_risk': {
            'environmental': baseline_risk['environmental']['prob'],
            'health': baseline_risk['health']['prob'],
            'food_security': baseline_risk['food_security']['prob'],
            'resilience_score': baseline_risk['resilience_score']
        },
        'policies_evaluated': len(policies),
        'best_roi_policy': results[0]['policy_name'] if results else None,
        'ranked_policies': results
    }


def format_roi_report(roi_result: Dict) -> str:
    """
    Format ROI calculation as human-readable report.
    
    Args:
        roi_result: Output from calculate_roi()
    
    Returns:
        Formatted string report
    """
    lines = []
    lines.append("=" * 60)
    lines.append("ECONOMIC IMPACT & ROI ANALYSIS")
    lines.append("=" * 60)
    
    lines.append(f"\n💰 INTERVENTION COST")
    lines.append(f"   ${roi_result['intervention_cost']:,.0f}")
    
    lines.append(f"\n📈 PROJECTED SAVINGS")
    lines.append(f"   Environmental: ${roi_result['environmental_savings']:,.0f}")
    lines.append(f"   Health:        ${roi_result['health_savings']:,.0f}")
    lines.append(f"   Food Security: ${roi_result['food_savings']:,.0f}")
    lines.append(f"   ─────────────────────────")
    lines.append(f"   TOTAL:         ${roi_result['total_savings']:,.0f}")
    
    lines.append(f"\n📊 FINANCIAL METRICS")
    lines.append(f"   Net Benefit:     ${roi_result['net_benefit']:,.0f}")
    lines.append(f"   ROI:             {roi_result['roi_percent']:.1f}%")
    if roi_result['payback_period_months']:
        lines.append(f"   Payback Period:  {roi_result['payback_period_months']:.1f} months")
    
    lines.append(f"\n🎯 RECOMMENDATION")
    lines.append(f"   {roi_result['recommendation']}")
    
    if roi_result['calculation_notes']:
        lines.append(f"\n📝 CALCULATION NOTES")
        for note in roi_result['calculation_notes']:
            lines.append(f"   • {note}")
    
    lines.append("\n" + "=" * 60)
    
    return "\n".join(lines)
