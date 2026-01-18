"""
Risk assessment logic for environmental, health, and food security risks.
"""

from typing import Dict, List, Optional
import math


def assess_environmental_risk(aqi: float, aqi_severity_score: float, 
                             pm25: float, traffic_congestion: float) -> Dict[str, any]:
    """
    Assess environmental risk based on AQI, pollution, and traffic.

    Returns: {'risk_level': str, 'probability': float, 'explanations': List[str]}
    """
    explanations = []
    risk_score = 0.0

    # AQI contribution (0-40% of risk)
    if aqi_severity_score is not None:
        aqi_contrib = min(aqi_severity_score / 100.0, 1.0) * 0.4
        risk_score += aqi_contrib

        if aqi_severity_score > 75:
            explanations.append(f"Very High AQI Severity Score ({aqi_severity_score:.1f})")
        elif aqi_severity_score > 50:
            explanations.append(f"High AQI Severity Score ({aqi_severity_score:.1f})")

    # PM2.5 contribution (0-30% of risk)
    if pm25 is not None:
        # WHO guideline: 35 μg/m³ is moderate, 75+ is unhealthy
        pm25_normalized = min(pm25 / 150.0, 1.0)  # Normalize to 150 μg/m³ as max
        risk_score += pm25_normalized * 0.3

        if pm25 > 75:
            explanations.append(f"Unhealthy PM2.5 levels ({pm25:.1f} μg/m³)")
        elif pm25 > 35:
            explanations.append(f"Elevated PM2.5 levels ({pm25:.1f} μg/m³)")

    # Traffic congestion contribution (0-30% of risk)
    if traffic_congestion is not None:
        congestion_contrib = (traffic_congestion / 100.0) * 0.3
        risk_score += congestion_contrib

        if traffic_congestion > 70:
            explanations.append(f"High traffic congestion ({traffic_congestion:.1f}%)")

    # Determine risk level
    if risk_score >= 0.75:
        risk_level = "critical"
    elif risk_score >= 0.55:
        risk_level = "high"
    elif risk_score >= 0.35:
        risk_level = "medium"
    else:
        risk_level = "low"

    # Cap probability at 0.95
    probability = min(risk_score, 0.95)

    if not explanations:
        explanations.append("Environmental conditions within acceptable ranges")

    return {
        'risk_level': risk_level,
        'probability': probability,
        'explanations': explanations
    }


def assess_health_risk(respiratory_risk_index: float, hospital_load: float,
                      aqi_severity: float, respiratory_cases: int) -> Dict[str, any]:
    """
    Assess health risk based on respiratory cases, hospital load, and AQI.

    Returns: {'risk_level': str, 'probability': float, 'explanations': List[str]}
    """
    explanations = []
    risk_score = 0.0

    # Respiratory risk index contribution (0-40% of risk)
    if respiratory_risk_index is not None:
        resp_contrib = (respiratory_risk_index / 100.0) * 0.4
        risk_score += resp_contrib

        if respiratory_risk_index > 70:
            explanations.append(f"High respiratory risk index ({respiratory_risk_index:.1f})")
        elif respiratory_risk_index > 50:
            explanations.append(f"Elevated respiratory risk ({respiratory_risk_index:.1f})")

    # Hospital load contribution (0-35% of risk)
    if hospital_load is not None:
        # hospital_load is 0-1 (bed occupancy pressure)
        risk_score += hospital_load * 0.35

        if hospital_load > 0.85:
            explanations.append(f"Critical hospital bed occupancy ({hospital_load*100:.1f}%)")
        elif hospital_load > 0.70:
            explanations.append(f"High hospital bed occupancy ({hospital_load*100:.1f}%)")

    # AQI contribution (0-25% of risk) - air quality affects respiratory health
    if aqi_severity is not None:
        aqi_contrib = (aqi_severity / 100.0) * 0.25
        risk_score += aqi_contrib

        if aqi_severity > 60:
            explanations.append(f"Poor air quality affecting respiratory health")

    # Respiratory cases contribution (threshold-based)
    if respiratory_cases is not None and respiratory_cases > 100:
        case_contrib = min(respiratory_cases / 1000.0, 0.2)  # Cap at 1000 cases
        risk_score += case_contrib

        if respiratory_cases > 500:
            explanations.append(f"High number of respiratory cases ({respiratory_cases})")

    # Determine risk level
    if risk_score >= 0.75:
        risk_level = "critical"
    elif risk_score >= 0.55:
        risk_level = "high"
    elif risk_score >= 0.35:
        risk_level = "medium"
    else:
        risk_level = "low"

    probability = min(risk_score, 0.95)

    if not explanations:
        explanations.append("Health indicators within normal ranges")

    return {
        'risk_level': risk_level,
        'probability': probability,
        'explanations': explanations
    }


def assess_food_security_risk(price_volatility: float, supply_index: Optional[float] = None) -> Dict[str, any]:
    """
    Assess food security risk based on price volatility and supply.

    Returns: {'risk_level': str, 'probability': float, 'explanations': List[str]}
    """
    explanations = []
    risk_score = 0.0

    # Price volatility contribution (0-70% of risk)
    if price_volatility is not None:
        # High volatility indicates supply/demand instability
        # Normalize: volatility > 0.5 is high risk
        vol_contrib = min(price_volatility / 0.8, 1.0) * 0.7
        risk_score += vol_contrib

        if price_volatility > 0.4:
            explanations.append(f"Very high agricultural price volatility ({price_volatility:.2f})")
        elif price_volatility > 0.25:
            explanations.append(f"Elevated price volatility ({price_volatility:.2f})")

    # Supply index contribution (0-30% of risk) - inverse relationship
    if supply_index is not None:
        # Lower supply index = higher risk
        supply_contrib = ((100 - supply_index) / 100.0) * 0.3
        risk_score += supply_contrib

        if supply_index < 40:
            explanations.append(f"Low crop supply index ({supply_index:.1f})")
        elif supply_index < 60:
            explanations.append(f"Moderate supply levels ({supply_index:.1f})")

    # Determine risk level
    if risk_score >= 0.70:
        risk_level = "high"
    elif risk_score >= 0.45:
        risk_level = "medium"
    elif risk_score >= 0.25:
        risk_level = "low"
    else:
        risk_level = "low"

    probability = min(risk_score, 0.85)  # Food security typically lower max probability

    if not explanations:
        explanations.append("Food prices and supply stable")

    return {
        'risk_level': risk_level,
        'probability': probability,
        'explanations': explanations
    }


def calculate_resilience_score(env_prob: float, health_prob: float, food_prob: float, confidence: float = 0.5) -> float:
    """
    Calculate overall resilience score with weighted risk components and uncertainty penalty.
    Formula: 1.0 - (w_env*P_env + w_health*P_health + w_food*P_food + w_unc*(1-confidence))
    """
    # Weights for risk components
    w_env = 0.35
    w_health = 0.45
    w_food = 0.20
    
    # Weight for uncertainty penalty
    w_uncertainty = 0.10

    # Calculate weighted risk
    risk_component = (w_env * env_prob) + (w_health * health_prob) + (w_food * food_prob)
    
    # Calculate uncertainty penalty (lower confidence = higher penalty)
    uncertainty_penalty = w_uncertainty * (1.0 - confidence)
    
    # Resilience is inverse of total negative factors
    resilience = 1.0 - (risk_component + uncertainty_penalty)
    
    return max(0.0, min(1.0, resilience))  # Clamp to [0, 1]


def compute_risk_assessment(current_state: Dict) -> Dict:
    """
    Compute comprehensive risk assessment from current state.

    Returns: RiskAssessmentResponse dict
    """
    # Extract values with defaults
    aqi = current_state.get('aqi')
    aqi_severity = current_state.get('aqi_severity_score')
    pm25 = current_state.get('pm25')
    traffic_congestion = current_state.get('traffic_congestion_index')
    respiratory_risk = current_state.get('respiratory_risk_index')
    hospital_load = current_state.get('hospital_load')
    respiratory_cases = current_state.get('respiratory_cases')
    price_volatility = current_state.get('avg_food_price_volatility')
    
    # Extract confidence (default to 0.5 if missing)
    confidence = current_state.get('confidence', 0.5)

    # Assess each risk category
    env_assessment = assess_environmental_risk(
        aqi or 0, aqi_severity or 0, pm25 or 0, traffic_congestion or 0
    )

    health_assessment = assess_health_risk(
        respiratory_risk or 0, hospital_load or 0,
        aqi_severity or 0, respiratory_cases or 0
    )

    food_assessment = assess_food_security_risk(price_volatility or 0, current_state.get('crop_supply'))

    # Calculate resilience with confidence
    resilience = calculate_resilience_score(
        env_assessment['probability'],
        health_assessment['probability'],
        food_assessment['probability'],
        confidence
    )

    # Combine all explanations
    all_explanations = (
        env_assessment['explanations'] +
        health_assessment['explanations'] +
        food_assessment['explanations']
    )
    
    # Add resilience explanation
    resilience_exp = []
    if resilience < 0.4:
        resilience_exp.append("Critical resilience - immediate intervention needed")
    elif resilience < 0.6:
        resilience_exp.append("Moderate resilience - monitoring required")
        
    if confidence < 0.5:
        resilience_exp.append("Score precision reduced by low data confidence")
        
    final_explanations = resilience_exp + all_explanations

    return {
        'environmental_risk': env_assessment['risk_level'],
        'environmental_prob': env_assessment['probability'],
        'health_risk': health_assessment['risk_level'],
        'health_prob': health_assessment['probability'],
        'food_security_risk': food_assessment['risk_level'],
        'food_security_prob': food_assessment['probability'],
        'resilience_score': resilience,
        'causal_explanations': final_explanations[:5],  # Limit to top 5
        'city': current_state.get('city', 'Mumbai'),
        'timestamp': current_state.get('timestamp')
    }
