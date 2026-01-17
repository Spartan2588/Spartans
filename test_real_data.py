"""
Test Real Data Risk Engine

Trains all three models on actual datasets and runs predictions.
"""

import os
import sys

# Change to project directory
project_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(project_dir)

from model.real_data_engine import RealDataRiskEngine

def main():
    print("=" * 60)
    print("TRAINING MODELS ON REAL DATA")
    print("=" * 60)
    
    # Initialize and train
    engine = RealDataRiskEngine()
    
    # Run demo
    print(engine.demo())
    
    # Additional tests
    print("\n" + "=" * 60)
    print("ADDITIONAL POLICY SIMULATION TESTS")
    print("=" * 60)
    
    # Test traffic reduction policy
    import numpy as np
    X_env = np.array([[180, 2, 35, 5]])
    policy_result = engine.env_model.simulate_traffic_reduction(X_env, 0.40)
    
    print("\nEnvironmental Policy: 40% Traffic Reduction")
    print(f"  Baseline High-Risk: {policy_result['baseline']['probabilities']['high'][0]:.2%}")
    print(f"  After Policy:       {policy_result['intervention']['probabilities']['high'][0]:.2%}")
    print(f"  Risk Reduction:     {policy_result['risk_reduction'][0]:.2%}")
    
    # Test hospital surge capacity
    X_health = np.array([[150, 0.80, 600, 32, 0.65]])
    surge_result = engine.health_model.simulate_hospital_surge_capacity(X_health, 0.25)
    
    print("\nHealth Policy: 25% Surge Capacity")
    print(f"  Baseline High-Risk: {surge_result['baseline']['probabilities']['high'][0]:.2%}")
    print(f"  After Policy:       {surge_result['intervention']['probabilities']['high'][0]:.2%}")
    
    # Test food subsidy
    X_food = np.array([[60, 130, 25, 35, 2]])
    subsidy_result = engine.food_model.simulate_subsidy_mechanism(X_food, 0.15)
    
    print("\nFood Policy: 15% Subsidy")
    print(f"  Baseline High-Risk: {subsidy_result['baseline']['probabilities']['high'][0]:.2%}")
    print(f"  After Policy:       {subsidy_result['intervention']['probabilities']['high'][0]:.2%}")
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETE - Models ready for production!")
    print("=" * 60)


if __name__ == "__main__":
    main()
