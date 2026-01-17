"""
Scenario simulation logic for what-if analysis.
"""

from typing import Dict, Optional
from . import risk_assessment


def simulate_scenario(
    baseline_state: Dict,
    modifications: Dict,
    baseline_risks: Dict
) -> Dict:
    """
    Simulate scenario by applying modifications and recalculating risks.

    Args:
        baseline_state: Original current state
        modifications: Changes to apply (aqi, traffic_volume, etc.)
        baseline_risks: Baseline risk assessment

    Returns:
        Scenario simulation results
    """
    # Create intervention state by applying modifications
    intervention_state = baseline_state.copy()

    # Apply modifications
    if 'aqi' in modifications and modifications['aqi'] is not None:
        # Update AQI and calculate severity score
        intervention_state['aqi'] = modifications['aqi']
        # Approximate severity score from AQI
        # US AQI categories: Good (0-50), Moderate (51-100), etc.
        aqi = modifications['aqi']
        if aqi <= 50:
            intervention_state['aqi_severity_score'] = (aqi / 50.0) * 25
        elif aqi <= 100:
            intervention_state['aqi_severity_score'] = 25 + ((aqi - 50) / 50.0) * 25
        elif aqi <= 150:
            intervention_state['aqi_severity_score'] = 50 + ((aqi - 100) / 50.0) * 20
        elif aqi <= 200:
            intervention_state['aqi_severity_score'] = 70 + ((aqi - 150) / 50.0) * 15
        else:
            intervention_state['aqi_severity_score'] = min(85 + ((aqi - 200) / 100.0) * 15, 100)

    if 'traffic_volume' in modifications and modifications['traffic_volume'] is not None:
        # Update traffic volume and recalculate congestion index
        intervention_state['traffic_volume'] = modifications['traffic_volume']
        # Simple congestion index calculation (normalize to 0-100)
        # Assuming typical range: 0-2000 vehicles/hour
        traffic = modifications['traffic_volume']
        intervention_state['traffic_congestion_index'] = min((traffic / 2000.0) * 100, 100)

        # Update congestion level
        if intervention_state['traffic_congestion_index'] < 33:
            intervention_state['congestion_level'] = 'low'
        elif intervention_state['traffic_congestion_index'] < 67:
            intervention_state['congestion_level'] = 'medium'
        else:
            intervention_state['congestion_level'] = 'high'

    if 'crop_supply_index' in modifications and modifications['crop_supply_index'] is not None:
        # Supply index affects price volatility inversely
        # Higher supply = lower volatility
        supply = modifications['crop_supply_index']
        # Estimate volatility reduction: supply 0-100, volatility typically 0-0.5
        base_volatility = intervention_state.get('avg_food_price_volatility', 0.3)
        # Inverse relationship: high supply (100) -> low volatility (0.1)
        intervention_state['avg_food_price_volatility'] = 0.1 + ((100 - supply) / 100.0) * (base_volatility - 0.1)

    if 'respiratory_cases' in modifications and modifications['respiratory_cases'] is not None:
        intervention_state['respiratory_cases'] = modifications['respiratory_cases']
        # Estimate respiratory risk index (normalize to 0-100)
        cases = modifications['respiratory_cases']
        intervention_state['respiratory_risk_index'] = min((cases / 1000.0) * 100, 100)

    # Recalculate risks with intervention state
    intervention_risks = risk_assessment.compute_risk_assessment(intervention_state)

    # Calculate improvements
    improvements = {}

    env_improvement = (
        (baseline_risks['environmental_prob'] - intervention_risks['environmental_prob']) /
        baseline_risks['environmental_prob'] * 100
    ) if baseline_risks['environmental_prob'] > 0 else 0

    health_improvement = (
        (baseline_risks['health_prob'] - intervention_risks['health_prob']) /
        baseline_risks['health_prob'] * 100
    ) if baseline_risks['health_prob'] > 0 else 0

    food_improvement = (
        (baseline_risks['food_security_prob'] - intervention_risks['food_security_prob']) /
        baseline_risks['food_security_prob'] * 100
    ) if baseline_risks['food_security_prob'] > 0 else 0

    improvements = {
        'environmental': round(env_improvement, 2),
        'health': round(health_improvement, 2),
        'food_security': round(food_improvement, 2)
    }

    # Calculate overall improvement (weighted average)
    overall_improvement = (
        env_improvement * 0.4 +  # Environmental weight: 40%
        health_improvement * 0.4 +  # Health weight: 40%
        food_improvement * 0.2  # Food security weight: 20%
    )

    # Estimate economic impact (rough calculation)
    # Base assumption: Each 1% improvement in overall risk = X currency units saved
    # This is a placeholder - actual calculation would require domain expertise
    economic_impact = None
    roi_estimate = None

    if overall_improvement > 0:
        # Simplified model: improvements translate to economic benefits
        # Assuming base economic value of $10,000 per 1% overall improvement
        economic_impact = overall_improvement * 10000

        # ROI: Assuming intervention cost is 30% of benefits (rough estimate)
        intervention_cost = economic_impact * 0.3
        roi_estimate = ((economic_impact - intervention_cost) / intervention_cost) * 100

    return {
        'city': baseline_state.get('city', 'unknown'),
        'baseline_risks': baseline_risks,
        'intervention_risks': intervention_risks,
        'improvements': improvements,
        'overall_improvement': round(overall_improvement, 2),
        'economic_impact_estimate': round(economic_impact, 2) if economic_impact else None,
        'roi_estimate': round(roi_estimate, 2) if roi_estimate else None,
        'interventions_applied': modifications
    }
