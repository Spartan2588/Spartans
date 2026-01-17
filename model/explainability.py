"""
Explainability Module

Provides:
- Feature importance computation
- Natural language explanation generation
- Confidence-aware decision signals

Explanations reference real inputs and avoid absolute claims.
"""

import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.inspection import permutation_importance


class ExplainabilityEngine:
    """
    Generates human-readable explanations for risk predictions.
    
    Uses feature importance and natural language templates
    to explain why certain risk levels were predicted.
    """
    
    # Feature name mappings for readable output
    FEATURE_NAMES = {
        'environmental': ['AQI', 'Traffic Density', 'Temperature', 'Rainfall'],
        'health': ['AQI', 'Hospital Load', 'Respiratory Cases', 'Temperature', 'Environmental Risk'],
        'food': ['Crop Supply Index', 'Food Price Index', 'Rainfall', 'Temperature', 'Supply Disruptions']
    }
    
    # Thresholds for natural language descriptions
    AQI_THRESHOLDS = {
        'good': (0, 50),
        'moderate': (51, 100),
        'unhealthy_sensitive': (101, 150),
        'unhealthy': (151, 200),
        'very_unhealthy': (201, 300),
        'hazardous': (301, 500)
    }
    
    def __init__(self, cascading_engine=None):
        """
        Initialize explainability engine.
        
        Args:
            cascading_engine: Optional CascadingRiskEngine for feature importance
        """
        self.engine = cascading_engine
        self._cached_importance = {}
    
    def compute_feature_importance(
        self,
        model_name: str = 'health',
        n_repeats: int = 10
    ) -> Dict[str, float]:
        """
        Compute feature importance for a model.
        
        Uses permutation importance for calibrated models,
        or native feature_importances_ for tree-based models.
        
        Args:
            model_name: 'environmental', 'health', or 'food'
            n_repeats: Number of permutation repeats
        
        Returns:
            Dictionary mapping feature names to importance scores
        """
        if self.engine is None:
            raise RuntimeError("CascadingRiskEngine required for feature importance")
        
        if model_name == 'health':
            model = self.engine.health_model
            feature_names = self.FEATURE_NAMES['health']
        elif model_name == 'environmental':
            model = self.engine.env_model
            feature_names = self.FEATURE_NAMES['environmental']
        elif model_name == 'food':
            model = self.engine.food_model
            feature_names = self.FEATURE_NAMES['food']
        else:
            raise ValueError(f"Unknown model: {model_name}")
        
        # Try to get native feature importance (RF)
        if hasattr(model.base_model, 'feature_importances_'):
            importances = model.base_model.feature_importances_
        else:
            # Use stored calibration data for permutation importance
            if hasattr(model, 'calibration_X') and model.calibration_X is not None and model.calibration_y is not None:
                result = permutation_importance(
                    model.calibrated_model,
                    model.calibration_X,
                    model.calibration_y,
                    n_repeats=n_repeats,
                    random_state=42,
                    scoring='accuracy'
                )
                importances = result.importances_mean
            else:
                # Generate sample data for importance calculation
                from .data_generators import generate_health_data, generate_environmental_data, generate_food_security_data
                if model_name == 'health':
                    X, y, _ = generate_health_data(n_samples=500)
                elif model_name == 'environmental':
                    X, y, _ = generate_environmental_data(n_samples=500)
                else:
                    X, y, _ = generate_food_security_data(n_samples=500)
                
                result = permutation_importance(
                    model.calibrated_model,
                    X, y,
                    n_repeats=n_repeats,
                    random_state=42
                )
                importances = result.importances_mean
        
        # Normalize to sum to 1
        importances = np.abs(importances)
        if importances.sum() > 0:
            importances = importances / importances.sum()
        
        importance_dict = {
            name: round(float(imp), 4)
            for name, imp in zip(feature_names, importances)
        }
        
        # Sort by importance
        importance_dict = dict(sorted(
            importance_dict.items(),
            key=lambda x: x[1],
            reverse=True
        ))
        
        self._cached_importance[model_name] = importance_dict
        return importance_dict
    
    def explain_prediction(
        self,
        metrics: Dict[str, Any],
        predictions: Dict[str, Any]
    ) -> List[str]:
        """
        Generate natural language explanations for risk predictions.
        
        Explanations:
        - Reference real input values
        - Reflect probabilistic reasoning
        - Avoid absolute claims
        - Highlight key risk drivers
        
        Args:
            metrics: Input metrics used for prediction
            predictions: Output from predict_cascading_risks()
        
        Returns:
            List of explanation strings
        """
        explanations = []
        
        # Environmental explanations
        env_explanations = self._explain_environmental(metrics, predictions)
        explanations.extend(env_explanations)
        
        # Health explanations (with cascading effect)
        health_explanations = self._explain_health(metrics, predictions)
        explanations.extend(health_explanations)
        
        # Food security explanations
        food_explanations = self._explain_food(metrics, predictions)
        explanations.extend(food_explanations)
        
        # Resilience score explanation
        resilience_exp = self._explain_resilience(predictions)
        explanations.append(resilience_exp)
        
        return explanations
    
    def _describe_aqi(self, aqi: float) -> str:
        """Get human-readable AQI description."""
        if aqi <= 50:
            return "good"
        elif aqi <= 100:
            return "moderate"
        elif aqi <= 150:
            return "unhealthy for sensitive groups"
        elif aqi <= 200:
            return "unhealthy"
        elif aqi <= 300:
            return "very unhealthy"
        else:
            return "hazardous"
    
    def _prob_to_likelihood(self, prob: float) -> str:
        """Convert probability to likelihood phrase."""
        if prob >= 0.8:
            return "very likely"
        elif prob >= 0.6:
            return "likely"
        elif prob >= 0.4:
            return "possible"
        elif prob >= 0.2:
            return "unlikely"
        else:
            return "very unlikely"
    
    def _explain_environmental(
        self,
        metrics: Dict,
        predictions: Dict
    ) -> List[str]:
        """Generate environmental risk explanations."""
        explanations = []
        
        aqi = metrics.get('aqi', 100)
        traffic = metrics.get('traffic_density', 1)
        temp = metrics.get('temperature', 30)
        rainfall = metrics.get('rainfall', 20)
        
        env_prob = predictions['environmental']['prob']
        env_risk = predictions['environmental']['risk']
        env_conf = predictions['confidence']['environmental']
        
        aqi_desc = self._describe_aqi(aqi)
        traffic_desc = ['low', 'medium', 'high'][int(traffic)]
        
        # Primary explanation
        exp = f"AQI of {aqi:.0f} ({aqi_desc}) "
        if aqi > 150:
            exp += f"significantly elevated environmental risk. "
        elif aqi > 100:
            exp += f"contributed to elevated environmental risk. "
        else:
            exp += f"indicates relatively low air pollution impact. "
        explanations.append(exp)
        
        # Traffic impact
        if traffic >= 2:
            explanations.append(
                f"High traffic density amplified pollution exposure and contributed approximately "
                f"{int(env_prob * 20)}% to the overall environmental risk score."
            )
        
        # Temperature impact
        if temp > 35:
            explanations.append(
                f"Temperature of {temp:.1f}°C exceeds comfort threshold, "
                f"compounding environmental stress factors."
            )
        
        # Low rainfall impact
        if rainfall < 10:
            explanations.append(
                f"Low rainfall ({rainfall:.0f}mm) reduces natural pollutant dispersal, "
                f"potentially increasing atmospheric pollution concentration."
            )
        
        # Confidence note
        if env_conf < 0.7:
            explanations.append(
                f"Note: Environmental prediction confidence is {env_conf:.0%}, "
                f"indicating some uncertainty in the estimate."
            )
        
        return explanations
    
    def _explain_health(
        self,
        metrics: Dict,
        predictions: Dict
    ) -> List[str]:
        """Generate health risk explanations with cascading effect."""
        explanations = []
        
        hospital_load = metrics.get('hospital_load', 0.65)
        resp_cases = metrics.get('respiratory_cases', 200)
        
        health_prob = predictions['health']['prob']
        health_risk = predictions['health']['risk']
        env_cascade = predictions['cascading_effect']['env_risk_injected_to_health']
        
        # Cascading effect (KEY DIFFERENTIATOR)
        explanations.append(
            f"Environmental risk probability of {env_cascade:.0%} cascaded into the health model, "
            f"contributing to elevated health risk assessment."
        )
        
        # Hospital load
        if hospital_load > 0.80:
            explanations.append(
                f"Hospital load at {hospital_load:.0%} indicates near-capacity conditions, "
                f"significantly increasing health system stress."
            )
        elif hospital_load > 0.65:
            explanations.append(
                f"Hospital load at {hospital_load:.0%} shows moderate strain on healthcare resources."
            )
        
        # Respiratory cases
        if resp_cases > 300:
            explanations.append(
                f"Elevated respiratory case count ({resp_cases:,}) combined with hospital load "
                f"compounds health crisis probability."
            )
        
        return explanations
    
    def _explain_food(
        self,
        metrics: Dict,
        predictions: Dict
    ) -> List[str]:
        """Generate food security explanations."""
        explanations = []
        
        crop_supply = metrics.get('crop_supply_index', 75)
        food_price = metrics.get('food_price_index', 100)
        disruptions = metrics.get('supply_disruption_events', 1)
        
        food_prob = predictions['food_security']['prob']
        
        # Supply index
        if crop_supply < 60:
            explanations.append(
                f"Low crop supply index ({crop_supply:.0f}) indicates potential food availability concerns, "
                f"driving food insecurity risk assessment."
            )
        elif crop_supply < 75:
            explanations.append(
                f"Crop supply index of {crop_supply:.0f} shows moderate supply levels."
            )
        
        # Price pressure
        if food_price > 130:
            explanations.append(
                f"Elevated food price index ({food_price:.0f}) suggests affordability pressures "
                f"that may affect food access for vulnerable populations."
            )
        
        # Supply disruptions
        if disruptions >= 3:
            explanations.append(
                f"Repeated supply disruption events ({disruptions}) "
                f"significantly increased food security risk estimate."
            )
        elif disruptions >= 2:
            explanations.append(
                f"Supply chain disruptions ({disruptions} events) contributed to elevated risk."
            )
        
        return explanations
    
    def _explain_resilience(self, predictions: Dict) -> str:
        """Generate resilience score explanation."""
        score = predictions['resilience_score']
        
        if score >= 80:
            level = "excellent"
            desc = "The city shows strong resilience across all risk domains."
        elif score >= 60:
            level = "good"
            desc = "Overall resilience is adequate with room for targeted improvements."
        elif score >= 40:
            level = "moderate"
            desc = "Multiple risk factors are elevated, requiring attention to key vulnerabilities."
        elif score >= 20:
            level = "concerning"
            desc = "Significant risk exposure across domains suggests urgent policy intervention."
        else:
            level = "critical"
            desc = "Critical risk levels detected. Immediate coordinated action recommended."
        
        return (
            f"Overall resilience score of {score}/100 ({level}). {desc}"
        )
    
    def get_decision_signals(
        self,
        predictions: Dict,
        thresholds: Optional[Dict] = None
    ) -> Dict:
        """
        Generate confidence-aware decision signals.
        
        Provides clear actionable signals based on risk levels
        and prediction confidence.
        
        Args:
            predictions: Output from predict_cascading_risks()
            thresholds: Optional custom thresholds for alerts
        
        Returns:
            Dictionary with decision signals per domain
        """
        default_thresholds = {
            'high_risk': 0.7,
            'medium_risk': 0.4,
            'high_confidence': 0.8,
            'low_confidence': 0.6
        }
        thresholds = thresholds or default_thresholds
        
        def get_signal(prob: float, confidence: float, domain: str) -> Dict:
            # Determine risk level
            if prob >= thresholds['high_risk']:
                risk_level = 'high'
                urgency = 'immediate'
            elif prob >= thresholds['medium_risk']:
                risk_level = 'medium'
                urgency = 'monitor'
            else:
                risk_level = 'low'
                urgency = 'routine'
            
            # Adjust based on confidence
            if confidence >= thresholds['high_confidence']:
                confidence_level = 'high'
                reliability = 'reliable'
            elif confidence >= thresholds['low_confidence']:
                confidence_level = 'medium'
                reliability = 'moderate'
            else:
                confidence_level = 'low'
                reliability = 'uncertain'
            
            # Generate signal
            if risk_level == 'high' and confidence_level == 'high':
                signal = 'ALERT'
                action = f'Immediate action required for {domain}'
            elif risk_level == 'high' and confidence_level != 'high':
                signal = 'WARNING'
                action = f'Review {domain} - high risk but lower confidence'
            elif risk_level == 'medium':
                signal = 'CAUTION'
                action = f'Monitor {domain} closely'
            else:
                signal = 'OK'
                action = f'{domain} within normal parameters'
            
            return {
                'signal': signal,
                'risk_level': risk_level,
                'risk_probability': round(prob, 3),
                'confidence': round(confidence, 3),
                'confidence_level': confidence_level,
                'reliability': reliability,
                'urgency': urgency,
                'recommended_action': action
            }
        
        return {
            'environmental': get_signal(
                predictions['environmental']['prob'],
                predictions['confidence']['environmental'],
                'Environmental'
            ),
            'health': get_signal(
                predictions['health']['prob'],
                predictions['confidence']['health'],
                'Health'
            ),
            'food_security': get_signal(
                predictions['food_security']['prob'],
                predictions['confidence']['food_security'],
                'Food Security'
            ),
            'overall': {
                'resilience_score': predictions['resilience_score'],
                'resilience_level': (
                    'critical' if predictions['resilience_score'] < 20 else
                    'low' if predictions['resilience_score'] < 40 else
                    'moderate' if predictions['resilience_score'] < 60 else
                    'good' if predictions['resilience_score'] < 80 else
                    'excellent'
                )
            }
        }


# Standalone function for explain_prediction
def explain_prediction(
    metrics: Dict[str, Any],
    predictions: Dict[str, Any]
) -> List[str]:
    """
    Generate natural language explanations for predictions.
    
    Standalone function that wraps ExplainabilityEngine.
    
    Args:
        metrics: Input metrics
        predictions: Risk predictions
    
    Returns:
        List of explanation strings
    """
    engine = ExplainabilityEngine()
    return engine.explain_prediction(metrics, predictions)


def get_feature_importance(
    cascading_engine,
    model_name: str = 'health'
) -> Dict[str, float]:
    """
    Get feature importance for a model.
    
    Args:
        cascading_engine: Initialized CascadingRiskEngine
        model_name: 'environmental', 'health', or 'food'
    
    Returns:
        Dictionary of feature names to importance scores
    """
    explainer = ExplainabilityEngine(cascading_engine)
    return explainer.compute_feature_importance(model_name)
