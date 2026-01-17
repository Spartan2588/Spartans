# Smart City Risk Platform - ML/AI Engine

Multi-domain probabilistic risk prediction system trained on **real datasets**.

## Requirements

```
numpy>=1.20.0
pandas>=1.3.0
scikit-learn>=1.0.0
```

## Installation

```bash
pip install numpy pandas scikit-learn
```

## Quick Start

### Train on Real Data (Recommended)
```python
from model import RealDataRiskEngine

# Initialize and train on real datasets
engine = RealDataRiskEngine()

# Make predictions
env_result = engine.predict_environmental(aqi=150, traffic_density=2, temperature=32, rainfall=5)
print(f"Environmental Risk: {env_result['risk_class']}")
```

### Train on Synthetic Data
```python
from model import RiskEngine

engine = RiskEngine()  # Uses synthetic data
print(engine.demo())
```

## Datasets

| Dataset | File | Used For |
|---------|------|----------|
| Traffic Volume | `datasets/archive1/TrafficVolumeData.csv` | Environmental Model |
| India AQI | `datasets/archive3/aqi_india_38cols_knn_final.csv` | Environmental Model |
| Hospital Respiratory | `raw_weekly_hospital_respiratory_data_2020_2024.csv` | Health Model |
| Agriculture Prices | `datasets/archive2/Agriculture_price_dataset.csv` | Food Security Model |

## Project Structure

```
model/
├── __init__.py              # Main exports
├── risk_engine.py           # RiskEngine (synthetic data)
├── real_data_engine.py      # RealDataRiskEngine (real data)
├── data_generators/
│   ├── environmental_data.py    # Synthetic generator
│   ├── health_data.py           # Synthetic generator
│   ├── food_security_data.py    # Synthetic generator
│   └── real_data_loaders.py     # Real data loaders
└── models/
    ├── base_model.py            # Calibration wrapper
    ├── environmental_model.py   # Policy simulation hooks
    ├── health_model.py          # Healthcare policy hooks
    └── food_security_model.py   # Food policy hooks
```

## Models

### 1. Environmental Risk Model (GaussianNB)
- **Inputs**: AQI, traffic_density, temperature, rainfall
- **Output**: Risk class (low/medium/high) + calibrated probabilities
- **Policy Hooks**: Traffic reduction, AQI regulation, emission controls

### 2. Health Risk Model (RandomForest)
- **Inputs**: AQI, hospital_load, respiratory_cases, temperature, environmental_risk_prob
- **Output**: Risk class + calibrated probabilities
- **Policy Hooks**: Hospital surge capacity, emergency staffing, infrastructure investment
- **Cascading**: Takes environmental risk as input

### 3. Food Security Model (GaussianNB)
- **Inputs**: crop_supply_index, food_price_index, rainfall, temperature, supply_disruption_events
- **Output**: Risk class + calibrated probabilities
- **Policy Hooks**: Import stabilization, subsidies, supply chain resilience

## Features

- **Cascading Risk Inference**: Environmental risk (P_env) propagates to Health model
- **Policy Simulation**: Compare baseline vs intervention scenarios
- **Real Data Training**: Models trained on actual Traffic, Hospital, and Agriculture datasets
- **Probability Calibration**: All models use `CalibratedClassifierCV` for reliable probability outputs
- **Confidence Scoring**: Entropy-based + margin-based confidence metrics
- **Resilience Score**: Weighted aggregate (0-100) of all risk domains

## Running Tests

```bash
# Test Phase 1 models
python test_real_data.py

# Test Phase 2 cascading engine
python test_cascading_engine.py

# Verify all models
python verify_models.py
```

## Phase 2 - Cascading Risk Engine

The core differentiator is the directed probabilistic system:

```
Environmental Stress → Environmental Risk (P_env)
                                ↓
                       Health Risk (P_health | P_env)

Environmental Stress → Food Security Risk (P_food)
```

### Cascading Inference

```python
from model import CascadingRiskEngine

engine = CascadingRiskEngine()

result = engine.predict_cascading_risks({
    'aqi': 175, 'traffic_density': 2, 'temperature': 38,
    'hospital_load': 0.82, 'respiratory_cases': 450,
    'crop_supply_index': 58, 'food_price_index': 135
})

print(f"Environmental: {result['environmental']['risk']} ({result['environmental']['prob']:.1%})")
print(f"Health:        {result['health']['risk']} ({result['health']['prob']:.1%})")
print(f"Resilience:    {result['resilience_score']}/100")
```

### Policy Simulation

```python
scenario = engine.run_policy_scenario(
    baseline_metrics=metrics,
    policy_adjustments={
        'traffic_reduction': 0.40,   # 40% traffic reduction
        'surge_capacity': 0.25,       # 25% hospital surge capacity
        'subsidy_rate': 0.15          # 15% food subsidy
    }
)

print(f"Baseline Resilience: {scenario['baseline']['resilience_score']}")
print(f"After Policy:        {scenario['intervention']['resilience_score']}")
```
