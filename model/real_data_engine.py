"""
Real Data Risk Engine

Risk Engine that trains on actual datasets instead of synthetic data.
This version uses the real CSV datasets for production-quality models.
"""

from typing import Dict, Optional
import numpy as np
import os

from .models import (
    EnvironmentalRiskModel,
    HealthRiskModel,
    FoodSecurityRiskModel
)
from .data_generators.real_data_loaders import (
    load_environmental_data,
    load_health_data,
    load_food_security_data
)


class RealDataRiskEngine:
    """
    Multi-Domain Risk Prediction Engine trained on REAL DATA
    
    This version uses actual datasets:
    - Traffic Volume Data → Environmental Model
    - Hospital Respiratory Data → Health Model
    - Agriculture Price Data → Food Security Model
    
    Usage:
        engine = RealDataRiskEngine()  # Auto-trains on real data
        result = engine.predict_environmental(aqi=150, traffic_density=2, ...)
    """
    
    def __init__(self, data_dir: str = None, auto_train: bool = True):
        """
        Initialize Real Data Risk Engine.
        
        Args:
            data_dir: Directory containing datasets (default: project root)
            auto_train: If True, automatically trains on real data
        """
        self.data_dir = data_dir or os.path.dirname(os.path.dirname(__file__))
        
        # Initialize models
        self.env_model = EnvironmentalRiskModel()
        self.health_model = HealthRiskModel()
        self.food_model = FoodSecurityRiskModel()
        
        self._is_trained = False
        self._training_stats = {}
        
        if auto_train:
            self.train_on_real_data()
    
    def train_on_real_data(self):
        """Train all three models on real datasets."""
        original_dir = os.getcwd()
        
        try:
            # Change to data directory for loading
            if self.data_dir:
                os.chdir(self.data_dir)
            
            print("=" * 60)
            print("TRAINING MODELS ON REAL DATA")
            print("=" * 60)
            
            # Environmental Model
            print("\n[1] Training Environmental Risk Model...")
            X_env, y_env, df_env = load_environmental_data()
            self.env_model.train(X_env, y_env)
            self._training_stats['environmental'] = {
                'samples': len(y_env),
                'class_distribution': dict(zip(*np.unique(y_env, return_counts=True)))
            }
            print(f"    Trained on {len(y_env)} samples")
            
            # Health Model
            print("\n[2] Training Health Risk Model...")
            X_health, y_health, df_health = load_health_data()
            self.health_model.train(X_health, y_health)
            self._training_stats['health'] = {
                'samples': len(y_health),
                'class_distribution': dict(zip(*np.unique(y_health, return_counts=True)))
            }
            print(f"    Trained on {len(y_health)} samples")
            
            # Food Security Model
            print("\n[3] Training Food Security Risk Model...")
            X_food, y_food, df_food = load_food_security_data()
            self.food_model.train(X_food, y_food)
            self._training_stats['food'] = {
                'samples': len(y_food),
                'class_distribution': dict(zip(*np.unique(y_food, return_counts=True)))
            }
            print(f"    Trained on {len(y_food)} samples")
            
            self._is_trained = True
            
            print("\n" + "=" * 60)
            print("ALL MODELS TRAINED ON REAL DATA!")
            print("=" * 60)
            
        finally:
            os.chdir(original_dir)
    
    def predict_environmental(
        self,
        aqi: float,
        traffic_density: int,
        temperature: float,
        rainfall: float
    ) -> Dict:
        """Predict environmental risk from inputs."""
        X = np.array([[aqi, traffic_density, temperature, rainfall]])
        result = self.env_model.predict_with_proba(X)
        
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
        """Predict health risk with cascading environmental input."""
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
        """Predict food security risk."""
        X = np.array([[
            crop_supply_index, food_price_index, rainfall, temperature, supply_disruption_events
        ]])
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
    
    def get_training_stats(self) -> Dict:
        """Return training statistics for all models."""
        return self._training_stats
    
    def demo(self) -> str:
        """Run demonstration with sample predictions."""
        output = []
        output.append("=" * 60)
        output.append("REAL DATA RISK ENGINE DEMONSTRATION")
        output.append("=" * 60)
        
        # Training stats
        output.append("\nTRAINING DATA SUMMARY:")
        for model_name, stats in self._training_stats.items():
            output.append(f"  {model_name}: {stats['samples']} samples")
        
        # Environmental
        output.append("\n📊 ENVIRONMENTAL RISK PREDICTION")
        output.append("-" * 40)
        env_result = self.predict_environmental(aqi=150, traffic_density=2, temperature=32, rainfall=5)
        output.append(f"Input: AQI=150, Traffic=HIGH, Temp=32°C, Rain=5mm")
        output.append(f"Risk Class: {env_result['risk_class'].upper()}")
        output.append(f"High Risk Probability: {env_result['probabilities']['high']:.2%}")
        
        # Health
        output.append("\n🏥 HEALTH RISK PREDICTION")
        output.append("-" * 40)
        health_result = self.predict_health(
            aqi=150, hospital_load=0.75, respiratory_cases=500,
            temperature=32, environmental_risk_prob=env_result['probabilities']['high']
        )
        output.append(f"Input: AQI=150, Hospital=75%, Cases=500, Env Risk={env_result['probabilities']['high']:.2f}")
        output.append(f"Risk Class: {health_result['risk_class'].upper()}")
        output.append(f"High Risk Probability: {health_result['probabilities']['high']:.2%}")
        
        # Food Security
        output.append("\n🌾 FOOD SECURITY RISK PREDICTION")
        output.append("-" * 40)
        food_result = self.predict_food_security(
            crop_supply_index=70, food_price_index=115, rainfall=30,
            temperature=32, supply_disruption_events=1
        )
        output.append(f"Input: Supply=70, Price=115, Rain=30mm, Disruptions=1")
        output.append(f"Risk Class: {food_result['risk_class'].upper()}")
        output.append(f"High Risk Probability: {food_result['probabilities']['high']:.2%}")
        
        output.append("\n" + "=" * 60)
        output.append("Models trained on REAL DATA - Ready for production!")
        output.append("=" * 60)
        
        return "\n".join(output)


if __name__ == "__main__":
    # Change to project directory
    import os
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_dir)
    
    engine = RealDataRiskEngine()
    print(engine.demo())
