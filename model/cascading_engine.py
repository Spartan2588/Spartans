"""
Cascading Risk Engine - Phase 2

The core differentiator: A directed probabilistic system that:
1. Predicts environmental risk
2. Propagates P_env causally into health risk prediction
3. Predicts food security risk in parallel
4. Computes resilience score and confidence metrics

This is NOT an ensemble - it's a causal probabilistic chain.

Architecture:
    Environmental Stress
            ↓
    Environmental Risk (P_env)
            ↓
    Health Risk (P_health | P_env)
    
    Environmental Stress
            ↓
    Food Security Risk (P_food)
"""

import numpy as np
from typing import Dict, Any, Optional, List
import os

from .models import (
    EnvironmentalRiskModel,
    HealthRiskModel,
    FoodSecurityRiskModel
)
from .preprocessing import (
    preprocess_environmental_metrics,
    preprocess_health_metrics,
    preprocess_food_metrics,
    preprocess_all_metrics
)


class CascadingRiskEngine:
    """
    Cascading Risk Prediction Engine
    
    Implements directed probabilistic inference across three risk domains:
    - Environmental stress → Environmental risk
    - Environmental risk → Health risk (causal cascade)
    - Environmental stress → Food security risk (parallel)
    
    Key Features:
    - Probabilistic cascading (P_env conditions P_health)
    - Policy-driven scenario simulation
    - Calibrated confidence scores
    - Resilience score aggregation
    """
    
    # Resilience score weights (sum to 1.0)
    RESILIENCE_WEIGHTS = {
        'environmental': 0.35,
        'health': 0.40,
        'food': 0.25
    }
    
    def __init__(
        self,
        data_dir: Optional[str] = None,
        use_real_data: bool = True,
        auto_train: bool = True
    ):
        """
        Initialize Cascading Risk Engine.
        
        Args:
            data_dir: Directory containing datasets (for real data training)
            use_real_data: If True, train on real data; else use synthetic
            auto_train: If True, automatically train models on init
        """
        self.data_dir = data_dir or os.path.dirname(os.path.dirname(__file__))
        self.use_real_data = use_real_data
        
        # Initialize models
        self.env_model = EnvironmentalRiskModel()
        self.health_model = HealthRiskModel()
        self.food_model = FoodSecurityRiskModel()
        
        self._is_trained = False
        self._training_info = {}
        
        if auto_train:
            self.train_models()
    
    def train_models(self):
        """Train all three models."""
        if self.use_real_data:
            self._train_on_real_data()
        else:
            self._train_on_synthetic_data()
        
        self._is_trained = True
    
    def _train_on_real_data(self):
        """Train models on real datasets."""
        from .data_generators.real_data_loaders import (
            load_environmental_data,
            load_health_data,
            load_food_security_data
        )
        
        original_dir = os.getcwd()
        try:
            if self.data_dir:
                os.chdir(self.data_dir)
            
            print("Training Cascading Risk Engine on REAL DATA...")
            
            # Environmental
            print("  [1/3] Training Environmental Model...")
            X_env, y_env, _ = load_environmental_data()
            self.env_model.train(X_env, y_env)
            self._training_info['environmental'] = {'samples': len(y_env)}
            
            # Health
            print("  [2/3] Training Health Model...")
            X_health, y_health, _ = load_health_data()
            self.health_model.train(X_health, y_health)
            self._training_info['health'] = {'samples': len(y_health)}
            
            # Food Security
            print("  [3/3] Training Food Security Model...")
            X_food, y_food, _ = load_food_security_data()
            self.food_model.train(X_food, y_food)
            self._training_info['food'] = {'samples': len(y_food)}
            
            print("Cascading Risk Engine ready!")
            
        finally:
            os.chdir(original_dir)
    
    def _train_on_synthetic_data(self):
        """Train models on synthetic data."""
        print("Training Cascading Risk Engine on synthetic data...")
        
        print("  [1/3] Training Environmental Model...")
        self.env_model.train()
        self._training_info['environmental'] = {'samples': 1000}
        
        print("  [2/3] Training Health Model...")
        self.health_model.train()
        self._training_info['health'] = {'samples': 1000}
        
        print("  [3/3] Training Food Security Model...")
        self.food_model.train()
        self._training_info['food'] = {'samples': 1000}
        
        print("Cascading Risk Engine ready!")
    
    # =========================================================================
    # PART 1: CASCADING INFERENCE
    # =========================================================================
    
    def predict_cascading_risks(self, metrics: Dict[str, Any]) -> Dict:
        """
        Predict risks with probabilistic cascading.
        
        This is the core function implementing the directed probabilistic system:
        1. Predict P_env from environmental metrics
        2. Inject P_env as feature into health prediction (CASCADING)
        3. Predict P_food independently
        4. Calculate resilience score and confidence
        
        Args:
            metrics: Dictionary containing all input metrics:
                - aqi: Air Quality Index
                - traffic_density: 0/1/2 (low/medium/high)
                - temperature: Temperature in Celsius
                - rainfall: Rainfall in mm
                - hospital_load: Hospital occupancy (0-1)
                - respiratory_cases: Daily respiratory case count
                - crop_supply_index: Crop availability (40-100)
                - food_price_index: Food price index (80-150)
                - supply_disruption_events: Number of disruptions
        
        Returns:
            Dictionary with structure:
            {
                "environmental": {"risk": "high", "prob": 0.78},
                "health": {"risk": "high", "prob": 0.82},
                "food_security": {"risk": "medium", "prob": 0.45},
                "resilience_score": 36,
                "confidence": {
                    "environmental": 0.91,
                    "health": 0.87,
                    "food_security": 0.89
                },
                "assumptions": [...],  # Any preprocessing assumptions made
                "cascading_effect": {...}  # Info about the cascade
            }
        """
        if not self._is_trained:
            raise RuntimeError("Models must be trained before prediction")
        
        # Preprocess all metrics
        env_metrics, health_metrics, food_metrics, assumptions = preprocess_all_metrics(metrics)
        
        # =====================================================================
        # STEP 1: Predict Environmental Risk
        # =====================================================================
        X_env = np.array([[
            env_metrics['aqi'],
            env_metrics['traffic_density'],
            env_metrics['temperature'],
            env_metrics['rainfall']
        ]])
        
        env_result = self.env_model.predict_with_proba(X_env)
        env_probs = {
            'low': float(env_result['probabilities']['low'][0]),
            'medium': float(env_result['probabilities']['medium'][0]),
            'high': float(env_result['probabilities']['high'][0])
        }
        env_risk_class = env_result['class'][0]
        env_high_prob = env_probs['high']
        
        # =====================================================================
        # STEP 2: Predict Health Risk WITH CASCADING P_env
        # This is the key innovation - P_env causally conditions P_health
        # =====================================================================
        
        # Inject environmental risk probability into health prediction
        health_metrics['environmental_risk_prob'] = env_high_prob
        
        X_health = np.array([[
            health_metrics['aqi'],
            health_metrics['hospital_load'],
            health_metrics['respiratory_cases'],
            health_metrics['temperature'],
            health_metrics['environmental_risk_prob']  # CASCADING INPUT
        ]])
        
        health_result = self.health_model.predict_with_proba(X_health)
        health_probs = {
            'low': float(health_result['probabilities']['low'][0]),
            'medium': float(health_result['probabilities']['medium'][0]),
            'high': float(health_result['probabilities']['high'][0])
        }
        health_risk_class = health_result['class'][0]
        health_high_prob = health_probs['high']
        
        # =====================================================================
        # STEP 3: Predict Food Security Risk (Independent/Parallel)
        # =====================================================================
        X_food = np.array([[
            food_metrics['crop_supply_index'],
            food_metrics['food_price_index'],
            food_metrics['rainfall'],
            food_metrics['temperature'],
            food_metrics['supply_disruption_events']
        ]])
        
        food_result = self.food_model.predict_with_proba(X_food)
        food_probs = {
            'low': float(food_result['probabilities']['low'][0]),
            'medium': float(food_result['probabilities']['medium'][0]),
            'high': float(food_result['probabilities']['high'][0])
        }
        food_risk_class = food_result['class'][0]
        food_high_prob = food_probs['high']
        
        # =====================================================================
        # STEP 4: Calculate Resilience Score (0-100)
        # =====================================================================
        resilience_score = self._calculate_resilience_score(
            env_high_prob, health_high_prob, food_high_prob
        )
        
        # =====================================================================
        # STEP 5: Calculate Confidence Scores
        # =====================================================================
        env_confidence = self._calculate_confidence(list(env_probs.values()))
        health_confidence = self._calculate_confidence(list(health_probs.values()))
        food_confidence = self._calculate_confidence(list(food_probs.values()))
        
        # =====================================================================
        # BUILD OUTPUT
        # =====================================================================
        return {
            "environmental": {
                "risk": env_risk_class,
                "prob": env_high_prob,
                "probabilities": env_probs
            },
            "health": {
                "risk": health_risk_class,
                "prob": health_high_prob,
                "probabilities": health_probs
            },
            "food_security": {
                "risk": food_risk_class,
                "prob": food_high_prob,
                "probabilities": food_probs
            },
            "resilience_score": resilience_score,
            "confidence": {
                "environmental": env_confidence,
                "health": health_confidence,
                "food_security": food_confidence
            },
            "cascading_effect": {
                "env_risk_injected_to_health": env_high_prob,
                "description": f"Environmental risk probability ({env_high_prob:.2%}) was used as input to health model"
            },
            "assumptions": assumptions if assumptions else None
        }
    
    def _calculate_resilience_score(
        self,
        env_high_prob: float,
        health_high_prob: float,
        food_high_prob: float
    ) -> int:
        """
        Calculate resilience score (0-100).
        
        Higher risk probabilities = Lower resilience
        
        Formula:
            resilience = 100 - weighted_sum(risk_probabilities) * 100
        
        Weights:
            - Environmental: 35%
            - Health: 40% (highest weight - public health priority)
            - Food: 25%
        """
        weighted_risk = (
            self.RESILIENCE_WEIGHTS['environmental'] * env_high_prob +
            self.RESILIENCE_WEIGHTS['health'] * health_high_prob +
            self.RESILIENCE_WEIGHTS['food'] * food_high_prob
        )
        
        # Convert to resilience (inverse of risk)
        resilience = 100 * (1 - weighted_risk)
        
        # Ensure valid range
        return int(max(0, min(100, resilience)))
    
    def _calculate_confidence(self, probabilities: List[float]) -> float:
        """
        Calculate prediction confidence score.
        
        Uses two metrics:
        1. Entropy-based: Lower entropy = higher confidence
        2. Class separation: Larger margin = higher confidence
        
        Combined into single score in [0, 1].
        """
        probs = np.array(probabilities)
        probs = np.clip(probs, 1e-10, 1.0)  # Avoid log(0)
        
        # Normalize if needed
        probs = probs / probs.sum()
        
        # Entropy-based confidence (max entropy for 3 classes is log(3) ≈ 1.1)
        entropy = -np.sum(probs * np.log(probs))
        max_entropy = np.log(len(probs))
        entropy_confidence = 1 - (entropy / max_entropy)
        
        # Class separation margin (difference between top two predictions)
        sorted_probs = np.sort(probs)[::-1]
        margin = sorted_probs[0] - sorted_probs[1] if len(sorted_probs) > 1 else sorted_probs[0]
        margin_confidence = margin  # Already in [0, 1]
        
        # Combine (weighted average)
        confidence = 0.6 * entropy_confidence + 0.4 * margin_confidence
        
        return round(float(confidence), 3)
    
    # =========================================================================
    # PART 2: POLICY-DRIVEN SCENARIO SIMULATION
    # =========================================================================
    
    def run_policy_scenario(
        self,
        baseline_metrics: Dict[str, Any],
        policy_adjustments: Dict[str, Any]
    ) -> Dict:
        """
        Run counterfactual policy simulation.
        
        Compares baseline predictions with post-intervention predictions.
        
        Args:
            baseline_metrics: Current state metrics
            policy_adjustments: Dictionary of policy interventions:
                Environmental:
                    - traffic_reduction: float (0-1, e.g., 0.3 = 30% reduction)
                    - aqi_cap: float (max AQI after regulation)
                    - emission_control: float (0-1, emission reduction factor)
                Health:
                    - surge_capacity: float (0-1, e.g., 0.2 = 20% more capacity)
                    - emergency_staffing: float (0-1, staff increase)
                    - infrastructure: float (0-1, infrastructure improvement)
                Food:
                    - import_stabilization: float (0-1, import increase)
                    - subsidy_rate: float (0-1, price subsidy)
                    - supply_chain_resilience: float (0-1, resilience investment)
        
        Returns:
            Dictionary with:
            - baseline: Baseline risk predictions
            - intervention: Post-intervention predictions
            - delta: Absolute risk changes
            - percent_change: Percentage risk changes
            - policies_applied: List of policies that were applied
        """
        if not self._is_trained:
            raise RuntimeError("Models must be trained before simulation")
        
        # Get baseline predictions
        baseline = self.predict_cascading_risks(baseline_metrics)
        
        # Apply policy adjustments to create intervention scenario
        intervention_metrics = self._apply_policy_adjustments(
            baseline_metrics, policy_adjustments
        )
        
        # Get intervention predictions
        intervention = self.predict_cascading_risks(intervention_metrics)
        
        # Calculate deltas
        delta = {
            'environmental': baseline['environmental']['prob'] - intervention['environmental']['prob'],
            'health': baseline['health']['prob'] - intervention['health']['prob'],
            'food_security': baseline['food_security']['prob'] - intervention['food_security']['prob'],
            'resilience_score': intervention['resilience_score'] - baseline['resilience_score']
        }
        
        # Calculate percentage changes
        def safe_pct_change(baseline_val, new_val):
            if baseline_val == 0:
                return 0.0
            return ((baseline_val - new_val) / baseline_val) * 100
        
        percent_change = {
            'environmental': safe_pct_change(baseline['environmental']['prob'], intervention['environmental']['prob']),
            'health': safe_pct_change(baseline['health']['prob'], intervention['health']['prob']),
            'food_security': safe_pct_change(baseline['food_security']['prob'], intervention['food_security']['prob'])
        }
        
        # Identify which policies were applied
        policies_applied = list(policy_adjustments.keys())
        
        return {
            'baseline': baseline,
            'intervention': intervention,
            'delta': delta,
            'percent_change': percent_change,
            'policies_applied': policies_applied,
            'intervention_metrics': intervention_metrics
        }
    
    def _apply_policy_adjustments(
        self,
        metrics: Dict[str, Any],
        policy_adjustments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Apply policy adjustments to create counterfactual scenario.
        
        Modifies metrics based on policy interventions.
        """
        adjusted = dict(metrics)  # Copy
        
        # =====================================================================
        # ENVIRONMENTAL POLICIES
        # =====================================================================
        
        # Traffic reduction
        if 'traffic_reduction' in policy_adjustments:
            reduction = policy_adjustments['traffic_reduction']
            if 'traffic_density' in adjusted:
                # Deterministically reduce traffic level based on reduction percentage
                current = adjusted['traffic_density']
                # Strong reduction (>50%) drops traffic by 2 levels
                # Medium reduction (>25%) drops by 1 level
                if reduction >= 0.5 and current > 1:
                    adjusted['traffic_density'] = current - 2
                elif reduction >= 0.25 and current > 0:
                    adjusted['traffic_density'] = current - 1
                adjusted['traffic_density'] = max(0, adjusted['traffic_density'])
                
                # Also reduce AQI due to less traffic
                if 'aqi' in adjusted:
                    adjusted['aqi'] = adjusted['aqi'] * (1 - reduction * 0.3)
        
        # AQI cap (regulatory ceiling)
        if 'aqi_cap' in policy_adjustments:
            if 'aqi' in adjusted:
                adjusted['aqi'] = min(adjusted['aqi'], policy_adjustments['aqi_cap'])
        
        # Emission control
        if 'emission_control' in policy_adjustments:
            if 'aqi' in adjusted:
                adjusted['aqi'] = adjusted['aqi'] * (1 - policy_adjustments['emission_control'])
        
        # =====================================================================
        # HEALTH POLICIES
        # =====================================================================
        
        # Hospital surge capacity
        if 'surge_capacity' in policy_adjustments:
            if 'hospital_load' in adjusted:
                # More capacity = lower effective load
                adjusted['hospital_load'] = adjusted['hospital_load'] / (1 + policy_adjustments['surge_capacity'])
                adjusted['hospital_load'] = max(0.4, min(0.95, adjusted['hospital_load']))
        
        # Emergency staffing
        if 'emergency_staffing' in policy_adjustments:
            if 'hospital_load' in adjusted:
                # More staff = can handle more patients
                load_reduction = policy_adjustments['emergency_staffing'] * 0.5
                adjusted['hospital_load'] = adjusted['hospital_load'] * (1 - load_reduction)
                adjusted['hospital_load'] = max(0.4, min(0.95, adjusted['hospital_load']))
        
        # Infrastructure investment
        if 'infrastructure' in policy_adjustments:
            if 'hospital_load' in adjusted:
                adjusted['hospital_load'] = adjusted['hospital_load'] * (1 - policy_adjustments['infrastructure'] * 0.4)
            if 'respiratory_cases' in adjusted:
                adjusted['respiratory_cases'] = int(adjusted['respiratory_cases'] * (1 - policy_adjustments['infrastructure'] * 0.3))
        
        # =====================================================================
        # FOOD SECURITY POLICIES
        # =====================================================================
        
        # Import stabilization
        if 'import_stabilization' in policy_adjustments:
            if 'crop_supply_index' in adjusted:
                adjusted['crop_supply_index'] = adjusted['crop_supply_index'] * (1 + policy_adjustments['import_stabilization'])
                adjusted['crop_supply_index'] = min(100, adjusted['crop_supply_index'])
        
        # Subsidy mechanism
        if 'subsidy_rate' in policy_adjustments:
            if 'food_price_index' in adjusted:
                adjusted['food_price_index'] = adjusted['food_price_index'] * (1 - policy_adjustments['subsidy_rate'])
                adjusted['food_price_index'] = max(80, adjusted['food_price_index'])
        
        # Supply chain resilience
        if 'supply_chain_resilience' in policy_adjustments:
            if 'supply_disruption_events' in adjusted:
                reduction = policy_adjustments['supply_chain_resilience'] * 0.6
                adjusted['supply_disruption_events'] = max(0, int(adjusted['supply_disruption_events'] * (1 - reduction)))
            if 'food_price_index' in adjusted:
                adjusted['food_price_index'] = adjusted['food_price_index'] * (1 - policy_adjustments['supply_chain_resilience'] * 0.2)
        
        return adjusted
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    
    def get_training_info(self) -> Dict:
        """Return training information for all models."""
        return self._training_info
    
    def demo(self) -> str:
        """Run demonstration of cascading risk engine."""
        output = []
        output.append("=" * 70)
        output.append("CASCADING RISK ENGINE - PHASE 2 DEMONSTRATION")
        output.append("=" * 70)
        
        # Sample high-risk scenario
        metrics = {
            'aqi': 175,
            'traffic_density': 2,
            'temperature': 38,
            'rainfall': 5,
            'hospital_load': 0.82,
            'respiratory_cases': 450,
            'crop_supply_index': 58,
            'food_price_index': 135,
            'supply_disruption_events': 3
        }
        
        output.append("\n📊 INPUT METRICS (High-Stress Scenario)")
        output.append("-" * 50)
        output.append(f"  Environmental: AQI={metrics['aqi']}, Traffic=HIGH, Temp={metrics['temperature']}°C")
        output.append(f"  Health: Hospital Load={metrics['hospital_load']:.0%}, Cases={metrics['respiratory_cases']}")
        output.append(f"  Food: Supply={metrics['crop_supply_index']}, Price={metrics['food_price_index']}, Disruptions={metrics['supply_disruption_events']}")
        
        # Cascading prediction
        result = self.predict_cascading_risks(metrics)
        
        output.append("\n🔄 CASCADING RISK PREDICTION")
        output.append("-" * 50)
        output.append(f"  Environmental Risk: {result['environmental']['risk'].upper()} ({result['environmental']['prob']:.1%})")
        output.append(f"  Health Risk:        {result['health']['risk'].upper()} ({result['health']['prob']:.1%})")
        output.append(f"  Food Security Risk: {result['food_security']['risk'].upper()} ({result['food_security']['prob']:.1%})")
        output.append(f"\n  🎯 RESILIENCE SCORE: {result['resilience_score']}/100")
        
        output.append("\n  Confidence Scores:")
        output.append(f"    Environmental: {result['confidence']['environmental']:.0%}")
        output.append(f"    Health:        {result['confidence']['health']:.0%}")
        output.append(f"    Food Security: {result['confidence']['food_security']:.0%}")
        
        output.append(f"\n  ⚡ Cascading Effect: P_env={result['cascading_effect']['env_risk_injected_to_health']:.2%} → Health Model")
        
        # Policy simulation
        output.append("\n📋 POLICY SCENARIO SIMULATION")
        output.append("-" * 50)
        
        policy = {
            'traffic_reduction': 0.35,
            'surge_capacity': 0.25,
            'subsidy_rate': 0.15
        }
        output.append(f"  Policies Applied:")
        output.append(f"    - 35% Traffic Reduction")
        output.append(f"    - 25% Hospital Surge Capacity")
        output.append(f"    - 15% Food Price Subsidy")
        
        scenario = self.run_policy_scenario(metrics, policy)
        
        output.append("\n  Risk Changes (Baseline → Intervention):")
        output.append(f"    Environmental: {scenario['baseline']['environmental']['prob']:.1%} → {scenario['intervention']['environmental']['prob']:.1%} ({scenario['percent_change']['environmental']:+.1f}%)")
        output.append(f"    Health:        {scenario['baseline']['health']['prob']:.1%} → {scenario['intervention']['health']['prob']:.1%} ({scenario['percent_change']['health']:+.1f}%)")
        output.append(f"    Food Security: {scenario['baseline']['food_security']['prob']:.1%} → {scenario['intervention']['food_security']['prob']:.1%} ({scenario['percent_change']['food_security']:+.1f}%)")
        output.append(f"\n  Resilience Improvement: {scenario['baseline']['resilience_score']} → {scenario['intervention']['resilience_score']} (+{scenario['delta']['resilience_score']})")
        
        output.append("\n" + "=" * 70)
        output.append("Phase 2 Complete - Cascading Risk Engine Ready!")
        output.append("=" * 70)
        
        return "\n".join(output)


# Convenience function for direct import
def predict_cascading_risks(metrics: Dict[str, Any], engine: Optional[CascadingRiskEngine] = None) -> Dict:
    """
    Standalone function for cascading risk prediction.
    
    Args:
        metrics: Input metrics dictionary
        engine: Optional pre-initialized engine (creates new if None)
    
    Returns:
        Cascading risk prediction results
    """
    if engine is None:
        engine = CascadingRiskEngine()
    return engine.predict_cascading_risks(metrics)


def run_policy_scenario(
    baseline_metrics: Dict[str, Any],
    policy_adjustments: Dict[str, Any],
    engine: Optional[CascadingRiskEngine] = None
) -> Dict:
    """
    Standalone function for policy scenario simulation.
    
    Args:
        baseline_metrics: Current state metrics
        policy_adjustments: Policy intervention parameters
        engine: Optional pre-initialized engine (creates new if None)
    
    Returns:
        Policy scenario comparison results
    """
    if engine is None:
        engine = CascadingRiskEngine()
    return engine.run_policy_scenario(baseline_metrics, policy_adjustments)


if __name__ == "__main__":
    # Run demo when executed directly
    import os
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_dir)
    
    engine = CascadingRiskEngine()
    print(engine.demo())
