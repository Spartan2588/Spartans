"""
Food Security Risk Model

Predicts food security risk using GaussianNB with probability calibration.

Features:
- crop_supply_index: Crop availability (40-100, higher=better)
- food_price_index: Food prices (80-150, higher=worse)
- rainfall: Precipitation (affects agriculture)
- temperature: Temperature (extreme temps hurt crops)
- supply_disruption_events: Supply chain disruption count

This model runs independently (not cascading) but shows how environmental
factors (rainfall, temperature) affect food supply chains.
"""

from typing import Tuple, List
import numpy as np
from sklearn.naive_bayes import GaussianNB

from .base_model import BaseRiskModel
from ..data_generators.food_security_data import (
    generate_food_security_data,
    get_feature_names as get_food_feature_names
)


class FoodSecurityRiskModel(BaseRiskModel):
    """
    Food Security Risk Prediction Model
    
    Uses GaussianNB for:
    - Fast training and inference
    - Natural probability outputs
    - Good interpretability
    
    Shows how environmental factors impact food supply chains,
    demonstrating the multi-domain nature of city risks.
    """
    
    def __init__(self, calibration_method: str = 'sigmoid', cv: int = 3):
        """
        Initialize Food Security Risk Model.
        
        Args:
            calibration_method: 'sigmoid' (default) or 'isotonic'
            cv: Cross-validation folds for calibration
        """
        super().__init__(calibration_method, cv)
        self.feature_names = get_food_feature_names()
    
    def _create_base_model(self):
        """Create GaussianNB base model."""
        return GaussianNB()
    
    def _generate_training_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic food security training data."""
        X, y, _ = generate_food_security_data(n_samples=1000, random_seed=42)
        return X, y
    
    def get_feature_names(self) -> List[str]:
        """Return feature names."""
        return self.feature_names
    
    def predict_from_conditions(
        self,
        crop_supply: np.ndarray,
        food_price: np.ndarray,
        rainfall: np.ndarray,
        temperature: np.ndarray,
        disruptions: np.ndarray
    ) -> dict:
        """
        Predict food security risk from individual conditions.
        
        Args:
            crop_supply: Crop supply index (40-100)
            food_price: Food price index (80-150)
            rainfall: Rainfall in mm
            temperature: Temperature in Celsius
            disruptions: Supply disruption event count
        
        Returns:
            Prediction results with class, probabilities, confidence
        """
        X = np.column_stack([
            crop_supply, food_price, rainfall, temperature, disruptions
        ])
        
        return self.predict_with_proba(X)
    
    def assess_climate_impact(
        self,
        baseline_rainfall: float,
        baseline_temperature: float,
        rainfall_change: float = 0,
        temperature_change: float = 0,
        n_scenarios: int = 100
    ) -> dict:
        """
        Assess impact of climate changes on food security.
        
        This method simulates how changes in climate conditions
        affect food security risk distribution.
        
        Args:
            baseline_rainfall: Current rainfall level
            baseline_temperature: Current temperature
            rainfall_change: Change in rainfall (positive=more, negative=less)
            temperature_change: Change in temperature (positive=hotter)
            n_scenarios: Number of Monte Carlo scenarios
        
        Returns:
            Dictionary with baseline and projected risk distributions
        
        Example:
            # What if temperature rises 3°C and rainfall drops 20%?
            impact = model.assess_climate_impact(
                baseline_rainfall=50,
                baseline_temperature=32,
                rainfall_change=-10,  # 10mm less rainfall
                temperature_change=3   # 3°C hotter
            )
        """
        np.random.seed(42)
        
        # Generate random other features
        crop_supply = np.random.uniform(60, 90, n_scenarios)
        food_price = np.random.uniform(90, 120, n_scenarios)
        disruptions = np.random.randint(0, 3, n_scenarios)
        
        # Baseline scenario
        baseline_rain = np.full(n_scenarios, baseline_rainfall)
        baseline_temp = np.full(n_scenarios, baseline_temperature)
        
        baseline_pred = self.predict_from_conditions(
            crop_supply, food_price, baseline_rain, baseline_temp, disruptions
        )
        
        # Changed scenario
        changed_rain = np.full(n_scenarios, baseline_rainfall + rainfall_change)
        changed_temp = np.full(n_scenarios, baseline_temperature + temperature_change)
        
        changed_pred = self.predict_from_conditions(
            crop_supply, food_price, changed_rain, changed_temp, disruptions
        )
        
        return {
            'baseline': {
                'mean_high_risk_prob': np.mean(baseline_pred['probabilities']['high']),
                'high_risk_count': np.sum(baseline_pred['class'] == 'high')
            },
            'projected': {
                'mean_high_risk_prob': np.mean(changed_pred['probabilities']['high']),
                'high_risk_count': np.sum(changed_pred['class'] == 'high')
            },
            'risk_increase': (
                np.mean(changed_pred['probabilities']['high']) - 
                np.mean(baseline_pred['probabilities']['high'])
            )
        }
    
    # =========================================================================
    # POLICY SIMULATION HOOKS
    # These methods allow testing "what-if" scenarios for food security policy
    # =========================================================================
    
    def simulate_food_import_stabilization(
        self,
        X: np.ndarray,
        import_increase: float = 0.15
    ) -> dict:
        """
        Simulate food import stabilization policy.
        
        Args:
            X: Current features (crop_supply, food_price, rainfall, temp, disruptions)
            import_increase: Import increase factor (0.15 = 15% more imports)
        
        Returns:
            Dictionary with baseline and intervention predictions
        
        Policy Context:
        - Trade agreements for emergency imports
        - Strategic reserve deployment
        - Port/logistics prioritization
        - Foreign supply chain partnerships
        """
        baseline = self.predict_with_proba(X)
        
        # Imports increase effective crop supply
        X_policy = X.copy()
        X_policy[:, 0] = X_policy[:, 0] * (1 + import_increase)  # Increase crop_supply
        X_policy[:, 0] = np.clip(X_policy[:, 0], 40, 100)
        
        intervention = self.predict_with_proba(X_policy)
        
        return {
            'baseline': baseline,
            'intervention': intervention,
            'risk_reduction': baseline['probabilities']['high'] - intervention['probabilities']['high'],
            'policy_type': 'food_import_stabilization',
            'import_increase': import_increase
        }
    
    def simulate_subsidy_mechanism(
        self,
        X: np.ndarray,
        subsidy_rate: float = 0.10
    ) -> dict:
        """
        Simulate food subsidy mechanism.
        
        Args:
            X: Current features
            subsidy_rate: Price subsidy rate (0.10 = 10% price reduction for consumers)
        
        Returns:
            Dictionary with baseline and intervention predictions
        
        Policy Context:
        - Consumer price subsidies
        - Farmer income support
        - Food stamp programs
        - School meal programs
        
        Modeling: Subsidies reduce effective food price index
        """
        baseline = self.predict_with_proba(X)
        
        # Subsidies reduce effective food price
        X_policy = X.copy()
        X_policy[:, 1] = X_policy[:, 1] * (1 - subsidy_rate)  # Reduce food_price_index
        X_policy[:, 1] = np.clip(X_policy[:, 1], 80, 150)
        
        intervention = self.predict_with_proba(X_policy)
        
        return {
            'baseline': baseline,
            'intervention': intervention,
            'risk_reduction': baseline['probabilities']['high'] - intervention['probabilities']['high'],
            'policy_type': 'subsidy_mechanism',
            'subsidy_rate': subsidy_rate
        }
    
    def simulate_supply_chain_resilience(
        self,
        X: np.ndarray,
        resilience_investment: float = 0.25
    ) -> dict:
        """
        Simulate supply chain resilience improvements.
        
        Args:
            X: Current features
            resilience_investment: Investment in supply chain resilience
        
        Returns:
            Dictionary with baseline and intervention predictions
        
        Policy Context:
        - Diversified supplier networks
        - Cold chain infrastructure
        - Transportation redundancy
        - Warehouse/storage expansion
        - Digital supply chain monitoring
        
        Modeling: Better resilience = fewer disruption impacts + stable prices
        """
        baseline = self.predict_with_proba(X)
        
        X_policy = X.copy()
        # Resilience reduces disruption impact
        disruption_reduction = resilience_investment * 0.6
        X_policy[:, 4] = X_policy[:, 4] * (1 - disruption_reduction)  # Reduce disruptions
        X_policy[:, 4] = np.clip(X_policy[:, 4], 0, 5)
        
        # Resilience also stabilizes prices
        price_stability = resilience_investment * 0.3
        X_policy[:, 1] = X_policy[:, 1] * (1 - price_stability)
        X_policy[:, 1] = np.clip(X_policy[:, 1], 80, 150)
        
        intervention = self.predict_with_proba(X_policy)
        
        return {
            'baseline': baseline,
            'intervention': intervention,
            'risk_reduction': baseline['probabilities']['high'] - intervention['probabilities']['high'],
            'policy_type': 'supply_chain_resilience',
            'resilience_investment': resilience_investment
        }
    
    def compare_food_policies(
        self,
        X: np.ndarray,
        policies: dict = None
    ) -> dict:
        """
        Compare multiple food security policy interventions.
        
        Args:
            X: Current features
            policies: Dictionary of policy parameters, defaults provided if None
        
        Returns:
            Comparison of all policy impacts
        
        Example:
            comparison = model.compare_food_policies(X, {
                'imports': 0.20,
                'subsidies': 0.15,
                'resilience': 0.25
            })
        """
        if policies is None:
            policies = {
                'imports': 0.15,
                'subsidies': 0.10,
                'resilience': 0.25
            }
        
        baseline = self.predict_with_proba(X)
        
        results = {
            'baseline_high_risk_prob': float(np.mean(baseline['probabilities']['high'])),
            'policies': {}
        }
        
        if 'imports' in policies:
            imports = self.simulate_food_import_stabilization(X, policies['imports'])
            results['policies']['imports'] = {
                'high_risk_prob': float(np.mean(imports['intervention']['probabilities']['high'])),
                'risk_reduction': float(np.mean(imports['risk_reduction']))
            }
        
        if 'subsidies' in policies:
            subsidies = self.simulate_subsidy_mechanism(X, policies['subsidies'])
            results['policies']['subsidies'] = {
                'high_risk_prob': float(np.mean(subsidies['intervention']['probabilities']['high'])),
                'risk_reduction': float(np.mean(subsidies['risk_reduction']))
            }
        
        if 'resilience' in policies:
            resilience = self.simulate_supply_chain_resilience(X, policies['resilience'])
            results['policies']['resilience'] = {
                'high_risk_prob': float(np.mean(resilience['intervention']['probabilities']['high'])),
                'risk_reduction': float(np.mean(resilience['risk_reduction']))
            }
        
        return results

