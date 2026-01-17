"""
Health Risk Model

Predicts health crisis risk using RandomForestClassifier with probability calibration.

Key Feature: Takes environmental_risk_prob as input (CASCADING LOGIC)
This creates a causal chain: Environmental stress → Health crisis

Features:
- AQI, hospital_load, respiratory_cases, temperature, environmental_risk_prob

Uses RandomForest because:
- Captures non-linear relationships (e.g., hospital load amplifies AQI effects)
- Handles feature interactions well
- Good for the cascading relationship with environmental risk
"""

from typing import Tuple, List
import numpy as np
from sklearn.ensemble import RandomForestClassifier

from .base_model import BaseRiskModel
from ..data_generators.health_data import (
    generate_health_data,
    get_feature_names as get_health_feature_names
)


class HealthRiskModel(BaseRiskModel):
    """
    Health Risk Prediction Model with Cascading Input
    
    Uses RandomForestClassifier for:
    - Non-linear relationship modeling
    - Feature interaction capture
    - Robust probability estimates
    
    The environmental_risk_prob feature creates the cascading effect:
    High environmental risk → Increased health risk
    
    This is the key innovation for multi-domain risk prediction.
    """
    
    def __init__(
        self,
        calibration_method: str = 'sigmoid',
        cv: int = 3,
        n_estimators: int = 50,
        max_depth: int = 5
    ):
        """
        Initialize Health Risk Model.
        
        Args:
            calibration_method: 'sigmoid' (default) or 'isotonic'
            cv: Cross-validation folds for calibration
            n_estimators: Number of trees in forest
            max_depth: Maximum tree depth (limited for interpretability & speed)
        """
        super().__init__(calibration_method, cv)
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.feature_names = get_health_feature_names()
    
    def _create_base_model(self):
        """Create RandomForestClassifier base model."""
        return RandomForestClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            random_state=42,
            n_jobs=-1  # Use all CPU cores
        )
    
    def _generate_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic health training data with cascading input."""
        X, y, _ = generate_health_data(n_samples=1000, random_seed=42)
        return X, y
    
    def get_feature_names(self) -> List[str]:
        """Return feature names including cascading environmental_risk_prob"""
        return self.feature_names
    
    def predict_with_env_risk(
        self,
        aqi: np.ndarray,
        hospital_load: np.ndarray,
        respiratory_cases: np.ndarray,
        temperature: np.ndarray,
        environmental_risk_prob: np.ndarray
    ) -> dict:
        """
        Predict health risk with explicit cascading input.
        
        This method makes the cascading relationship explicit by requiring
        the environmental risk probability as a separate input.
        
        Args:
            aqi: Air Quality Index values
            hospital_load: Hospital utilization (0.4-0.95)
            respiratory_cases: Daily respiratory case count
            temperature: Temperature in Celsius
            environmental_risk_prob: Probability from EnvironmentalRiskModel
        
        Returns:
            Prediction results with class, probabilities, confidence
        
        Usage (Phase 2 cascading logic):
            # Step 1: Get environmental risk
            env_probs = env_model.get_high_risk_probability(env_features)
            
            # Step 2: Feed into health model
            health_result = health_model.predict_with_env_risk(
                aqi=...,
                hospital_load=...,
                respiratory_cases=...,
                temperature=...,
                environmental_risk_prob=env_probs
            )
        """
        # Stack features in expected order
        X = np.column_stack([
            aqi, hospital_load, respiratory_cases, temperature, environmental_risk_prob
        ])
        
        return self.predict_with_proba(X)
    
    def get_feature_importance(self) -> dict:
        """
        Get feature importance from the underlying RandomForest.
        
        Note: This uses the base model before calibration wrap.
        For Phase 4, use permutation_importance for calibrated model.
        
        Returns:
            Dictionary mapping feature names to importance scores
        """
        if not self._is_trained:
            raise RuntimeError("Model must be trained first")
        
        # Access the base estimators from calibrated model
        # CalibratedClassifierCV stores fitted base models
        importances = np.zeros(len(self.feature_names))
        
        for calibrator in self.calibrated_model.calibrated_classifiers_:
            importances += calibrator.estimator.feature_importances_
        
        importances /= len(self.calibrated_model.calibrated_classifiers_)
        
        return dict(zip(self.feature_names, importances))
    
    # =========================================================================
    # POLICY SIMULATION HOOKS
    # These methods allow testing "what-if" scenarios for healthcare policy
    # =========================================================================
    
    def simulate_hospital_surge_capacity(
        self,
        X: np.ndarray,
        capacity_increase: float = 0.15
    ) -> dict:
        """
        Simulate hospital surge capacity expansion.
        
        Args:
            X: Current features (aqi, hospital_load, resp_cases, temp, env_risk_prob)
            capacity_increase: Capacity increase factor (0.15 = 15% more capacity)
        
        Returns:
            Dictionary with baseline and intervention predictions
        
        Policy Context:
        - Emergency bed deployment
        - Overflow facility activation
        - Field hospital setup
        - Temporary ICU expansion
        """
        # Baseline prediction
        baseline = self.predict_with_proba(X)
        
        # Apply capacity expansion (reduces effective hospital load)
        X_policy = X.copy()
        X_policy[:, 1] = X_policy[:, 1] / (1 + capacity_increase)  # Reduce hospital_load
        X_policy[:, 1] = np.clip(X_policy[:, 1], 0.4, 0.95)  # Keep in valid range
        
        # Intervention prediction
        intervention = self.predict_with_proba(X_policy)
        
        return {
            'baseline': baseline,
            'intervention': intervention,
            'risk_reduction': baseline['probabilities']['high'] - intervention['probabilities']['high'],
            'policy_type': 'hospital_surge_capacity',
            'capacity_increase': capacity_increase
        }
    
    def simulate_emergency_staffing(
        self,
        X: np.ndarray,
        staffing_increase: float = 0.20
    ) -> dict:
        """
        Simulate emergency staffing increase.
        
        Args:
            X: Current features
            staffing_increase: Staff increase factor (0.20 = 20% more staff)
        
        Returns:
            Dictionary with baseline and intervention predictions
        
        Policy Context:
        - Emergency nurse deployment
        - Travel healthcare workers
        - Medical reserve corps activation
        - Overtime authorization
        
        Modeling: More staff = can handle more patients = reduced effective load
        """
        baseline = self.predict_with_proba(X)
        
        # More staff means effectively lower load per staff
        X_policy = X.copy()
        load_reduction = staffing_increase * 0.5  # Staff increase has diminishing returns
        X_policy[:, 1] = X_policy[:, 1] * (1 - load_reduction)
        X_policy[:, 1] = np.clip(X_policy[:, 1], 0.4, 0.95)
        
        intervention = self.predict_with_proba(X_policy)
        
        return {
            'baseline': baseline,
            'intervention': intervention,
            'risk_reduction': baseline['probabilities']['high'] - intervention['probabilities']['high'],
            'policy_type': 'emergency_staffing',
            'staffing_increase': staffing_increase
        }
    
    def simulate_healthcare_infrastructure(
        self,
        X: np.ndarray,
        infrastructure_improvement: float = 0.25
    ) -> dict:
        """
        Simulate healthcare infrastructure investment impact.
        
        Args:
            X: Current features
            infrastructure_improvement: Infrastructure investment factor
        
        Returns:
            Dictionary with baseline and intervention predictions
        
        Policy Context:
        - New hospital construction
        - Equipment modernization
        - Telemedicine expansion
        - Primary care network expansion
        
        Modeling: Better infrastructure = lower baseline load, fewer respiratory cases
        """
        baseline = self.predict_with_proba(X)
        
        # Infrastructure investment reduces both load and cases
        X_policy = X.copy()
        X_policy[:, 1] = X_policy[:, 1] * (1 - infrastructure_improvement * 0.4)  # Hospital load
        X_policy[:, 2] = X_policy[:, 2] * (1 - infrastructure_improvement * 0.3)  # Respiratory cases
        X_policy[:, 1] = np.clip(X_policy[:, 1], 0.4, 0.95)
        X_policy[:, 2] = np.clip(X_policy[:, 2], 50, 400)
        
        intervention = self.predict_with_proba(X_policy)
        
        return {
            'baseline': baseline,
            'intervention': intervention,
            'risk_reduction': baseline['probabilities']['high'] - intervention['probabilities']['high'],
            'policy_type': 'healthcare_infrastructure',
            'infrastructure_improvement': infrastructure_improvement
        }
    
    def compare_health_policies(
        self,
        X: np.ndarray,
        policies: dict = None
    ) -> dict:
        """
        Compare multiple healthcare policy interventions.
        
        Args:
            X: Current features
            policies: Dictionary of policy parameters, defaults provided if None
        
        Returns:
            Comparison of all policy impacts
        
        Example:
            comparison = model.compare_health_policies(X, {
                'surge_capacity': 0.20,
                'staffing': 0.15,
                'infrastructure': 0.10
            })
        """
        if policies is None:
            policies = {
                'surge_capacity': 0.15,
                'staffing': 0.20,
                'infrastructure': 0.25
            }
        
        baseline = self.predict_with_proba(X)
        
        results = {
            'baseline_high_risk_prob': float(np.mean(baseline['probabilities']['high'])),
            'policies': {}
        }
        
        # Test each policy
        if 'surge_capacity' in policies:
            surge = self.simulate_hospital_surge_capacity(X, policies['surge_capacity'])
            results['policies']['surge_capacity'] = {
                'high_risk_prob': float(np.mean(surge['intervention']['probabilities']['high'])),
                'risk_reduction': float(np.mean(surge['risk_reduction']))
            }
        
        if 'staffing' in policies:
            staffing = self.simulate_emergency_staffing(X, policies['staffing'])
            results['policies']['staffing'] = {
                'high_risk_prob': float(np.mean(staffing['intervention']['probabilities']['high'])),
                'risk_reduction': float(np.mean(staffing['risk_reduction']))
            }
        
        if 'infrastructure' in policies:
            infra = self.simulate_healthcare_infrastructure(X, policies['infrastructure'])
            results['policies']['infrastructure'] = {
                'high_risk_prob': float(np.mean(infra['intervention']['probabilities']['high'])),
                'risk_reduction': float(np.mean(infra['risk_reduction']))
            }
        
        return results

