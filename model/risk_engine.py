"""
Multi-Domain Risk Engine - Phase 1

Main entry point for the risk prediction system.
Initializes and trains all three models with probability calibration.

Phase 1 Features:
- Three trained risk models (Environmental, Health, Food Security)
- Calibrated probability outputs
- Policy intervention simulation hooks
- Clear separation of concerns

Phase 2 will add:
- Cascading risk predictions
- Resilience score calculation
- Scenario comparison
"""

from typing import Dict, Optional
import numpy as np

from .models import (
    EnvironmentalRiskModel,
    HealthRiskModel,
    FoodSecurityRiskModel
)


class RiskEngine:
    """
    Multi-Domain Risk Prediction Engine
    
    This is the main class for the ML system. It manages three calibrated
    risk prediction models and provides a unified interface.
    
    Usage:
        engine = RiskEngine()  # Auto-trains all models
        
        # Individual predictions
        env_result = engine.predict_environmental(features)
        health_result = engine.predict_health(features)
        food_result = engine.predict_food_security(features)
        
        # Policy simulation
        policy_impact = engine.env_model.simulate_traffic_reduction(X, 0.3)
    """
    
    def __init__(self, auto_train: bool = True):
        """
        Initialize Risk Engine.
        
        Args:
            auto_train: If True, automatically trains all models on initialization
        """
        # Initialize models
        self.env_model = EnvironmentalRiskModel()
        self.health_model = HealthRiskModel()
        self.food_model = FoodSecurityRiskModel()
        
        # Track training state
        self._is_trained = False
        
        if auto_train:
            self.train_all()
    
    def train_all(self):
        """Train all three models with synthetic data."""
        print("Training Environmental Risk Model...")
        self.env_model.train()
        
        print("Training Health Risk Model...")
        self.health_model.train()
        
        print("Training Food Security Risk Model...")
        self.food_model.train()
        
        self._is_trained = True
        print("All models trained successfully!")
    
    def predict_environmental(
        self,
        aqi: float,
        traffic_density: int,
        temperature: float,
        rainfall: float
    ) -> Dict:
        """
        Predict environmental risk.
        
        Args:
            aqi: Air Quality Index (0-500)
            traffic_density: 0=low, 1=medium, 2=high
            temperature: Temperature in Celsius
            rainfall: Rainfall in mm
        
        Returns:
            Prediction with class, probabilities, confidence
        """
        X = np.array([[aqi, traffic_density, temperature, rainfall]])
        
        # Threshold Override: Force high risk for extreme API values (ML extrapolation fix)
        if aqi > 300:
             return {
                 'risk_class': 'high',
                 'probabilities': {'low': 0.02, 'medium': 0.08, 'high': 0.90},
                 'confidence': 0.99
             }
             
        result = self.env_model.predict_with_proba(X)
        
        # Convert to single-sample format
        return {
            'risk_class': result['class'][0],
            'probabilities': {
                'low': float(result['probabilities']['low'][0]),
                'medium': float(result['probabilities']['medium'][0]),
                'high': float(result['probabilities']['high'][0])
            },
            'confidence': float(result['confidence'][0])
        }
    
    def predict_health(
        self,
        aqi: float,
        hospital_load: float,
        respiratory_cases: int,
        temperature: float,
        environmental_risk_prob: float
    ) -> Dict:
        """
        Predict health risk with cascading environmental input.
        
        Args:
            aqi: Air Quality Index
            hospital_load: Hospital utilization (0.4-0.95)
            respiratory_cases: Daily respiratory case count
            temperature: Temperature in Celsius
            environmental_risk_prob: Probability from environmental model
        
        Returns:
            Prediction with class, probabilities, confidence
        """
        X = np.array([[
            aqi, hospital_load, respiratory_cases, temperature, environmental_risk_prob
        ]])
        result = self.health_model.predict_with_proba(X)
        
        return {
            'risk_class': result['class'][0],
            'probabilities': {
                'low': float(result['probabilities']['low'][0]),
                'medium': float(result['probabilities']['medium'][0]),
                'high': float(result['probabilities']['high'][0])
            },
            'confidence': float(result['confidence'][0])
        }
    
    def predict_food_security(
        self,
        crop_supply_index: float,
        food_price_index: float,
        rainfall: float,
        temperature: float,
        supply_disruption_events: int
    ) -> Dict:
        """
        Predict food security risk.
        
        Args:
            crop_supply_index: Crop availability (40-100)
            food_price_index: Food price index (80-150)
            rainfall: Rainfall in mm
            temperature: Temperature in Celsius
            supply_disruption_events: Number of disruption events
        
        Returns:
            Prediction with class, probabilities, confidence
        """
        X = np.array([[
            crop_supply_index, food_price_index, rainfall, temperature, supply_disruption_events
        ]])
        
        # Threshold Override: Force high risk for starvation levels
        if crop_supply_index < 30:
             return {
                 'risk_class': 'high',
                 'probabilities': {'low': 0.01, 'medium': 0.04, 'high': 0.95},
                 'confidence': 0.99
             }
             
        result = self.food_model.predict_with_proba(X)
        
        return {
            'risk_class': result['class'][0],
            'probabilities': {
                'low': float(result['probabilities']['low'][0]),
                'medium': float(result['probabilities']['medium'][0]),
                'high': float(result['probabilities']['high'][0])
            },
            'confidence': float(result['confidence'][0])
        }
    
    def get_health_feature_importance(self) -> Dict:
        """Get feature importance from health model's RandomForest."""
        return self.health_model.get_feature_importance()
    
    @property
    def is_trained(self) -> bool:
        """Check if all models are trained."""
        return self._is_trained
    
    def demo(self) -> str:
        """
        Run a demonstration of all three models.
        
        Returns:
            String with demonstration output
        """
        if not self._is_trained:
            self.train_all()
        
        output = []
        output.append("=" * 60)
        output.append("MULTI-DOMAIN RISK ENGINE DEMONSTRATION")
        output.append("=" * 60)
        
        # Demo 1: Environmental Risk
        output.append("\n📊 ENVIRONMENTAL RISK PREDICTION")
        output.append("-" * 40)
        
        env_result = self.predict_environmental(
            aqi=180,
            traffic_density=2,
            temperature=35,
            rainfall=5
        )
        output.append(f"Input: AQI=180, Traffic=HIGH, Temp=35°C, Rain=5mm")
        output.append(f"Risk Class: {env_result['risk_class'].upper()}")
        output.append(f"Probabilities:")
        output.append(f"  Low:    {env_result['probabilities']['low']:.2%}")
        output.append(f"  Medium: {env_result['probabilities']['medium']:.2%}")
        output.append(f"  High:   {env_result['probabilities']['high']:.2%}")
        output.append(f"Confidence: {env_result['confidence']:.2%}")
        
        # Demo 2: Policy Simulation
        output.append("\n🚦 POLICY SIMULATION: 40% Traffic Reduction")
        output.append("-" * 40)
        
        baseline_features = np.array([[180, 2, 35, 5]])
        policy_result = self.env_model.simulate_traffic_reduction(baseline_features, 0.4)
        
        output.append(f"Baseline High-Risk Prob: {policy_result['baseline']['probabilities']['high'][0]:.2%}")
        output.append(f"After Policy High-Risk:  {policy_result['intervention']['probabilities']['high'][0]:.2%}")
        output.append(f"Risk Reduction:          {policy_result['risk_reduction'][0]:.2%}")
        
        # Demo 3: Health Risk with Cascading
        output.append("\n🏥 HEALTH RISK PREDICTION (Cascading)")
        output.append("-" * 40)
        
        # Get environmental risk probability to cascade
        env_high_prob = env_result['probabilities']['high']
        
        health_result = self.predict_health(
            aqi=180,
            hospital_load=0.78,
            respiratory_cases=280,
            temperature=35,
            environmental_risk_prob=env_high_prob
        )
        output.append(f"Input: AQI=180, Hospital=78%, Cases=280, Env Risk Prob={env_high_prob:.2f}")
        output.append(f"Risk Class: {health_result['risk_class'].upper()}")
        output.append(f"Probabilities:")
        output.append(f"  Low:    {health_result['probabilities']['low']:.2%}")
        output.append(f"  Medium: {health_result['probabilities']['medium']:.2%}")
        output.append(f"  High:   {health_result['probabilities']['high']:.2%}")
        
        # Demo 4: Food Security Risk
        output.append("\n🌾 FOOD SECURITY RISK PREDICTION")
        output.append("-" * 40)
        
        food_result = self.predict_food_security(
            crop_supply_index=65,
            food_price_index=125,
            rainfall=25,
            temperature=38,
            supply_disruption_events=2
        )
        output.append(f"Input: Crop Supply=65, Price Index=125, Rain=25mm, Disruptions=2")
        output.append(f"Risk Class: {food_result['risk_class'].upper()}")
        output.append(f"Probabilities:")
        output.append(f"  Low:    {food_result['probabilities']['low']:.2%}")
        output.append(f"  Medium: {food_result['probabilities']['medium']:.2%}")
        output.append(f"  High:   {food_result['probabilities']['high']:.2%}")
        
        # Demo 5: Feature Importance
        output.append("\n📈 HEALTH MODEL FEATURE IMPORTANCE")
        output.append("-" * 40)
        
        importance = self.get_health_feature_importance()
        sorted_importance = sorted(importance.items(), key=lambda x: x[1], reverse=True)
        for feature, score in sorted_importance:
            bar = "█" * int(score * 50)
            output.append(f"  {feature:30} {score:.3f} {bar}")
        
        output.append("\n" + "=" * 60)
        output.append("Phase 1 Complete - Ready for Phase 2 Cascading Integration")
        output.append("=" * 60)
        
        return "\n".join(output)


# Quick test when run directly
if __name__ == "__main__":
    engine = RiskEngine()
    print(engine.demo())
