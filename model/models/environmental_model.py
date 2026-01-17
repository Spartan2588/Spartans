"""
Environmental Risk Model

Predicts environmental stress risk using GaussianNB with probability calibration.

Features:
- AQI, traffic_density, temperature, rainfall

Policy Simulation Hooks:
- simulate_traffic_reduction(): Modify traffic to test policy impact
- simulate_aqi_regulation(): Cap AQI values
- simulate_emission_control(): Scale emissions/AQI

This model serves as an early-warning signal that cascades into health risk.
"""

from typing import Tuple, Optional, Dict, List
import numpy as np
from sklearn.naive_bayes import GaussianNB

from .base_model import BaseRiskModel
from ..data_generators.environmental_data import (
    generate_environmental_data,
    apply_policy_to_features,
    get_feature_names as get_env_feature_names
)


class EnvironmentalRiskModel(BaseRiskModel):
    """
    Environmental Risk Prediction Model
    
    Uses GaussianNB for:
    - Fast training and inference
    - Natural probability outputs
    - Good interpretability
    
    Probability calibration ensures outputs can be trusted for
    downstream decision-making and ROI calculations.
    """
    
    def __init__(self, calibration_method: str = 'sigmoid', cv: int = 3):
        """
        Initialize Environmental Risk Model.
        
        Args:
            calibration_method: 'sigmoid' (default) or 'isotonic'
            cv: Cross-validation folds for calibration
        """
        super().__init__(calibration_method, cv)
        self.feature_names = get_env_feature_names()
    
    def _create_base_model(self):
        """Create GaussianNB base model."""
        return GaussianNB()
    
    def _generate_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic environmental training data."""
        X, y, _ = generate_environmental_data(n_samples=1000, random_seed=42)
        return X, y
    
    def get_feature_names(self) -> List[str]:
        """Return feature names: aqi, traffic_density, temperature, rainfall"""
        return self.feature_names
    
    # =========================================================================
    # POLICY SIMULATION HOOKS
    # These methods allow testing "what-if" scenarios without retraining
    # =========================================================================
    
    def predict_with_policy(
        self,
        X: np.ndarray,
        traffic_reduction_factor: float = 1.0,
        aqi_cap: Optional[float] = None,
        emission_control_factor: float = 1.0
    ) -> Dict:
        """
        Predict risk with policy interventions applied.
        
        This is the main policy simulation method. It takes current conditions
        and shows what would happen under different policy scenarios.
        
        Args:
            X: Current feature values (n_samples, 4)
            traffic_reduction_factor: 0.0-1.0 (1.0=no change, 0.5=50% less traffic)
            aqi_cap: Maximum allowed AQI (e.g., 150 for regulation)
            emission_control_factor: 0.0-1.0 (1.0=no change, 0.7=30% less emissions)
        
        Returns:
            Dictionary with:
            - 'baseline': Predictions on original data
            - 'intervention': Predictions with policy applied
            - 'risk_reduction': Difference in high-risk probability
        
        Example:
            # Current conditions
            X = np.array([[180, 2, 35, 10]])  # High AQI, high traffic, hot, low rain
            
            # Test 40% traffic reduction policy
            result = model.predict_with_policy(X, traffic_reduction_factor=0.6)
            
            print(f"Baseline high-risk prob: {result['baseline']['probabilities']['high']}")
            print(f"With policy high-risk prob: {result['intervention']['probabilities']['high']}")
            print(f"Risk reduction: {result['risk_reduction']}")
        """
        # Baseline prediction
        baseline = self.predict_with_proba(X)
        
        # Apply policy to features
        X_policy = apply_policy_to_features(
            X,
            traffic_reduction_factor=traffic_reduction_factor,
            aqi_cap=aqi_cap,
            emission_control_factor=emission_control_factor
        )
        
        # Intervention prediction
        intervention = self.predict_with_proba(X_policy)
        
        # Calculate risk reduction (positive = reduced risk)
        risk_reduction = baseline['probabilities']['high'] - intervention['probabilities']['high']
        
        return {
            'baseline': baseline,
            'intervention': intervention,
            'risk_reduction': risk_reduction,
            'modified_features': X_policy
        }
    
    def simulate_traffic_reduction(self, X: np.ndarray, reduction_factor: float = 0.5) -> Dict:
        """
        Simulate traffic reduction policy.
        
        Args:
            X: Current features
            reduction_factor: How much to reduce traffic (0.5 = 50% reduction)
        
        Returns:
            Policy simulation results
        
        Policy Context:
        - Congestion pricing
        - Work-from-home mandates
        - Public transit improvements
        - Odd-even vehicle restrictions
        """
        return self.predict_with_policy(X, traffic_reduction_factor=1.0 - reduction_factor)
    
    def simulate_aqi_regulation(self, X: np.ndarray, max_aqi: float = 150) -> Dict:
        """
        Simulate AQI regulation enforcement.
        
        Args:
            X: Current features
            max_aqi: Maximum allowed AQI (default 150 = moderate)
        
        Returns:
            Policy simulation results
        
        Policy Context:
        - Industrial emission limits
        - Factory shutdown during high pollution
        - Vehicle inspection enforcement
        - Construction dust controls
        """
        return self.predict_with_policy(X, aqi_cap=max_aqi)
    
    def simulate_emission_control(self, X: np.ndarray, reduction_factor: float = 0.3) -> Dict:
        """
        Simulate emission control measures.
        
        Args:
            X: Current features
            reduction_factor: How much to reduce emissions (0.3 = 30% reduction)
        
        Returns:
            Policy simulation results
        
        Policy Context:
        - Electric vehicle mandates
        - Clean energy transition
        - Industrial scrubber requirements
        - Low-emission zones
        """
        return self.predict_with_policy(X, emission_control_factor=1.0 - reduction_factor)
    
    def get_high_risk_probability(self, X: np.ndarray) -> np.ndarray:
        """
        Get probability of high environmental risk.
        
        This value is used as input for the Health Risk Model (cascading).
        
        Args:
            X: Feature array
        
        Returns:
            Array of high-risk probabilities
        """
        probas = self.predict_proba(X)
        return probas[:, 2]  # Column 2 = 'high' class
